import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './modules/auth/auth.routes';
import transactionRoutes from './modules/transactions/transaction.routes';
import stripeRoutes from './modules/wallet/stripe.routes';

const app: Express = express();
app.use(helmet());
app.use(cors());

// ВНИМАНИЕ: Роуты Stripe должны быть подключены ДО `app.use(express.json())`!
// Иначе `express.json()` распарсит тело в объект, и валидация подписи упадет.
app.use('/api/wallet', stripeRoutes);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});
export default app;
