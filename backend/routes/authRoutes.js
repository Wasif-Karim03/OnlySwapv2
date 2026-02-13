import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  deleteAccount,
  getCurrentUser,
  loginUser,
  signupUser,
  updateProfile,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

const router = express.Router();

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
    });
  }
  next();
};

// Optional multer middleware - only processes if multipart/form-data
// This allows the route to handle both JSON-only and FormData requests
const optionalUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  
  // Log for debugging
  console.log('🔍 PUT /profile - Content-Type:', contentType);
  console.log('🔍 PUT /profile - Method:', req.method);
  
  // Check if it's multipart/form-data (might include boundary)
  // React Native FormData sends: multipart/form-data; boundary=...
  if (contentType.includes('multipart/form-data') || contentType.includes('boundary=')) {
    console.log('📦 Detected FormData, processing with multer');
    // Use multer to parse multipart/form-data
    return upload.single('profilePicture')(req, res, (err) => {
      if (err) {
        console.error('❌ Multer error:', err.message);
        return handleMulterError(err, req, res, next);
      }
      console.log('✅ Multer processed successfully');
      next();
    });
  }
  
  // Not multipart - skip multer entirely
  // Express.json() will have already parsed JSON body
  console.log('📝 JSON request - skipping multer');
  next();
};

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth routes are working!' });
});

// Public routes
router.post('/signup', signupUser);
router.post('/login', loginUser);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.put(
  '/profile',
  authenticateToken,
  optionalUpload, // Handle both JSON and FormData
  handleMulterError,
  updateProfile
);
router.delete('/account', authenticateToken, deleteAccount);

export default router;
