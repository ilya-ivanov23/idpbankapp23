import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';

import authRoutes from './modules/auth/auth.routes';
import transactionRoutes from './modules/transactions/transaction.routes';
import stripeRoutes from './modules/wallet/stripe.routes';
import cryptoRoutes from './modules/wallet/crypto.routes';
import settingsRoutes from './modules/settings/settings.routes';
import { env } from './config/env';

const app: Express = express();
app.use(helmet());
app.use(cors());

// IMPORTANT: Stripe routes must be registered BEFORE `app.use(express.json())`!
app.use('/api/wallet', stripeRoutes);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/settings', settingsRoutes);



// Proxy all requests starting with /api/internal to the Java Core engine
app.use(
  createProxyMiddleware({
    pathFilter: '/api/internal',
    target: env.JAVA_CORE_URL,
    changeOrigin: true,
    // Manually fix request body for http-proxy-middleware v3
    on: {
      proxyReq: (proxyReq: any, req: any) => {
        if (req.body && Object.keys(req.body).length) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      }
    }
  })
);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

export default app;
