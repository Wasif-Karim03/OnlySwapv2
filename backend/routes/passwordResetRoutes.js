import express from 'express';
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController.js';

const router = express.Router();

// Public routes
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;

