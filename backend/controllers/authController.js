import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import FeedComment from '../models/FeedComment.js';
import FeedPost from '../models/FeedPost.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import VerificationCode from '../models/VerificationCode.js';
import { sendVerificationEmail } from '../utils/emailService.js';

// Generate JWT Token
// Generate JWT Token
export const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  return jwt.sign({ userId }, jwtSecret, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// Signup Controller - Now sends verification code
export const signupUser = async (req, res) => {
  try {
    const { firstName, lastName, university, email, password } = req.body;

    // Validation
    if (!firstName || !lastName || !university || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate .edu email
    if (!email.toLowerCase().endsWith('.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Email must end with .edu',
      });
    }

    // Check if email already exists (only for non-deleted users)
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered. Please sign in instead.',
      });
    }

    // Check for existing verification code (rate limiting)
    const existingCode = await VerificationCode.findOne({ email: email.toLowerCase() });
    if (existingCode) {
      const timeDiff = Date.now() - existingCode.createdAt.getTime();
      const minWaitTime = 2 * 60 * 1000; // 2 minutes in milliseconds

      if (timeDiff < minWaitTime) {
        const remainingSeconds = Math.ceil((minWaitTime - timeDiff) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
        });
      }
      // Delete old code
      await VerificationCode.deleteOne({ email: email.toLowerCase() });
    }

    // Generate 6-digit verification code
    const code = crypto.randomInt(100000, 999999).toString();

    // Store verification code (with temporary user data)
    await VerificationCode.create({
      email: email.toLowerCase(),
      code,
      userData: { firstName, lastName, university, password }, // Temporarily store user data
    });

    // Send verification email
    await sendVerificationEmail(email, code);

    console.log('✅ Verification code sent to:', email.toLowerCase());

    // Response (don't send code back)
    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email. Please check your inbox.',
      data: {
        email: email.toLowerCase(),
      },
    });
  } catch (error) {
    console.error('❌ Signup error:', error.message);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send verification code. Please try again.',
    });
  }
};

// Login Controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email (include password for comparison) - exclude deleted users
    // Use $or to match both false and undefined (for existing users before soft delete was added)
    const user = await User.findOne({
      email: email.toLowerCase(),
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email.',
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Send response
    res.status(200).json({
      success: true,
      message: 'Welcome back!',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          university: user.university,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      },
    });

    console.log('✅ User logged in:', user.email);
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sign in. Please try again.',
    });
  }
};

// Delete user account (self-delete)
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already deleted
    if (user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Account already deleted',
      });
    }

    // Soft delete the user
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = userId; // Self-deleted
    await user.save();

    // Cascade soft delete: Products
    await Product.updateMany(
      { sellerId: userId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    );

    // Cascade soft delete: Feed Posts
    await FeedPost.updateMany(
      { userId: userId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    );

    // Cascade soft delete: Feed Comments
    await FeedComment.updateMany(
      { userId: userId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    );

    console.log('✅ User account deleted (soft):', user.email);
    console.log('✅ Cascaded soft delete to products, posts, and comments');

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully. All your data has been removed.',
    });
  } catch (error) {
    console.error('❌ Delete account error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete account',
    });
  }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.user?.userId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    if (!user || user.isDeleted === true) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          university: user.university,
          email: user.email,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('❌ Get user error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user data.',
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Log request details for debugging
    console.log('📝 Profile update request:', {
      userId,
      hasFile: !!req.file,
      body: req.body,
      contentType: req.headers['content-type'],
    });

    // Find user (exclude deleted users)
    const user = await User.findOne({
      _id: userId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
    if (!user || user.isDeleted === true) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get fields from req.body (multer parses FormData text fields)
    const { firstName, lastName } = req.body;

    // Update fields if provided
    const updateData = {};
    if (firstName !== undefined && firstName !== null && firstName !== '') {
      updateData.firstName = firstName.trim();
    }
    if (lastName !== undefined && lastName !== null && lastName !== '') {
      updateData.lastName = lastName.trim();
    }

    // Validate names
    if (updateData.firstName && updateData.firstName.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'First name cannot be empty',
      });
    }
    if (updateData.lastName && updateData.lastName.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Last name cannot be empty',
      });
    }

    // Handle profile picture upload
    if (req.file) {
      // Store relative path only (frontend will construct full URL)
      updateData.profilePicture = `/uploads/${req.file.filename}`;
      console.log('✅ Profile picture uploaded:', updateData.profilePicture);
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Profile updated for user:', updatedUser.email);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          university: updatedUser.university,
          email: updatedUser.email,
          profilePicture: updatedUser.profilePicture,
          createdAt: updatedUser.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};
