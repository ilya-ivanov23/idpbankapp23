import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { redisClient } from '../../shared/clients/redis';
import { stripe } from '../../shared/clients/stripe';
import { resend } from '../../shared/clients/email';
import { config } from '../../config/env';

export class AuthController {

  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, dateOfBirth, address, city, postalCode, language } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      // Create Stripe Customer
      const customer = await stripe.customers.create({
        email,
        name: `${firstName || ''} ${lastName || ''}`.trim()
      });

      const userData = {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        firstName,
        lastName,
        dateOfBirth,
        address,
        city,
        postalCode,
        language: language || 'en',
        stripeCustomerId: customer.id
      };

      // Save to Redis for 10 minutes (600s)
      await redisClient.setEx(`temp_user:${email}`, 600, JSON.stringify(userData));

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await redisClient.setEx(`otp:${email}`, 300, otp);

      // Send OTP via email
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Use a verified sender in production
        to: email,
        subject: 'IDPBank OTP Verification',
        html: `<p>Your verification code is: <strong>${otp}</strong></p>`
      });

      return res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Register error', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ error: 'Missing email or otp' });
      }

      const savedOtp = await redisClient.get(`otp:${email}`);
      if (!savedOtp || savedOtp !== otp) {
        return res.status(401).json({ error: 'Invalid or expired OTP' });
      }

      const tempUserStr = await redisClient.get(`temp_user:${email}`);
      if (!tempUserStr) {
        return res.status(400).json({ error: 'User registration data expired' });
      }

      const userData = JSON.parse(tempUserStr);

      // Call Java Core to create user and grant welcome bonus
      const coreResponse = await axios.post(`${config.javaCoreUrl}/api/internal/users`, userData);
      
      // Clean up Redis
      await redisClient.del(`otp:${email}`);
      await redisClient.del(`temp_user:${email}`);

      // Generate JWTs
      const userId = coreResponse.data.id;
      const deviceId = uuidv4();
      const accessToken = jwt.sign({ userId, email, deviceId }, config.jwtSecret, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId, email, deviceId }, config.jwtSecret, { expiresIn: '7d' });

      return res.status(200).json({
        message: 'OTP verified, user created successfully',
        userId,
        accessToken,
        refreshToken
      });
    } catch (error: any) {
      console.error('OTP verify error', error.response?.data || error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async setPin(req: Request, res: Response) {
    try {
      const { userId, pin } = req.body;
      
      if (!userId || !pin || pin.length !== 4) {
        return res.status(400).json({ error: 'Invalid PIN' });
      }

      const pinHash = await bcrypt.hash(pin, 10);
      
      await axios.patch(`${config.javaCoreUrl}/api/internal/users/${userId}/pin`, { pinHash });
      
      return res.status(200).json({ message: 'PIN set successfully' });
    } catch (error: any) {
      console.error('Set PIN error', error.response?.data || error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createStripeConnection(req: Request, res: Response) {
    try {
      const { stripeCustomerId } = req.body;
      
      if (!stripeCustomerId) {
        return res.status(400).json({ error: 'Missing stripeCustomerId' });
      }

      const session = await stripe.financialConnections.sessions.create({
        account_holder: { type: 'customer', customer: stripeCustomerId },
        permissions: ['payment_method', 'balances'],
      });

      return res.status(200).json({ client_secret: session.client_secret });
    } catch (error) {
      console.error('Stripe connection error', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
