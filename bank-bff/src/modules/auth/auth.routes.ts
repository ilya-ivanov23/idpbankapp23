import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authGuard } from '../../shared/middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/set-pin', authController.setPin);
router.post('/stripe-connection', authController.createStripeConnection);

export default router;
