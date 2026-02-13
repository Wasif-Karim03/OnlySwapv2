import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  markAsSold,
  trackSwipe,
} from '../controllers/productController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { handleValidationErrors, commonValidations, body, param, query } from '../middleware/validation.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
import { existsSync, mkdirSync } from 'fs';
const uploadsDir = path.join(__dirname, '../uploads/');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure directory exists before saving
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to only allow specific image types (more secure)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size (increased for better compatibility)
    files: 10, // Max 10 files
  },
});

const router = express.Router();

// Test endpoint to verify connectivity
router.get('/test-upload', (req, res) => {
  console.log('✅ Test endpoint hit - connectivity works!');
  res.json({ success: true, message: 'Upload endpoint is reachable' });
});

// Test endpoint for POST with FormData
router.post('/test-upload', 
  upload.single('testImage'),
  (req, res) => {
    console.log('✅ POST test-upload endpoint hit!');
    console.log('📥 Has file:', !!req.file);
    console.log('📥 Has files:', !!req.files);
    console.log('📥 Body:', req.body);
    console.log('📥 Content-Type:', req.headers['content-type']);
    
    if (req.file) {
      console.log('📥 File received:', req.file.filename, req.file.size, 'bytes');
      // Clean up test file
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignore
      }
    }
    
    res.json({ 
      success: true, 
      message: 'POST with FormData works!',
      receivedFile: !!req.file,
      body: req.body
    });
  }
);

// Public routes - NOW REQUIRES AUTHENTICATION for university filtering
router.get('/', 
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isIn(['Textbooks', 'Electronics', 'Clothing', 'Furniture', 'Sports Equipment', 'Other']),
    query('status').optional().isIn(['available', 'sold', 'pending']),
    query('excludeBidProducts').optional().isBoolean().withMessage('excludeBidProducts must be a boolean value'),
  ],
  handleValidationErrors,
  getProducts
);

// Protected routes (require authentication)
// Specific routes must come before parameterized routes
router.get('/my/products', authenticateToken, getMyProducts);

router.post('/track-swipe',
  authenticateToken,
  [
    body('productId').isMongoId().withMessage('Invalid product ID'),
    body('swipeType').isIn(['left', 'right']).withMessage('Swipe type must be left or right'),
  ],
  handleValidationErrors,
  trackSwipe
);

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum file size is 10MB per image.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 images per product.',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please use "images" as the field name.',
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

// Allow up to 10 images per product
// Support both FormData (with files) and JSON (with Cloudinary URLs)
router.post('/',
  (req, res, next) => {
    const requestId = req.id || 'unknown';
    console.log(`📥 [${requestId}] POST /api/products - Request received`);
    console.log(`📥 [${requestId}] Content-Type:`, req.headers['content-type']);
    console.log(`📥 [${requestId}] Content-Length:`, req.headers['content-length']);
    console.log(`📥 [${requestId}] Authorization:`, req.headers['authorization'] ? 'Present' : 'Missing');
    next();
  },
  authenticateToken,
  (req, res, next) => {
    const requestId = req.id || 'unknown';
    console.log(`📥 [${requestId}] Authentication passed, user:`, req.user?.userId);
    
    // Check if this is JSON (Cloudinary URLs) or FormData (file upload)
    const isJsonRequest = req.headers['content-type']?.includes('application/json');
    
    if (isJsonRequest) {
      // JSON request with Cloudinary URLs - skip multer
      console.log(`📥 [${requestId}] JSON request detected - using Cloudinary URLs`);
      next();
    } else {
      // FormData request with files - use multer
      console.log(`📥 [${requestId}] FormData request detected - processing files`);
      upload.array('images', 10)(req, res, (err) => {
        if (err) {
          return handleMulterError(err, req, res, next);
        }
        const requestId = req.id || 'unknown';
        console.log(`📥 [${requestId}] After multer - Files received:`, req.files?.length || 0);
        if (req.files && req.files.length > 0) {
          req.files.forEach((file, index) => {
            console.log(`📥 [${requestId}] File ${index + 1}: ${file.filename} (${file.size} bytes)`);
          });
        }
        next();
      });
    }
  },
  [
    ...commonValidations.productTitle(),
    ...commonValidations.productDescription(),
    ...commonValidations.price(),
    ...commonValidations.category(),
    ...commonValidations.university(),
  ],
  handleValidationErrors,
  createProduct
);

router.put('/:id/sold',
  authenticateToken,
  [commonValidations.objectId('id')],
  handleValidationErrors,
  markAsSold
);

router.put('/:id',
  authenticateToken,
  upload.array('images', 10),
  [
    commonValidations.objectId('id'),
    ...commonValidations.productTitle(true),
    ...commonValidations.productDescription(true),
    ...commonValidations.price(true),
    ...commonValidations.category(true),
  ],
  handleValidationErrors,
  updateProduct
);

router.delete('/:id',
  authenticateToken,
  [commonValidations.objectId('id')],
  handleValidationErrors,
  deleteProduct
);

// Public routes (parameterized routes last)
// Note: getProduct now verifies university match if user is authenticated
router.get('/:id',
  [commonValidations.objectId('id')],
  handleValidationErrors,
  getProduct
);

export default router;

