import { v4 as uuidv4 } from 'uuid';
import { producer } from '../../shared/clients/kafka';

export class TransactionService {
  async publishTransferEvent(userId: string, toAccount: string, amount: number, currency: string) {
    const eventId = uuidv4();

    // Build the event payload for the Core microservice
    const payload = {
      eventId,
      userId,
      toAccount,
      amount,
      currency,
      timestamp: new Date().toISOString(),
      type: 'TRANSFER_INITIATED'
    };

    await producer.send({
      topic: 'bank-transactions',
      messages: [
        {
          key: userId, // Partition by userId to guarantee per-user transaction ordering
          value: JSON.stringify(payload)
        }
      ]
    });

    return { eventId, payload };
  }
}

