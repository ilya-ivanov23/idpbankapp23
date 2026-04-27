import Stripe from 'stripe';
import { env } from '../../config/env';

export const stripe: any = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-16.acacia' as any,
});
