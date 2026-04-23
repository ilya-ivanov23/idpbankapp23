import express, { Router } from 'express';
import { StripeController } from './stripe.controller';
import { authGuard } from '../../shared/middleware/auth.middleware';

const router = Router();
const stripeController = new StripeController();

// POST /api/wallet/checkout — protected, creates a Stripe Checkout Session and returns payment URL
// express.json() is added here explicitly because Stripe routes are registered BEFORE the global json middleware
router.post('/checkout', express.json(), authGuard, stripeController.createCheckoutSession.bind(stripeController));

// IMPORTANT: Using express.raw() because Stripe validates its signature against the raw request body
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeController.webhook.bind(stripeController)
);

export default router;
