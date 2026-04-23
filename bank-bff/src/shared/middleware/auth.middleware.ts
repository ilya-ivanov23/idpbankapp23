import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { redisClient } from '../clients/redis';

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET as string) as any;

    // Проверка, не находится ли jti в черном списке
    const isRevoked = await redisClient.get(`revoked_token:${decoded.jti}`);
    if (isRevoked) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

