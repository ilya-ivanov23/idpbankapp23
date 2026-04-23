import { Request, Response } from 'express';
import { TransactionService } from './transaction.service';

const transactionService = new TransactionService();

export class TransactionController {
  async transfer(req: Request, res: Response) {
    try {
      const { toAccount, amount, currency } = req.body;
      const { userId } = (req as any).user; // Injected by authGuard middleware

      // Validate request payload
      if (!toAccount || !amount || !currency) {
        return res.status(400).json({ error: 'Missing required fields: toAccount, amount, currency' });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than zero' });
      }

      // Build and publish the transfer event to Kafka
      const { eventId } = await transactionService.publishTransferEvent(userId, toAccount, amount, currency);

      // Return 202 Accepted (API-First FinTech standard)
      // The server has accepted the request; processing happens asynchronously
      return res.status(202).json({
        message: 'Transfer accepted for processing',
        eventId,
        status: 'PROCESSING'
      });

    } catch (error) {
      console.error('Transaction initiation error:', error);
      return res.status(500).json({ error: 'Failed to process transaction request' });
    }
  }
}

