import express from 'express';
import { createReport } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Submit a report
router.post('/', authenticateToken, createReport);

export default router;
