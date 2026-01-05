import express from 'express';
import { body, validationResult } from 'express-validator';
import Merchant from '../models/Merchant.model';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/merchants:
 *   get:
 *     summary: Liste tous les partenaires marchands
 *     tags: [Merchants]
 *     responses:
 *       200:
 *         description: Liste des partenaires
 */
router.get(
  '/',
  async (req, res) => {
    try {
      const merchants = await Merchant.find({ isActive: true })
        .populate('prices.component', 'title brand model')
        .sort({ name: 1 });
      res.json(merchants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/merchants/{id}:
 *   get:
 *     summary: Récupère un partenaire par son ID
 *     tags: [Merchants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du partenaire marchand
 *     responses:
 *       200:
 *         description: Détails du partenaire
 *       404:
 *         description: Partenaire non trouvé
 */
router.get(
  '/:id',
  async (req, res) => {
    try {
      const merchant = await Merchant.findById(req.params.id)
        .populate('prices.component', 'title brand model category')
        .populate({
          path: 'prices.component',
          populate: { path: 'category', select: 'name slug' },
        });

      if (!merchant) {
        return res.status(404).json({ message: 'Partenaire non trouvé' });
      }

      res.json(merchant);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/merchants:
 *   post:
 *     summary: Crée un nouveau partenaire (Admin uniquement)
 *     tags: [Merchants]
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
 *               - websiteUrl
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Amazon"
 *               websiteUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.amazon.fr"
 *               logoUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/logo.png"
 *               commissionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 5.5
 *               affiliationConditions:
 *                 type: string
 *                 example: "Conditions d'affiliation..."
 *     responses:
 *       201:
 *         description: Partenaire créé
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('websiteUrl').isURL().withMessage('URL invalide'),
    body('logoUrl').optional().isURL(),
    body('commissionRate').optional().isFloat({ min: 0, max: 100 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const merchant = new Merchant(req.body);
      await merchant.save();

      res.status(201).json(merchant);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Ce partenaire existe déjà' });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/merchants/{id}/prices:
 *   post:
 *     summary: Ajoute ou met à jour un prix pour un composant (Admin uniquement)
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du partenaire marchand
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - component
 *               - price
 *             properties:
 *               component:
 *                 type: string
 *                 format: mongoId
 *                 example: "507f1f77bcf86cd799439011"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 299.99
 *               currency:
 *                 type: string
 *                 default: "EUR"
 *                 example: "EUR"
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/product"
 *     responses:
 *       200:
 *         description: Prix ajouté/mis à jour
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Partenaire non trouvé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.post(
  '/:id/prices',
  authenticate,
  requireAdmin,
  [
    body('component').isMongoId().withMessage('Composant invalide'),
    body('price').isFloat({ min: 0 }).withMessage('Prix invalide'),
    body('currency').optional().isString(),
    body('url').optional().isURL(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const merchant = await Merchant.findById(req.params.id);
      if (!merchant) {
        return res.status(404).json({ message: 'Partenaire non trouvé' });
      }

      const { component, price, currency, url } = req.body;

      // Check if price already exists for this component
      const existingPriceIndex = merchant.prices.findIndex(
        (p) => p.component.toString() === component
      );

      if (existingPriceIndex >= 0) {
        // Update existing price
        merchant.prices[existingPriceIndex].price = price;
        merchant.prices[existingPriceIndex].currency = currency || 'EUR';
        merchant.prices[existingPriceIndex].url = url;
        merchant.prices[existingPriceIndex].lastUpdated = new Date();
      } else {
        // Add new price
        merchant.prices.push({
          component,
          price,
          currency: currency || 'EUR',
          url,
          lastUpdated: new Date(),
        } as any);
      }

      await merchant.save();
      await merchant.populate('prices.component', 'title brand model');

      res.json(merchant);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/merchants/{id}:
 *   put:
 *     summary: Met à jour un partenaire (Admin uniquement)
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du partenaire marchand
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Amazon"
 *               websiteUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.amazon.fr"
 *               logoUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/logo.png"
 *               commissionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 5.5
 *               affiliationConditions:
 *                 type: string
 *                 example: "Conditions d'affiliation..."
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Partenaire mis à jour
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Partenaire non trouvé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('websiteUrl').optional().isURL(),
    body('logoUrl').optional().isURL(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const merchant = await Merchant.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!merchant) {
        return res.status(404).json({ message: 'Partenaire non trouvé' });
      }

      res.json(merchant);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/merchants/{id}:
 *   delete:
 *     summary: Supprime un partenaire (Admin uniquement)
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du partenaire marchand
 *     responses:
 *       200:
 *         description: Partenaire supprimé
 *       404:
 *         description: Partenaire non trouvé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const merchant = await Merchant.findByIdAndDelete(req.params.id);
      if (!merchant) {
        return res.status(404).json({ message: 'Partenaire non trouvé' });
      }
      res.json({ message: 'Partenaire supprimé avec succès' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;


