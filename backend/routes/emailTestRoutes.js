import express from 'express';
import { sendVerificationEmail } from '../utils/emailService.js';

const router = express.Router();

// Diagnostic endpoint to check email configuration
router.get('/config', (req, res) => {
  // Support both naming conventions
  const gmailUser = process.env.GMAIL_USER || process.env.COMPANY_EMAIL;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD || process.env.COMPANY_EMAIL_PASSWORD;
  
  const config = {
    resend: {
      apiKey: process.env.RESEND_API_KEY ? '✅ Set (hidden)' : '❌ Not set',
      configured: !!process.env.RESEND_API_KEY,
      priority: 1, // Highest priority
    },
    gmail: {
      user: gmailUser ? '✅ Set' : '❌ Not set',
      userSource: process.env.GMAIL_USER ? 'GMAIL_USER' : process.env.COMPANY_EMAIL ? 'COMPANY_EMAIL' : 'not set',
      appPassword: gmailPassword ? '✅ Set (hidden)' : '❌ Not set',
      passwordSource: process.env.GMAIL_APP_PASSWORD ? 'GMAIL_APP_PASSWORD' : process.env.COMPANY_EMAIL_PASSWORD ? 'COMPANY_EMAIL_PASSWORD' : 'not set',
      configured: !!(gmailUser && gmailPassword),
      priority: 2,
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY ? '✅ Set (hidden)' : '❌ Not set',
      configured: !!process.env.SENDGRID_API_KEY,
      priority: 3,
    },
    environment: process.env.NODE_ENV || 'not set',
  };

  let recommendation = '⚠️ No email service configured!';
  if (config.resend.configured) {
    recommendation = '✅ Resend will be used (preferred - best deliverability, won\'t go to spam)';
  } else if (config.gmail.configured) {
    recommendation = 'Gmail SMTP will be used (fallback)';
  } else if (config.sendgrid.configured) {
    recommendation = 'SendGrid will be used (fallback)';
  }

  res.json({
    success: true,
    message: 'Email configuration status',
    config,
    recommendation,
  });
});

// Test email endpoint (for debugging)
router.post('/test', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  try {
    const testCode = '123456';
    await sendVerificationEmail(email, testCode);
    
    res.json({
      success: true,
      message: 'Test email sent (check logs for details)',
      code: testCode, // Return code for testing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
    });
  }
});

export default router;

