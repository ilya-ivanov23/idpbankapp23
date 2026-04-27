import { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../../config/env';

// A mock Sentry if the real one isn't configured
const Sentry = {
  captureMessage: (msg: string) => {
    console.log('[SENTRY MOCK] Support request logged:', msg);
  }
};

export class SettingsController {
  
  async submitSupportRequest(req: Request, res: Response) {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      Sentry.captureMessage(`Support Request from ${req.user?.email || 'Unknown'}: ${message}`);
      
      return res.status(200).json({ message: 'Support request received' });
    } catch (error) {
      console.error('Support error', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateLanguage(req: Request, res: Response) {
    try {
      const { language } = req.body;
      const userId = req.user?.userId;

      if (!language || !userId) {
        return res.status(400).json({ error: 'Language and valid user session required' });
      }

      await axios.patch(`${config.javaCoreUrl}/api/internal/users/${userId}/language`, { language });

      return res.status(200).json({ message: 'Language updated successfully' });
    } catch (error) {
      console.error('Update language error', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
