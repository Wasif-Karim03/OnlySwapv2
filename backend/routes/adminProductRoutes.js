import express from 'express';
import {
  suspendProduct,
  unsuspendProduct,
} from '../controllers/adminProductController.js';
import { authenticateAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Suspend a product
router.post('/:productId/suspend', suspendProduct);

// Unsuspend a product
router.post('/:productId/unsuspend', unsuspendProduct);

export default router;

