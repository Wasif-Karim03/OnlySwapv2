import express from 'express';
import {
    blockUser,
    getBlockedUsers,
    unblockUser,
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Block a user
router.post('/block', authenticateToken, blockUser);

// Unblock a user
router.delete('/block/:userId', authenticateToken, unblockUser);

// Get blocked users
router.get('/blocked', authenticateToken, getBlockedUsers);

export default router;
