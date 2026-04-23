import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password, deviceId } = req.body;

      if (!username || !password || !deviceId) {
        return res.status(400).json({ error: 'Missing credentials or deviceId' });
      }

      const userId = username; // Mock logic — replace with real credential lookup
      const tokens = await authService.login(userId, deviceId);

      return res.status(200).json(tokens);
    } catch (error) {
      console.error('Login error', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { userId, deviceId, jti } = (req as any).user;
      await authService.logout(userId, deviceId, jti);
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

