import express from 'express';
import { body, validationResult, query } from 'express-validator';
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
  async (req: AuthRequest, res) => {
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
 *     responses:
 *       200:
 *         description: Détails de la configuration
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res) => {
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
 *     responses:
 *       201:
 *         description: Configuration créée
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
  async (req: AuthRequest, res) => {
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

        // If no price found, use component's default price or 0
        if (price === 0 && comp.price) {
          price = comp.price;
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
 *     responses:
 *       200:
 *         description: Configuration mise à jour
 */
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('components').optional().isArray({ min: 1 }),
  ],
  async (req: AuthRequest, res) => {
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

          let price = comp.price || 0;
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
 *     responses:
 *       200:
 *         description: Configuration supprimée
 */
router.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res) => {
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

export default router;

