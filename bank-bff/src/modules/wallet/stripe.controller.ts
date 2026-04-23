import { Request, Response } from 'express';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { producer } from '../../shared/clients/kafka';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

export class StripeController {
  async webhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).send('Missing stripe-signature header');
    }

    let event: Stripe.Event;

    try {
      // 1. Валидация подписи (Security)
      event = stripe.webhooks.constructEvent(
        req.body, // Здесь должен быть сырой Buffer (Raw Body)
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    // 2. Обработка нужного события
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.client_reference_id;
      const amount = session.amount_total; // Stripe возвращает в центах
      const currency = session.currency?.toUpperCase();

      if (userId && amount && currency) {
        // 3. Интеграция с Kafka (Producer)
        const eventId = uuidv4();
        const payload = {
          eventId,
          userId,
          amount: amount / 100, // Конвертируем центы в нормальную валюту
          currency,
          timestamp: new Date().toISOString(),
          type: 'DEPOSIT_COMPLETED'
        };

        try {
          await producer.send({
            topic: 'bank-transactions',
            messages: [
              {
                key: userId, // Партицирование по userId для сохранения порядка!
                value: JSON.stringify(payload)
              }
            ]
          });
          console.log(`Deposit event ${eventId} published for user ${userId}`);
        } catch (kafkaError) {
          console.error('Failed to publish deposit event:', kafkaError);
          return res.status(500).send('Internal Server Error');
        }
      } else {
        console.warn('Checkout completed but missing vital metadata (userId, amount, currency)');
      }
    }

    // 4. Обязательный статус 200, чтобы Stripe знал, что мы всё получили
    res.status(200).send();
  }
}
