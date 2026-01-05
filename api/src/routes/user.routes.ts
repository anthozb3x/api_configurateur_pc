import express from 'express';
import { query } from 'express-validator';
import User from '../models/User.model';
import Configuration from '../models/Configuration.model';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Liste tous les utilisateurs (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  [
    query('search').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const { search } = req.query;
      const filter: any = {};

      if (search) {
        filter.$or = [
          { firstName: new RegExp(search as string, 'i') },
          { lastName: new RegExp(search as string, 'i') },
          { email: new RegExp(search as string, 'i') },
        ];
      }

      const users = await User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 });

      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupère un utilisateur par son ID avec ses configurations
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      // Users can only see their own profile unless admin
      if (
        req.user?.role !== 'admin' &&
        req.params.id !== req.user?._id.toString()
      ) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const user = await User.findById(req.params.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const configurations = await Configuration.find({ user: user._id })
        .populate({
          path: 'components.component',
          populate: { path: 'category', select: 'name slug' },
        })
        .sort({ createdAt: -1 });

      res.json({
        user,
        configurations,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

