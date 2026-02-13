import { body, param, query, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    logger.warn('Validation errors:', {
      requestId: req.id,
      path: req.path,
      errors: errorMessages,
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
      requestId: req.id,
    });
  }
  
  next();
};

/**
 * Common validation rules
 */
export const commonValidations = {
  // Email validation
  email: (field = 'email') => [
    body(field)
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Must be a valid email address')
      .matches(/\.edu$/)
      .withMessage('Email must end with .edu'),
  ],

  // Password validation
  password: (field = 'password', minLength = 6) => [
    body(field)
      .isLength({ min: minLength })
      .withMessage(`Password must be at least ${minLength} characters`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],

  // Name validation
  name: (field = 'name', maxLength = 50) => [
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${field} is required`)
      .isLength({ min: 1, max: maxLength })
      .withMessage(`${field} must be between 1 and ${maxLength} characters`)
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`),
  ],

  // Product title validation
  productTitle: (optional = false) => {
    const validator = body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters')
      .escape();
    
    if (optional) {
      return [validator.optional()];
    }
    return [
      validator
        .notEmpty()
        .withMessage('Product title is required'),
    ];
  },

  // Product description validation
  productDescription: (optional = false) => {
    const validator = body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters')
      .escape();
    
    if (optional) {
      return [validator.optional()];
    }
    return [
      validator
        .notEmpty()
        .withMessage('Product description is required'),
    ];
  },

  // Price validation
  price: (optional = false) => {
    const validator = body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number')
      .toFloat();
    
    if (optional) {
      return [validator.optional()];
    }
    return [validator];
  },

  // Category validation
  category: (optional = false) => {
    const validator = body('category')
      .isIn(['Textbooks', 'Electronics', 'Clothing', 'Furniture', 'Sports Equipment', 'Other'])
      .withMessage('Invalid category');
    
    if (optional) {
      return [validator.optional()];
    }
    return [validator];
  },

  // University validation
  university: (optional = false) => {
    const validator = body('university')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('University name must be between 2 and 100 characters')
      .escape();
    
    if (optional) {
      return [validator.optional()];
    }
    return [
      validator
        .notEmpty()
        .withMessage('University is required'),
    ];
  },

  // Bid amount validation
  bidAmount: () => [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Bid amount must be a positive number')
      .toFloat(),
  ],

  // Message validation
  message: (field = 'message', maxLength = 1000) => [
    body(field)
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 1, max: maxLength })
      .withMessage(`Message must be between 1 and ${maxLength} characters`)
      .escape(),
  ],

  // Verification code validation
  verificationCode: () => [
    body('code')
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('Verification code must be 6 digits'),
  ],

  // ObjectId validation
  objectId: (field = 'id') => [
    param(field)
      .isMongoId()
      .withMessage(`Invalid ${field} format`),
  ],
};

// Re-export express-validator functions for convenience
export { body, param, query };

