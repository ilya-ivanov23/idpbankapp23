import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { redisClient } from '../../shared/clients/redis';

export class AuthService {
  async login(userId: string, deviceId: string) {
    const jti = uuidv4();

    const accessToken = jwt.sign(
      { userId, deviceId },
      env.JWT_SECRET as string,
      { expiresIn: '15m', jwtid: jti }
    );

    const refreshToken = jwt.sign(
      { userId, deviceId },
      env.JWT_REFRESH_SECRET as string,
      { expiresIn: '7d', jwtid: jti }
    );

    const sessionKey = `session:${userId}:${deviceId}`;
    await redisClient.setEx(sessionKey, 7 * 24 * 60 * 60, refreshToken);

    return { accessToken, refreshToken };
  }

  async logout(userId: string, deviceId: string, jti: string) {
    const sessionKey = `session:${userId}:${deviceId}`;
    await redisClient.del(sessionKey);
    await redisClient.setEx(`revoked_token:${jti}`, 15 * 60, 'revoked');
  }
}

