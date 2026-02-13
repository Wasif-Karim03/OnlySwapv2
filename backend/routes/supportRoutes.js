import express from 'express';
import { reportBug, reportUser } from '../controllers/supportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/report-bug', reportBug);
router.post('/report-user', reportUser);

export default router;

