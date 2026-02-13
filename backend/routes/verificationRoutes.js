import express from 'express';
import { verifyCode, resendCode } from '../controllers/verificationController.js';

const router = express.Router();

// Public routes
router.post('/verify-code', verifyCode);
router.post('/resend-code', resendCode);

export default router;

