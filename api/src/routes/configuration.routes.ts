import express, { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import PDFDocument from 'pdfkit';
import Configuration from '../models/Configuration.model';
import Component from '../models/Component.model';
import Merchant from '../models/Merchant.model';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/configurations:
 *   get:
 *     summary: Liste les configurations de l'utilisateur connecté ou toutes (Admin)
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des configurations
 */
router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const filter: any = {};

      // Admin can see all, users see only their own
      if (req.user?.role !== 'admin') {
        filter.user = req.user?._id;
      } else if (req.query.userId) {
        filter.user = req.query.userId;
      }

      const configurations = await Configuration.find(filter)
        .populate('user', 'firstName lastName email')
        .populate({
          path: 'components.component',
          populate: { path: 'category', select: 'name slug' },
        })
        .populate('components.selectedMerchant', 'name websiteUrl')
        .sort({ createdAt: -1 });

      res.json(configurations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/configurations/{id}:
 *   get:
 *     summary: Récupère une configuration par son ID
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la configuration
 *     responses:
 *       200:
 *         description: Détails de la configuration
 *       404:
 *         description: Configuration non trouvée
 *       403:
 *         description: Accès refusé
 *       401:
 *         description: Non authentifié
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const configuration = await Configuration.findById(req.params.id)
        .populate('user', 'firstName lastName email')
        .populate({
          path: 'components.component',
          populate: { path: 'category', select: 'name slug' },
        })
        .populate('components.selectedMerchant', 'name websiteUrl logoUrl');

      if (!configuration) {
        return res.status(404).json({ message: 'Configuration non trouvée' });
      }

      // Check access: user can only see their own configs unless admin
      if (
        req.user?.role !== 'admin' &&
        configuration.user._id.toString() !== req.user?._id.toString()
      ) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      res.json(configuration);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/configurations:
 *   post:
 *     summary: Crée une nouvelle configuration
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - components
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Configuration Gaming"
 *               components:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - component
 *                     - quantity
 *                   properties:
 *                     component:
 *                       type: string
 *                       format: mongoId
 *                       example: "507f1f77bcf86cd799439011"
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 1
 *                     selectedMerchant:
 *                       type: string
 *                       format: mongoId
 *                       example: "507f1f77bcf86cd799439012"
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       example: 299.99
 *               currency:
 *                 type: string
 *                 default: "EUR"
 *                 example: "EUR"
 *     responses:
 *       201:
 *         description: Configuration créée
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 */
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('components').isArray({ min: 1 }).withMessage('Au moins un composant est requis'),
    body('components.*.component').isMongoId(),
    body('components.*.quantity').isInt({ min: 1 }),
    body('components.*.selectedMerchant').optional().isMongoId(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, components, currency } = req.body;
      let totalCost = 0;

      // Calculate total cost
      for (const comp of components) {
        const component = await Component.findById(comp.component);
        if (!component) {
          return res.status(400).json({
            message: `Composant ${comp.component} non trouvé`,
          });
        }

        let price = 0;

        // If merchant is selected, get price from merchant
        if (comp.selectedMerchant) {
          const merchant = await Merchant.findById(comp.selectedMerchant);
          if (merchant) {
            const merchantPrice = merchant.prices.find(
              (p) => p.component.toString() === comp.component
            );
            if (merchantPrice) {
              price = merchantPrice.price;
            }
          }
        }

        // If no price found from merchant, try to use price from request body
        if (price === 0 && comp.price) {
          price = comp.price;
        }

        // If still no price, use component's default price
        if (price === 0 && (component as any).price) {
          price = (component as any).price;
        }

        comp.price = price;
        totalCost += price * comp.quantity;
      }

      const configuration = new Configuration({
        user: req.user?._id,
        name,
        components,
        totalCost,
        currency: currency || 'EUR',
      });

      await configuration.save();
      await configuration.populate({
        path: 'components.component',
        populate: { path: 'category', select: 'name slug' },
      });

      res.status(201).json(configuration);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/configurations/{id}:
 *   put:
 *     summary: Met à jour une configuration
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la configuration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Configuration Gaming"
 *               components:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - component
 *                     - quantity
 *                   properties:
 *                     component:
 *                       type: string
 *                       format: mongoId
 *                       example: "507f1f77bcf86cd799439011"
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 1
 *                     selectedMerchant:
 *                       type: string
 *                       format: mongoId
 *                       example: "507f1f77bcf86cd799439012"
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       example: 299.99
 *               currency:
 *                 type: string
 *                 example: "EUR"
 *     responses:
 *       200:
 *         description: Configuration mise à jour
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Configuration non trouvée
 *       403:
 *         description: Accès refusé
 *       401:
 *         description: Non authentifié
 */
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('components').optional().isArray({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const configuration = await Configuration.findById(req.params.id);
      if (!configuration) {
        return res.status(404).json({ message: 'Configuration non trouvée' });
      }

      // Check access
      if (
        req.user?.role !== 'admin' &&
        configuration.user.toString() !== req.user?._id.toString()
      ) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      // Recalculate total if components changed
      if (req.body.components) {
        let totalCost = 0;
        for (const comp of req.body.components) {
          const component = await Component.findById(comp.component);
          if (!component) {
            return res.status(400).json({
              message: `Composant ${comp.component} non trouvé`,
            });
          }

          let price = 0;

          // If merchant is selected, get price from merchant
          if (comp.selectedMerchant) {
            const merchant = await Merchant.findById(comp.selectedMerchant);
            if (merchant) {
              const merchantPrice = merchant.prices.find(
                (p) => p.component.toString() === comp.component
              );
              if (merchantPrice) {
                price = merchantPrice.price;
              }
            }
          }

          // If no price found from merchant, try to use price from request body
          if (price === 0 && comp.price) {
            price = comp.price;
          }

          // If still no price, use component's default price
          if (price === 0 && (component as any).price) {
            price = (component as any).price;
          }

          comp.price = price;
          totalCost += price * (comp.quantity || 1);
        }
        req.body.totalCost = totalCost;
      }

      Object.assign(configuration, req.body);
      await configuration.save();
      await configuration.populate({
        path: 'components.component',
        populate: { path: 'category', select: 'name slug' },
      });

      res.json(configuration);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/configurations/{id}:
 *   delete:
 *     summary: Supprime une configuration
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la configuration
 *     responses:
 *       200:
 *         description: Configuration supprimée
 *       404:
 *         description: Configuration non trouvée
 *       403:
 *         description: Accès refusé
 *       401:
 *         description: Non authentifié
 */
router.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const configuration = await Configuration.findById(req.params.id);
      if (!configuration) {
        return res.status(404).json({ message: 'Configuration non trouvée' });
      }

      // Check access
      if (
        req.user?.role !== 'admin' &&
        configuration.user.toString() !== req.user?._id.toString()
      ) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      await configuration.deleteOne();
      res.json({ message: 'Configuration supprimée avec succès' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/configurations/{id}/export-pdf:
 *   get:
 *     summary: Exporte une configuration au format PDF
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la configuration
 *     responses:
 *       200:
 *         description: Fichier PDF généré
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Configuration non trouvée
 *       403:
 *         description: Accès refusé
 *       401:
 *         description: Non authentifié
 */
router.get(
  '/:id/export-pdf',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const configuration = await Configuration.findById(req.params.id)
        .populate('user', 'firstName lastName email')
        .populate({
          path: 'components.component',
          populate: { path: 'category', select: 'name slug' },
        })
        .populate('components.selectedMerchant', 'name websiteUrl logoUrl');

      if (!configuration) {
        return res.status(404).json({ message: 'Configuration non trouvée' });
      }

      // Check access
      if (
        req.user?.role !== 'admin' &&
        configuration.user._id.toString() !== req.user?._id.toString()
      ) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const filename = `configuration-${configuration.name.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.pdf`;

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Pipe PDF to response
      doc.pipe(res);

      // Add content to PDF
      doc.fontSize(20).text('Configuration PC', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Nom: ${configuration.name}`, { align: 'left' });
      doc.text(`Date: ${new Date(configuration.createdAt).toLocaleDateString('fr-FR')}`);
      doc.text(`Utilisateur: ${(configuration.user as any).firstName} ${(configuration.user as any).lastName}`);
      doc.moveDown();

      // Components table header
      doc.fontSize(12);
      doc.text('Liste des composants:', { underline: true });
      doc.moveDown(0.5);

      let yPosition = doc.y;
      const startX = 50;
      const colWidths = [200, 100, 80, 100];
      const headers = ['Composant', 'Quantité', 'Prix unit.', 'Total'];

      // Draw table headers
      doc.fontSize(10).font('Helvetica-Bold');
      let xPosition = startX;
      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition, { width: colWidths[index] });
        xPosition += colWidths[index];
      });

      // Draw line under headers
      yPosition += 20;
      doc.moveTo(startX, yPosition).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), yPosition).stroke();

      // Draw components
      doc.font('Helvetica');
      yPosition += 10;
      configuration.components.forEach((comp: any) => {
        const component = comp.component;
        const componentName = component
          ? `${component.brand} ${component.model}`
          : 'Composant supprimé';
        const quantity = comp.quantity || 1;
        const unitPrice = comp.price || 0;
        const total = unitPrice * quantity;

        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        xPosition = startX;
        doc.text(componentName, xPosition, yPosition, { width: colWidths[0] });
        xPosition += colWidths[0];
        doc.text(quantity.toString(), xPosition, yPosition, { width: colWidths[1] });
        xPosition += colWidths[1];
        doc.text(`${unitPrice.toFixed(2)} ${configuration.currency}`, xPosition, yPosition, {
          width: colWidths[2],
        });
        xPosition += colWidths[2];
        doc.text(`${total.toFixed(2)} ${configuration.currency}`, xPosition, yPosition, {
          width: colWidths[3],
        });

        yPosition += 20;
      });

      // Draw total line
      yPosition += 10;
      doc.moveTo(startX, yPosition).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), yPosition).stroke();
      yPosition += 10;

      // Total cost
      doc.fontSize(14).font('Helvetica-Bold');
      const totalX = startX + colWidths[0] + colWidths[1] + colWidths[2];
      doc.text(
        `Total: ${configuration.totalCost.toFixed(2)} ${configuration.currency}`,
        totalX,
        yPosition,
        { width: colWidths[3] }
      );

      // Footer
      doc.fontSize(8).font('Helvetica');
      doc.text(
        `Généré le ${new Date().toLocaleString('fr-FR')} - ConfigurateurPC.com`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      // Finalize PDF
      doc.end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;


