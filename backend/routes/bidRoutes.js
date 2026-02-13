import express from 'express';
import {
  createBid,
  getBidsByProduct,
  getMyBids,
  getBidsOnMyProducts,
} from '../controllers/bidController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', createBid);
router.get('/product/:productId', getBidsByProduct);
router.get('/my/bids', getMyBids);
router.get('/my/products/bids', getBidsOnMyProducts);

export default router;

