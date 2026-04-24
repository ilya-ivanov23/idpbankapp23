import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../clients/redis';

/**
 * Security Guard:
 * - Demands OTP if the transaction amount is > 3000
 * - In real implementation, the frontend would pass OTP in headers (e.g., 'X-OTP-Code')
 * - We verify it here.
 * - PIN validation would typically be done by calling the core-engine or comparing a hash.
 */
export const securityGuard = async (req: Request, res: Response, next: NextFunction) => {
  const amount = Number(req.body.amount || 0);

  // Example: Check PIN if operation requires money
  // Assume PIN is sent in 'X-PIN-Code' header
  const pinCode = req.headers['x-pin-code'];
  if (amount > 0 && !pinCode) {
    return res.status(403).json({ error: 'PIN Code required for this operation' });
  }

  // Example: Check OTP if amount > $3000
  if (amount > 3000) {
    const otpCode = req.headers['x-otp-code'] as string;
    if (!otpCode) {
      return res.status(403).json({ error: 'OTP required for transactions over $3000. Please request an OTP and provide it in X-OTP-Code header.' });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' });
    }

    const otpKey = `otp:${userId}`;
    const storedOtp = await redisClient.get(otpKey);

    if (!storedOtp || storedOtp !== otpCode) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // OTP matched, consume it
    await redisClient.del(otpKey);
  }

  next();
};
