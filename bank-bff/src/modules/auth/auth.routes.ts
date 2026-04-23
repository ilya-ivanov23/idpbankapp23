import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authGuard } from '../../shared/middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/logout', authGuard, authController.logout);

export default router;

