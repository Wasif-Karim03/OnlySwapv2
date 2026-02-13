import express from 'express';
import { adminLogin, getCurrentAdmin } from '../controllers/adminController.js';
import { authenticateAdmin, requireSuperAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Admin routes are working!' });
});

// Public routes
router.post('/login', adminLogin);

// Protected routes (require admin authentication)
router.get('/me', authenticateAdmin, getCurrentAdmin);

// Example superadmin-only route (can be extended later)
router.get('/superadmin/test', authenticateAdmin, requireSuperAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Superadmin access confirmed',
    admin: req.admin,
  });
});

export default router;

