import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { redisClient } from '../../shared/clients/redis';
import { sendOtpEmail } from '../../shared/clients/email';

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

  async generateAndSendOtp(email: string, userId: string): Promise<void> {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis with 5 minutes expiry
    const otpKey = `otp:${userId}`;
    await redisClient.setEx(otpKey, 5 * 60, otp);
    
    // Send email using Resend
    await sendOtpEmail(email, otp);
  }

  async verifyOtp(userId: string, inputOtp: string): Promise<boolean> {
    const otpKey = `otp:${userId}`;
    const storedOtp = await redisClient.get(otpKey);
    
    if (!storedOtp) {
      return false; // Expired or not found
    }
    
    if (storedOtp === inputOtp) {
      // Clear OTP after successful use
      await redisClient.del(otpKey);
      return true;
    }
    
    return false;
  }
}

