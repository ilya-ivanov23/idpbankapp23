import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { redisClient } from '../clients/redis';

export interface DecodedAuthToken {
  userId: string;
  deviceId: string;
  jti: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: DecodedAuthToken;
    }
  }
}

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const verifiedToken = jwt.verify(token, env.JWT_SECRET as string);
    if (typeof verifiedToken === 'string') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const decoded = verifiedToken as DecodedAuthToken;

    const isRevoked = await redisClient.get(`revoked_token:${decoded.jti}`);
    if (isRevoked) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
