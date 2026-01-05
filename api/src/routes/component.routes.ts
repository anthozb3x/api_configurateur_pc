import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Component from '../models/Component.model';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/components:
 *   get:
 *     summary: Liste tous les composants avec filtres optionnels
 *     tags: [Components]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des composants
 */
router.get(
  '/',
  [
    query('category').optional().isMongoId(),
    query('brand').optional().trim(),
    query('search').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { category, brand, search } = req.query;
      const filter: any = {};

      if (category) {
        filter.category = category;
      }

      if (brand) {
        filter.brand = new RegExp(brand as string, 'i');
      }

      if (search) {
        filter.$text = { $search: search as string };
      }

      const components = await Component.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 });

      res.json(components);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/components/{id}:
 *   get:
 *     summary: Récupère un composant par son ID
 *     tags: [Components]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du composant
 *       404:
 *         description: Composant non trouvé
 */
router.get(
  '/:id',
  async (req, res) => {
    try {
      const component = await Component.findById(req.params.id)
        .populate('category', 'name slug');

      if (!component) {
        return res.status(404).json({ message: 'Composant non trouvé' });
      }

      res.json(component);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/components:
 *   post:
 *     summary: Crée un nouveau composant (Admin uniquement)
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - title
 *               - brand
 *               - model
 *             properties:
 *               category:
 *                 type: string
 *               title:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               description:
 *                 type: string
 *               specifications:
 *                 type: object
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Composant créé avec succès
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('category').isMongoId().withMessage('Catégorie invalide'),
    body('title').trim().notEmpty().withMessage('Le titre est requis'),
    body('brand').trim().notEmpty().withMessage('La marque est requise'),
    body('model').trim().notEmpty().withMessage('Le modèle est requis'),
    body('description').optional().trim(),
    body('specifications').optional().isObject(),
    body('imageUrl').optional().isURL(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const component = new Component(req.body);
      await component.save();
      await component.populate('category', 'name slug');

      res.status(201).json(component);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/components/{id}:
 *   put:
 *     summary: Met à jour un composant (Admin uniquement)
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Composant mis à jour
 *       404:
 *         description: Composant non trouvé
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('category').optional().isMongoId(),
    body('title').optional().trim().notEmpty(),
    body('brand').optional().trim().notEmpty(),
    body('model').optional().trim().notEmpty(),
    body('imageUrl').optional().isURL(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const component = await Component.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('category', 'name slug');

      if (!component) {
        return res.status(404).json({ message: 'Composant non trouvé' });
      }

      res.json(component);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/components/{id}:
 *   delete:
 *     summary: Supprime un composant (Admin uniquement)
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Composant supprimé
 *       404:
 *         description: Composant non trouvé
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const component = await Component.findByIdAndDelete(req.params.id);
      if (!component) {
        return res.status(404).json({ message: 'Composant non trouvé' });
      }
      res.json({ message: 'Composant supprimé avec succès' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

