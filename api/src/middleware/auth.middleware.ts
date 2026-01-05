import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ message: 'Token d\'authentification manquant' });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || ''
    ) as { userId: string };

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(401).json({ message: 'Utilisateur non trouvé' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentification requise' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Accès refusé. Rôle administrateur requis' });
    return;
  }

  next();
};

