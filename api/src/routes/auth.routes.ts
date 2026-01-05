import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.model';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Create user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
      });

      await user.save();

      // Vérifier que JWT_SECRET est défini
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET n\'est pas défini dans les variables d\'environnement');
        return res.status(500).json({ message: 'Erreur de configuration du serveur' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id.toString() },
        jwtSecret as string,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string }
      );

      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error: any) {
      // Ne pas exposer les détails de l'erreur pour des raisons de sécurité
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({ message: 'Une erreur est survenue lors de l\'inscription' });
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants invalides
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user with password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      // Vérifier que JWT_SECRET est défini
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET n\'est pas défini dans les variables d\'environnement');
        return res.status(500).json({ message: 'Erreur de configuration du serveur' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id.toString() },
        jwtSecret as string,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string }
      );

      res.json({
        message: 'Connexion réussie',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error: any) {
      // Ne pas exposer les détails de l'erreur pour des raisons de sécurité
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({ message: 'Une erreur est survenue lors de la connexion' });
    }
  }
);

export default router;

