import express, { Router } from 'express';
import { StripeController } from './stripe.controller';

const router = Router();
const stripeController = new StripeController();

// ВАЖНО: Используем express.raw, потому что Stripe валидирует подпись по сырому телу запроса
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeController.webhook.bind(stripeController)
);

export default router;
