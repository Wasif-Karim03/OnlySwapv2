import express from 'express';
import {
  sendMessage,
  getMessages,
  getChats,
  getThreadById,
  getThreadByProduct,
  getUnreadCount,
  markThreadMessagesAsRead,
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/thread/:threadId/message', sendMessage);
router.get('/thread/:threadId/messages', getMessages);
router.put('/thread/:threadId/read', markThreadMessagesAsRead); // Mark messages in thread as read
router.get('/thread/:threadId', getThreadById); // Get thread details for navigation
router.get('/product/:productId/thread', getThreadByProduct); // Get or create thread by product
router.get('/', getChats);
router.get('/unread/count', getUnreadCount);

export default router;

