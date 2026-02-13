import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes
export const protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
    const decoded = jwt.verify(token, jwtSecret);

    // Fetch full user object (excluding password and deleted users) and attach to request
    // Use $ne: true to match both false and undefined (for existing users before soft delete was added)
    const user = await User.findOne({
      _id: decoded.userId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    }).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account has been deleted',
      });
    }

    // Attach user info to request (including university)
    req.user = {
      userId: user._id.toString(),
      university: user.university,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      // Include other fields as needed
    };

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// Alias for compatibility
export const authenticateToken = protect;
