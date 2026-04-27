import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { authGuard } from '../../shared/middleware/auth.middleware';

const router = Router();
const settingsController = new SettingsController();

router.post('/support', authGuard, settingsController.submitSupportRequest);
router.patch('/language', authGuard, settingsController.updateLanguage);

export default router;
