import User from '../models/User.js';
import VerificationCode from '../models/VerificationCode.js';
import { generateToken } from './authController.js';

// Verify code and create account
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Validation
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required',
      });
    }

    // Find verification code
    const verification = await VerificationCode.findOne({
      email: email.toLowerCase(),
      code,
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }

    // Check if email already exists (double-check - only for non-deleted users)
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
    if (existingUser) {
      // Delete verification code
      await VerificationCode.deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({
        success: false,
        message: 'This email is already registered. Please sign in instead.',
      });
    }

    // Extract user data from verification
    const { userData } = verification;

    // Check if there's a soft-deleted user with this email and free it up
    const softDeletedUser = await User.findOne({ 
      email: email.toLowerCase(),
      isDeleted: true 
    });
    
    // If soft-deleted user exists, update their email to free it up for the new user
    if (softDeletedUser) {
      const timestamp = Date.now();
      const newEmail = `deleted_${timestamp}_${softDeletedUser.email}`;
      softDeletedUser.email = newEmail;
      await softDeletedUser.save();
      console.log(`✅ Freed up email by updating soft-deleted user: ${email.toLowerCase()} -> ${newEmail}`);
    }
    
    // Create the actual user account
    let user;
    try {
      user = await User.create({
        firstName: userData.firstName,
        lastName: userData.lastName,
        university: userData.university,
        email: email.toLowerCase(),
        password: userData.password, // Will be hashed by pre-save hook
      });
    } catch (createError) {
      // Handle duplicate key error (might happen if old unique index still exists)
      if (createError.code === 11000 || createError.code === 11001) {
        console.error('❌ Duplicate key error on user creation:', createError.message);
        await VerificationCode.deleteOne({ email: email.toLowerCase() });
        return res.status(400).json({
          success: false,
          message: 'This email is already registered. Please sign in instead.',
        });
      }
      throw createError; // Re-throw if it's a different error
    }

    // Delete verification code after successful creation
    await VerificationCode.deleteOne({ email: email.toLowerCase() });

    // Generate JWT token
    const token = generateToken(user._id);

    console.log('✅ New user created and verified:', user.email);

    // Send response
    res.status(201).json({
      success: true,
      message: 'Account verified and created successfully! Welcome to OnlySwap!',
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
  } catch (error) {
    console.error('❌ Verification error:', error.message);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify code. Please try again.',
    });
  }
};

// Resend verification code
export const resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find existing verification code
    const existingCode = await VerificationCode.findOne({ email: email.toLowerCase() });

    if (existingCode) {
      const timeDiff = Date.now() - existingCode.createdAt.getTime();
      const minWaitTime = 2 * 60 * 1000; // 2 minutes

      if (timeDiff < minWaitTime) {
        const remainingSeconds = Math.ceil((minWaitTime - timeDiff) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
        });
      }
    }

    // Check if user already exists (only for non-deleted users)
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

    return res.status(400).json({
      success: false,
      message: 'No verification code found for this email. Please sign up again.',
    });
  } catch (error) {
    console.error('❌ Resend code error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process request.',
    });
  }
};

