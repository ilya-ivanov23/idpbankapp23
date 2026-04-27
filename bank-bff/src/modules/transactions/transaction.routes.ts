import { Router } from 'express';
import { TransactionController } from './transaction.controller';
import { authGuard } from '../../shared/middleware/auth.middleware';
import { securityGuard } from '../../shared/middleware/security.middleware';

const router = Router();
const transactionController = new TransactionController();

// This route is protected by authGuard and securityGuard (OTP/PIN)
router.post('/transfer', authGuard, securityGuard, transactionController.transfer);

export default router;

