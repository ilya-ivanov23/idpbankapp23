import express, { Router } from 'express';
import { StripeController } from './stripe.controller';

const router = Router();
const stripeController = new StripeController();

// IMPORTANT: Using express.raw() because Stripe validates its signature against the raw request body
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeController.webhook.bind(stripeController)
);

export default router;
