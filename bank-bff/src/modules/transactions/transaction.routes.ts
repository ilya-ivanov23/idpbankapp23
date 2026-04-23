import { Router } from 'express';
import { TransactionController } from './transaction.controller';
import { authGuard } from '../../shared/middleware/auth.middleware';

const router = Router();
const transactionController = new TransactionController();

// This route is protected by authGuard middleware — a valid JWT is required
router.post('/transfer', authGuard, transactionController.transfer);

export default router;

