import { Request, Response } from 'express';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { producer } from '../../shared/clients/kafka';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia' as any,
});

export class StripeController {
  async webhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    const signature = Array.isArray(sig) ? sig[0] : sig;
    
    if (!signature) {
      return res.status(400).send('Missing stripe-signature header');
    }

    let event: any;

    try {
      // 1. Валидация подписи (Security)
      event = stripe.webhooks.constructEvent(
        req.body, // Здесь должен быть сырой Buffer (Raw Body)
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return res.status(400).send('Webhook signature verification failed');
    }

    // 2. Обработка нужного события
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;

      // КРИТИЧЕСКАЯ ПРОВЕРКА: Убеждаемся, что деньги реально списаны (защита от async payments)
      if (session.payment_status !== 'paid') {
        console.log(`Payment for session ${session.id} is not yet paid. Status: ${session.payment_status}`);
        return res.status(200).send();
      }

      const userId = session.client_reference_id;
      const amount = session.amount_total; // Stripe возвращает в центах
      const currency = session.currency?.toUpperCase();

      if (userId && amount !== undefined && amount !== null && currency) {
        // 3. Интеграция с Kafka (Producer)
        // Используем event.id от Stripe для 100% идемпотентности, чтобы не задвоить баланс при ретраях от Stripe
        const eventId = event.id;
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
