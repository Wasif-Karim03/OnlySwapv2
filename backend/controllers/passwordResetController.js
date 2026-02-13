import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PasswordResetCode from '../models/PasswordResetCode.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';

/**
 * Request password reset - send reset code to email
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Validate .edu email
    if (!email.toLowerCase().endsWith('.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Email must be a valid .edu address',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset code has been sent.',
      });
    }

    // Check for existing reset code (rate limiting)
    const existingCode = await PasswordResetCode.findOne({ email: email.toLowerCase() });
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
      await PasswordResetCode.deleteOne({ email: email.toLowerCase() });
    }

    // Generate 6-digit reset code
    const code = crypto.randomInt(100000, 999999).toString();

    // Store reset code
    await PasswordResetCode.create({
      email: email.toLowerCase(),
      code,
    });

    // Send password reset email
    await sendPasswordResetEmail(email, code);

    console.log('✅ Password reset code sent to:', email.toLowerCase());

    // Response (don't send code back)
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a reset code has been sent.',
    });
  } catch (error) {
    console.error('❌ Request password reset error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset code. Please try again.',
    });
  }
};

/**
 * Reset password - verify code and update password
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    // Validation
    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate .edu email
    if (!email.toLowerCase().endsWith('.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Email must be a valid .edu address',
      });
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Find reset code
    const resetCode = await PasswordResetCode.findOne({
      email: email.toLowerCase(),
      code,
    });

    if (!resetCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code',
      });
    }

    // Find user (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      // Delete invalid code
      await PasswordResetCode.deleteOne({ email: email.toLowerCase() });
      return res.status(404).json({
        success: false,
        message: 'No account found with this email.',
      });
    }

    // Update user password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Delete reset code after successful update
    await PasswordResetCode.deleteOne({ email: email.toLowerCase() });

    console.log('✅ Password reset successful for:', email.toLowerCase());

    res.status(200).json({
      success: true,
      message: 'Password successfully reset. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('❌ Reset password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.',
    });
  }
};

