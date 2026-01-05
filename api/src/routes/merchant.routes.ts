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
 *     responses:
 *       200:
 *         description: Détails du partenaire
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
 *     responses:
 *       201:
 *         description: Partenaire créé
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
 *     responses:
 *       200:
 *         description: Prix ajouté/mis à jour
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
 *     responses:
 *       200:
 *         description: Partenaire mis à jour
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
 *     responses:
 *       200:
 *         description: Partenaire supprimé
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

