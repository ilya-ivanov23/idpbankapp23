import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../clients/redis';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { config } from '../../config/env';

export const securityGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amount = Number(req.body.amount || 0);
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized user' });
    }

    if (amount > 3000) {
      const otpCode = req.headers['x-otp-code'] as string;
      if (!otpCode) {
        return res.status(403).json({ error: 'OTP required for transactions over $3000. Please provide in x-otp-code header.' });
      }

      const otpKey = `otp:${userEmail}`;
      const storedOtp = await redisClient.get(otpKey);

      if (!storedOtp || storedOtp !== otpCode) {
        return res.status(403).json({ error: 'Invalid or expired OTP' });
      }

      // OTP matched, consume it
      await redisClient.del(otpKey);
    } else if (amount > 0 && amount <= 3000) {
      const pinCode = req.headers['x-pin'] as string;
      if (!pinCode) {
        return res.status(403).json({ error: 'PIN Code required for this operation. Please provide in x-pin header.' });
      }

      const javaResponse = await axios.get(`${config.javaCoreUrl}/api/internal/users/pin?email=${encodeURIComponent(userEmail)}`);
      const pinHash = javaResponse.data.pinHash;

      if (!pinHash) {
        return res.status(403).json({ error: 'User PIN not set' });
      }

      const isPinValid = await bcrypt.compare(pinCode, pinHash);
      if (!isPinValid) {
        return res.status(403).json({ error: 'Invalid PIN Code' });
      }
    }

    next();
  } catch (error) {
    console.error('Security Guard Error:', error);
    return res.status(500).json({ error: 'Internal server error during security check' });
  }
};
