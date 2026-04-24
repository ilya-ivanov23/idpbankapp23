import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './modules/auth/auth.routes';
import transactionRoutes from './modules/transactions/transaction.routes';
import stripeRoutes from './modules/wallet/stripe.routes';

const app: Express = express();
app.use(helmet());
app.use(cors());

// IMPORTANT: Stripe routes must be registered BEFORE `app.use(express.json())`!
// Otherwise express.json() will parse the body into an object and Stripe signature verification will fail.
app.use('/api/wallet', stripeRoutes);

app.use(express.json());

import cryptoRoutes from './modules/wallet/crypto.routes';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/crypto', cryptoRoutes);

// Proxy all requests starting with /api/internal to the Java Core engine
app.use(
  '/api/internal',
  createProxyMiddleware({
    target: process.env.JAVA_CORE_URL || 'http://localhost:8080',
    changeOrigin: true,
  })
);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});
export default app;
