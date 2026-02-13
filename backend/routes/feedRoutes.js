import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  createPost,
  getFeedByUniversity,
  likePost,
  unlikePost,
  addComment,
  getComments,
  startChat,
} from '../controllers/feedController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Feed routes
router.route('/').get(getFeedByUniversity).post(createPost);
router.put('/:id/like', likePost);
router.put('/:id/unlike', unlikePost);
router.route('/:id/comments').get(getComments).post(addComment);
router.post('/:id/chat', startChat);

export default router;

