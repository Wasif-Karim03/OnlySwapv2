import express from 'express';
import {
  getUsers,
  getUserById,
  suspendUser,
  sendEmailToUser,
  deleteUser
} from '../controllers/adminUserController.js';
import { authenticateAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id/suspend', suspendUser);
router.post('/:id/send-email', sendEmailToUser);
router.delete('/:id', deleteUser);

export default router;

