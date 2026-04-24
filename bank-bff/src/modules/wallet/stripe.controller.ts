import { Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../../config/env';
import { producer } from '../../shared/clients/kafka';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia' as any,
});

export class StripeController {
  /**
   * POST /api/wallet/checkout
   * Creates a Stripe Checkout Session and returns the hosted payment URL.
   * The frontend redirects the user to this URL to complete payment.
   */
  async createCheckoutSession(req: Request, res: Response) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, currency = 'usd' } = req.body;

    if (!amount || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive finite number' });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'blik'],
        mode: 'payment',
        // Pass userId so our webhook knows which user to credit
        client_reference_id: userId,
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: Math.round(amount * 100), // Convert to cents
              product_data: {
                name: 'Wallet Top-Up',
                description: `Adding ${currency.toUpperCase()} ${amount} to your IDP Bank wallet`,
              },
            },
            quantity: 1,
          },
        ],
        // Stripe will redirect the user here after payment
        success_url: `${process.env.FRONTEND_URL}/wallet?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL}/wallet?payment=cancelled`,
      } as any);

      return res.status(200).json({ url: session.url });
    } catch (error: any) {
      console.error('Failed to create Stripe checkout session:', error.message);
      return res.status(500).json({ error: 'Failed to initiate payment' });
    }
  }

  /**
   * POST /api/wallet/webhook
   * Receives Stripe webhook events and publishes deposit events to Kafka.
   */
  async webhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    const signature = Array.isArray(sig) ? sig[0] : sig;

    if (!signature) {
      return res.status(400).send('Missing stripe-signature header');
    }

    let event: any;

    try {
      // 1. Validate Stripe signature (guards against forged webhook requests)
      event = stripe.webhooks.constructEvent(
        req.body, // Must be the raw Buffer, not a parsed JSON object
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return res.status(400).send('Webhook signature verification failed');
    }

    // 2. Handle the payment event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;

      // CRITICAL CHECK: Ensure the payment is fully settled before crediting the user.
      // 'checkout.session.completed' fires for async methods (e.g. SEPA) before money is received.
      if (session.payment_status !== 'paid') {
        console.log(`Payment for session ${session.id} is not yet settled. Status: ${session.payment_status}`);
        return res.status(200).send();
      }

      const userId = session.client_reference_id;
      const amount = session.amount_total; // Stripe amounts are in the smallest currency unit (cents)
      const currency = session.currency?.toUpperCase();

      if (userId && amount !== undefined && amount !== null && currency) {
        // 3. Publish to Kafka
        // Using event.id from Stripe as the stable eventId guarantees idempotency:
        // if Stripe retries the webhook, the same event.id prevents double-crediting.
        const eventId = event.id;
        const payload = {
          eventId,
          userId,
          amount: amount / 100, // Convert from cents to the base currency unit
          currency,
          timestamp: new Date().toISOString(),
          type: 'DEPOSIT_COMPLETED'
        };

        try {
          await producer.send({
            topic: 'bank-transactions',
            messages: [
              {
                key: userId, // Partition by userId to guarantee per-user event ordering
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
        console.warn('Checkout completed but missing required metadata (userId, amount, currency)');
      }
    }

    // 4. Always respond 200 so Stripe knows the webhook was received successfully
    res.status(200).send();
  }
}
