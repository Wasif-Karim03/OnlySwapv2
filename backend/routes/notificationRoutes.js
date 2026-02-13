import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  getUnreadMessageNotifications,
  markAsRead,
  markAllAsRead,
  markThreadMessageNotificationsAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.get('/unread/count', getUnreadCount);
router.get('/messages/unread', getUnreadMessageNotifications); // Get unread message notifications per thread
router.put('/:id/read', markAsRead);
router.put('/read/all', markAllAsRead);
router.put('/messages/thread/:threadId/read', markThreadMessageNotificationsAsRead); // Mark all message notifications for a thread as read
router.delete('/:id', deleteNotification);

export default router;

