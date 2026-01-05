import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Category from '../models/Category.model';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Liste toutes les catégories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Liste des catégories
 */
router.get(
  '/',
  async (req, res) => {
    try {
      const categories = await Category.find().sort({ name: 1 });
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Récupère une catégorie par son ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails de la catégorie
 *       404:
 *         description: Catégorie non trouvée
 */
router.get(
  '/:id',
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crée une nouvelle catégorie (Admin uniquement)
 *     tags: [Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('description').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;
      const category = new Category({ name, description });
      await category.save();

      res.status(201).json(category);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Cette catégorie existe déjà' });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Met à jour une catégorie (Admin uniquement)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Catégorie mise à jour
 *       404:
 *         description: Catégorie non trouvée
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const category = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!category) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }

      res.json(category);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Supprime une catégorie (Admin uniquement)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Catégorie supprimée
 *       404:
 *         description: Catégorie non trouvée
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
      res.json({ message: 'Catégorie supprimée avec succès' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

