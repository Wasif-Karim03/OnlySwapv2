import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Initialize email service
// Priority: Resend > Gmail SMTP > SendGrid API
let emailTransporter = null;
let resendClient = null;
const senderEmail = 'onlyswapwck@gmail.com';
const senderName = 'OnlySwap';
const fromEmail = 'onboarding@resend.dev'; // Resend default (can be changed after domain verification)

// Initialize Resend (preferred - free, reliable, won't go to spam)
if (process.env.RESEND_API_KEY) {
  try {
    resendClient = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend API configured (preferred - best deliverability)');
  } catch (error) {
    console.error('❌ Error setting up Resend:', error.message);
  }
} else {
  console.log('ℹ️  Resend not configured (RESEND_API_KEY not set)');
  console.log('   Get free API key at: https://resend.com/api-keys');
  console.log('   Free tier: 3,000 emails/month, great deliverability');
}

// Get Gmail credentials (support both naming conventions)
const gmailUser = process.env.GMAIL_USER || process.env.COMPANY_EMAIL;
const gmailPassword = process.env.GMAIL_APP_PASSWORD || process.env.COMPANY_EMAIL_PASSWORD;

// Setup Gmail SMTP transporter (if configured)
if (gmailUser && gmailPassword) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: gmailUser, // e.g., 'onlyswapwck@gmail.com'
        pass: gmailPassword, // Gmail App Password (not regular password)
      },
      // Add connection timeout and pool settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
      // Use TLS
      requireTLS: true,
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates if needed
      },
    });
    console.log('✅ Gmail SMTP configured');
    console.log(`   Using email: ${gmailUser}`);
    console.log(`   Using variables: ${process.env.GMAIL_USER ? 'GMAIL_USER' : 'COMPANY_EMAIL'} and ${process.env.GMAIL_APP_PASSWORD ? 'GMAIL_APP_PASSWORD' : 'COMPANY_EMAIL_PASSWORD'}`);
    
    // Test connection on startup (with timeout)
    const verifyPromise = new Promise((resolve) => {
      emailTransporter.verify((error, success) => {
        if (error) {
          resolve({ error: error.message, code: error.code });
        } else {
          resolve({ success: true });
        }
      });
    });
    
    const verifyTimeout = new Promise((resolve) => {
      setTimeout(() => resolve({ error: 'Connection timeout', code: 'ETIMEDOUT' }), 5000);
    });
    
    Promise.race([verifyPromise, verifyTimeout]).then((result) => {
      if (result.success) {
        console.log('✅ Gmail SMTP connection verified successfully');
      } else {
        console.error('❌ Gmail SMTP connection test failed:', result.error);
        console.error('   Error code:', result.code);
        console.error('   Possible causes:');
        console.error('   1. COMPANY_EMAIL_PASSWORD is not a valid Gmail App Password');
        console.error('   2. Gmail App Password was revoked or expired');
        console.error('   3. Gmail security settings are blocking the connection');
        console.error('   4. Network/firewall issues from Railway');
        console.error('   Solution: Generate a new App Password at https://myaccount.google.com/apppasswords');
      }
    });
  } catch (error) {
    console.error('❌ Error setting up Gmail SMTP:', error.message);
  }
} else {
  if (gmailUser || gmailPassword) {
    console.log('⚠️  Gmail SMTP partially configured:');
    console.log(`   Email: ${gmailUser ? '✅ Set' : '❌ Missing'} (${process.env.GMAIL_USER ? 'GMAIL_USER' : process.env.COMPANY_EMAIL ? 'COMPANY_EMAIL' : 'not set'})`);
    console.log(`   Password: ${gmailPassword ? '✅ Set' : '❌ Missing'} (${process.env.GMAIL_APP_PASSWORD ? 'GMAIL_APP_PASSWORD' : process.env.COMPANY_EMAIL_PASSWORD ? 'COMPANY_EMAIL_PASSWORD' : 'not set'})`);
  } else {
    console.log('ℹ️  Gmail SMTP not configured');
    console.log('   Looking for: GMAIL_USER (or COMPANY_EMAIL) and GMAIL_APP_PASSWORD (or COMPANY_EMAIL_PASSWORD)');
  }
}

// Initialize SendGrid (fallback if Gmail not configured)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  if (!emailTransporter) {
    console.log('✅ SendGrid API configured (fallback)');
  } else {
    console.log('ℹ️  SendGrid API also configured (will use Gmail as primary)');
  }
} else {
  if (!emailTransporter) {
    console.log('⚠️  No email service configured!');
    console.log('   Set GMAIL_USER and GMAIL_APP_PASSWORD for Gmail SMTP');
    console.log('   Or set SENDGRID_API_KEY for SendGrid');
  }
}

/**
 * Helper function to send email using SendGrid, Gmail, or Resend
 * Priority: SendGrid (verified) > Gmail SMTP > Resend (requires domain verification)
 */
const sendEmail = async ({ to, subject, text, html, fromName = senderName }) => {
  // Check if email is configured
  const hasResend = resendClient !== null;
  const hasGmail = emailTransporter !== null;
  const hasSendGrid = !!process.env.SENDGRID_API_KEY;
  
  if (!hasResend && !hasGmail && !hasSendGrid) {
    throw new Error('No email service configured. Set RESEND_API_KEY (requires domain verification), GMAIL_USER and GMAIL_APP_PASSWORD, or SENDGRID_API_KEY');
  }

  // Try SendGrid first (verified sender, works immediately)
  if (hasSendGrid) {
    try {
      console.log(`📧 Attempting to send email via SendGrid...`);
      console.log(`   From: ${senderEmail}`);
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      
      const msg = {
        to,
        from: {
          email: senderEmail,
          name: fromName,
        },
        replyTo: senderEmail,
        subject,
        text,
        html,
      };
      
      const result = await sgMail.send(msg);
      console.log(`✅ Email sent via SendGrid to: ${to}`);
      if (result[0]?.statusCode === 202) {
        console.log(`   Status: Accepted (email queued for delivery)`);
      }
      return { method: 'sendgrid', success: true };
    } catch (error) {
      console.error('❌ SendGrid API error:', error.message);
      if (error.response) {
        console.error('❌ SendGrid error details:', JSON.stringify(error.response.body, null, 2));
        if (error.response.body?.errors) {
          error.response.body.errors.forEach((err, index) => {
            console.error(`   Error ${index + 1}:`, err.message);
            if (err.field) {
              console.error(`   Field:`, err.field);
            }
          });
        }
      }
      if (error.code) {
        console.error('❌ SendGrid error code:', error.code);
      }
      
      // Check for specific SendGrid errors
      if (error.message.includes('Forbidden') || error.code === 403) {
        console.error('⚠️  SendGrid Forbidden error - possible causes:');
        console.error('   1. API key does not have "Mail Send" permissions');
        console.error('   2. Sender email is not verified');
        console.error('   3. SendGrid account is suspended or on free trial restrictions');
        console.error('   Solution: Check API key permissions in SendGrid → Settings → API Keys');
      }
      
      // Fall back to Gmail or Resend
      if (hasGmail || hasResend) {
        console.log('⚠️  Falling back to alternative email service...');
      } else {
        throw error;
      }
    }
  }

  // Try Gmail SMTP (fallback)
  if (hasGmail) {
    try {
      console.log(`📧 Attempting to send email via Gmail SMTP...`);
      console.log(`   From: ${senderEmail}`);
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      
      // Add timeout wrapper
      const mailOptions = {
        from: `"${fromName}" <${senderEmail}>`,
        to,
        subject,
        text,
        html,
      };
      
      const sendPromise = emailTransporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gmail SMTP timeout after 15 seconds')), 15000);
      });
      
      const result = await Promise.race([sendPromise, timeoutPromise]);
      console.log(`✅ Email sent via Gmail SMTP to: ${to}`);
      console.log(`   Message ID: ${result.messageId}`);
      return { method: 'gmail', success: true };
    } catch (error) {
      console.error('❌ Gmail SMTP error:', error.message);
      if (error.response) {
        console.error('❌ Gmail error response:', JSON.stringify(error.response, null, 2));
      }
      if (error.code) {
        console.error('❌ Gmail error code:', error.code);
      }
      if (error.command) {
        console.error('❌ Gmail error command:', error.command);
      }
      if (error.responseCode) {
        console.error('❌ Gmail error response code:', error.responseCode);
      }
      
      // Check for authentication errors
      if (error.message.includes('Invalid login') || error.message.includes('authentication failed') || error.code === 'EAUTH') {
        console.error('❌ Gmail authentication failed!');
        console.error('   Check that COMPANY_EMAIL_PASSWORD is a valid Gmail App Password');
        console.error('   Get App Password from: https://myaccount.google.com/apppasswords');
      }
      
      // Fall back to Resend if Gmail fails
      if (hasResend) {
        console.log('⚠️  Falling back to Resend...');
      } else {
        throw error;
      }
    }
  }

  // Try Resend last (requires domain verification)
  if (hasResend) {
    try {
      console.log(`📧 Attempting to send email via Resend...`);
      console.log(`   From: ${fromEmail}`);
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      
      const { data, error } = await resendClient.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject: subject,
        text: text,
        html: html,
      });
      
      if (error) {
        // Check if it's a domain verification error
        if (error.message && error.message.includes('verify a domain')) {
          console.error('❌ Resend requires domain verification to send to external emails');
          console.error('   Solution: Verify a domain at https://resend.com/domains');
          console.error('   Or use SendGrid (verify sender email) or Gmail SMTP');
          // Fall back to other services
          if (hasGmail || hasSendGrid) {
            console.log('⚠️  Falling back to alternative email service...');
          } else {
            throw new Error('Resend requires domain verification. Please verify a domain at https://resend.com/domains or configure SendGrid/Gmail.');
          }
        } else {
          throw new Error(error.message || 'Resend API error');
        }
      }
      
      console.log(`✅ Email sent via Resend to: ${to}`);
      console.log(`   Email ID: ${data?.id || 'N/A'}`);
      return { method: 'resend', success: true };
    } catch (error) {
      console.error('❌ Resend API error:', error.message);
      // Fall back to Gmail or SendGrid
      if (hasGmail || hasSendGrid) {
        console.log('⚠️  Falling back to alternative email service...');
      } else {
        throw error;
      }
    }
  }

  // Try Gmail first (preferred)
  if (hasGmail) {
    try {
      const mailOptions = {
        from: `"${fromName}" <${senderEmail}>`,
        to,
        subject,
        text,
        html,
      };
      
      console.log(`📧 Attempting to send email via Gmail SMTP...`);
      console.log(`   From: ${senderEmail}`);
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      
      // Add timeout wrapper
      const sendPromise = emailTransporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gmail SMTP timeout after 15 seconds')), 15000);
      });
      
      const result = await Promise.race([sendPromise, timeoutPromise]);
      console.log(`✅ Email sent via Gmail SMTP to: ${to}`);
      console.log(`   Message ID: ${result.messageId}`);
      return { method: 'gmail', success: true };
    } catch (error) {
      console.error('❌ Gmail SMTP error:', error.message);
      if (error.response) {
        console.error('❌ Gmail error response:', JSON.stringify(error.response, null, 2));
      }
      if (error.code) {
        console.error('❌ Gmail error code:', error.code);
      }
      if (error.command) {
        console.error('❌ Gmail error command:', error.command);
      }
      if (error.responseCode) {
        console.error('❌ Gmail error response code:', error.responseCode);
      }
      
      // Check for authentication errors
      if (error.message.includes('Invalid login') || error.message.includes('authentication failed') || error.code === 'EAUTH') {
        console.error('❌ Gmail authentication failed!');
        console.error('   Check that COMPANY_EMAIL_PASSWORD is a valid Gmail App Password');
        console.error('   Get App Password from: https://myaccount.google.com/apppasswords');
      }
      
      // Fall back to SendGrid if Gmail fails
      if (hasSendGrid) {
        console.log('⚠️  Falling back to SendGrid...');
      } else {
        throw error;
      }
    }
  }

  // Fallback to SendGrid
  if (hasSendGrid) {
    try {
      console.log(`📧 Attempting to send email via SendGrid...`);
      console.log(`   From: ${senderEmail}`);
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      
      const msg = {
        to,
        from: {
          email: senderEmail,
          name: fromName,
        },
        replyTo: senderEmail,
        subject,
        text,
        html,
      };
      
      const result = await sgMail.send(msg);
      console.log(`✅ Email sent via SendGrid to: ${to}`);
      if (result[0]?.statusCode === 202) {
        console.log(`   Status: Accepted (email queued for delivery)`);
      }
      return { method: 'sendgrid', success: true };
    } catch (error) {
      console.error('❌ SendGrid API error:', error.message);
      if (error.response) {
        console.error('❌ SendGrid error details:', JSON.stringify(error.response.body, null, 2));
        if (error.response.body?.errors) {
          error.response.body.errors.forEach((err, index) => {
            console.error(`   Error ${index + 1}:`, err.message);
            if (err.field) {
              console.error(`   Field:`, err.field);
            }
          });
        }
      }
      if (error.code) {
        console.error('❌ SendGrid error code:', error.code);
      }
      
      // Check for specific SendGrid errors
      if (error.message.includes('Forbidden') || error.code === 403) {
        console.error('⚠️  SendGrid Forbidden error - possible causes:');
        console.error('   1. API key does not have "Mail Send" permissions');
        console.error('   2. Sender email is not verified (but we see it is verified)');
        console.error('   3. SendGrid account is suspended or on free trial restrictions');
        console.error('   Solution: Check API key permissions in SendGrid → Settings → API Keys');
      }
      
      throw error;
    }
  }
};

/**
 * Send verification code email
 */
export const sendVerificationEmail = async (email, code) => {
  // Development mode: log code instead of sending email
  const isDevelopment = process.env.NODE_ENV === 'development';
  const emailConfigured = emailTransporter !== null || process.env.SENDGRID_API_KEY;

  if (isDevelopment && !emailConfigured) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 VERIFICATION CODE (Dev Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return true;
  }

  // If email not configured in production, log code and continue (don't fail signup)
  if (!emailConfigured) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  EMAIL NOT CONFIGURED - VERIFICATION CODE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Set GMAIL_USER and GMAIL_APP_PASSWORD in Railway to enable email sending');
    console.log('⚠️  Or set SENDGRID_API_KEY as fallback');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return true; // Don't throw error - allow signup to continue
  }

  const subject = 'OnlySwap - Verify Your Account';
  const text = `Verify your OnlySwap account\n\nYour verification code is: ${code}\n\nThis code will expire in 2 minutes.\n\nIf you didn't request this code, please ignore this email.`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 30px 30px 20px; text-align: center; background-color: #4CAF50; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">OnlySwap</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="margin: 0 0 20px; color: #1F2937; font-size: 20px; font-weight: 600;">Verify Your Account</h2>
                  <p style="margin: 0 0 20px; color: #4B5563; font-size: 16px; line-height: 1.5;">
                    Thank you for signing up for OnlySwap! To complete your account setup, please verify your email address using the code below.
                  </p>
                  
                  <!-- Code Box -->
                  <div style="background-color: #F0FDF4; border: 2px solid #4CAF50; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                    <p style="margin: 0 0 15px; color: #1F2937; font-size: 14px; font-weight: 500;">Your verification code:</p>
                    <div style="font-size: 36px; font-weight: 700; color: #4CAF50; letter-spacing: 4px; margin: 10px 0;">${code}</div>
                    <p style="margin: 15px 0 0; color: #6B7280; font-size: 12px;">This code expires in 2 minutes</p>
                  </div>
                  
                  <p style="margin: 20px 0 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
                    If you didn't create an OnlySwap account, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #F9FAFB; border-radius: 0 0 8px 8px; border-top: 1px solid #E5E7EB;">
                  <p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center;">
                    This is an automated message from OnlySwap. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendEmail({ to: email, subject, text, html });
    console.log('✅ Verification email sent to:', email);
    return true;
  } catch (error) {
    // Log error but don't fail signup - log code instead
    console.error('❌ Error sending verification email:', error.message);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  EMAIL FAILED - VERIFICATION CODE (Fallback)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Fix email configuration in Railway to enable email sending');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    // Don't throw - allow signup to continue
    return true;
  }
};

/**
 * Send password reset code email
 */
export const sendPasswordResetEmail = async (email, code) => {
  // Development mode: log code instead of sending email
  const isDevelopment = process.env.NODE_ENV === 'development';
  const emailConfigured = emailTransporter !== null || process.env.SENDGRID_API_KEY;

  if (isDevelopment && !emailConfigured) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 PASSWORD RESET CODE (Dev Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return true;
  }

  // If email not configured in production, log code and continue (don't fail)
  if (!emailConfigured) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  EMAIL NOT CONFIGURED - PASSWORD RESET CODE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Set GMAIL_USER and GMAIL_APP_PASSWORD in Railway to enable email sending');
    console.log('⚠️  Or set SENDGRID_API_KEY as fallback');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    // Don't throw error - allow password reset to continue
    // User can still use the code from logs
    return true;
  }

  const subject = 'Reset your OnlySwap password';
  const text = `Reset your OnlySwap password\n\nYour password reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email. Your password will remain unchanged.`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 30px 30px 20px; text-align: center; background-color: #4CAF50; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">OnlySwap</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="margin: 0 0 20px; color: #1F2937; font-size: 20px; font-weight: 600;">Password Reset Request</h2>
                  <p style="margin: 0 0 20px; color: #4B5563; font-size: 16px; line-height: 1.5;">
                    You requested to reset your password. Use the code below to complete the process.
                  </p>
                  
                  <!-- Code Box -->
                  <div style="background-color: #F0FDF4; border: 2px solid #4CAF50; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                    <p style="margin: 0 0 15px; color: #1F2937; font-size: 14px; font-weight: 500;">Your password reset code:</p>
                    <div style="font-size: 36px; font-weight: 700; color: #4CAF50; letter-spacing: 4px; margin: 10px 0;">${code}</div>
                    <p style="margin: 15px 0 0; color: #6B7280; font-size: 12px;">This code expires in 10 minutes</p>
                  </div>
                  
                  <p style="margin: 20px 0 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
                    If you didn't request this code, please ignore this email. Your password will remain unchanged.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background-color: #F9FAFB; border-radius: 0 0 8px 8px; border-top: 1px solid #E5E7EB;">
                  <p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center;">
                    This is an automated message from OnlySwap. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendEmail({ to: email, subject, text, html, fromName: 'OnlySwap Support' });
    console.log('✅ Password reset email sent to:', email);
    return true;
  } catch (error) {
    // Log detailed error for debugging
    console.error('❌ Error sending password reset email:', error.message);
    
    // Log code as fallback so user can still reset password
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  EMAIL FAILED - PASSWORD RESET CODE (Fallback)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Fix email configuration in Railway to enable email sending');
    console.log('⚠️  For Gmail: Set GMAIL_USER and GMAIL_APP_PASSWORD');
    console.log('⚠️  For SendGrid: Set SENDGRID_API_KEY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Don't throw error - allow password reset to continue
    // User can still use the code from logs
    return true;
  }
};

/**
 * Send support ticket email to company
 */
export const sendSupportTicketEmail = async ({
  type,
  ticketId,
  userEmail,
  userName,
  userUniversity,
  subject,
  description,
  reportedUserId,
  reportedUserName,
  reportedUserEmail,
  reportedUserUniversity,
}) => {
  const supportEmail = senderEmail;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const emailConfigured = emailTransporter !== null || process.env.SENDGRID_API_KEY;

  if (isDevelopment && !emailConfigured) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 SUPPORT TICKET (Dev Mode) - ${type.toUpperCase()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Ticket ID: ${ticketId}`);
    console.log(`Reporter: ${userName} (${userEmail})`);
    console.log(`University: ${userUniversity}`);
    console.log(`Subject: ${subject}`);
    console.log(`Description: ${description}`);
    if (reportedUserId) {
      console.log(`Reported User ID: ${reportedUserId}`);
      console.log(`Reported User: ${reportedUserName} (${reportedUserEmail})`);
      console.log(`Reported User University: ${reportedUserUniversity}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return true;
  }

  try {
    const typeLabel = type === 'bug' ? 'Bug Report' : type === 'user_report' ? 'User Report' : 'Support Request';
    
    const emailSubject = `[${typeLabel}] Ticket #${ticketId} - ${subject}`;
    const emailText = `${typeLabel} - Ticket #${ticketId}\n\nReporter: ${userName} (${userEmail})\nUniversity: ${userUniversity}\n\nSubject: ${subject}\n\nDescription:\n${description}${reportedUserId ? `\n\nReported User: ${reportedUserName} (${reportedUserEmail})\nUniversity: ${reportedUserUniversity}` : ''}`;
    const emailHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
          ${typeLabel} - Ticket #${ticketId}
        </h2>
        
        <div style="background-color: #f7fdf9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1F2937; margin-top: 0;">Reporter Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6b6b6b;">Name:</td>
              <td style="padding: 8px 0;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6b6b6b;">Email:</td>
              <td style="padding: 8px 0;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6b6b6b;">University:</td>
              <td style="padding: 8px 0;">${userUniversity}</td>
            </tr>
          </table>
        </div>

        ${reportedUserId ? `
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1F2937; margin-top: 0;">Reported User Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6b6b6b;">User ID:</td>
              <td style="padding: 8px 0;">${reportedUserId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6b6b6b;">Name:</td>
              <td style="padding: 8px 0;">${reportedUserName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6b6b6b;">Email:</td>
              <td style="padding: 8px 0;">${reportedUserEmail || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6b6b6b;">University:</td>
              <td style="padding: 8px 0;">${reportedUserUniversity || 'N/A'}</td>
            </tr>
          </table>
        </div>
        ` : ''}

        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #E5E7EB; margin: 20px 0;">
          <h3 style="color: #1F2937; margin-top: 0;">Subject</h3>
          <p style="font-size: 16px; color: #1F2937; margin: 10px 0;">${subject}</p>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #E5E7EB; margin: 20px 0;">
          <h3 style="color: #1F2937; margin-top: 0;">Description</h3>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6; white-space: pre-wrap; margin: 10px 0;">${description}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
          <p style="color: #6b6b6b; font-size: 12px; margin: 0;">
            This ticket has been automatically generated and stored in the system.<br>
            Ticket ID: <strong>${ticketId}</strong> | Type: <strong>${typeLabel}</strong>
          </p>
        </div>
      </div>
    `;

    await sendEmail({ to: supportEmail, subject: emailSubject, text: emailText, html: emailHtml, fromName: 'OnlySwap Support System' });
    console.log(`✅ Support ticket email sent to ${supportEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending support ticket email:', error.message);
    throw new Error('Failed to send support ticket email.');
  }
};

/**
 * Send email from admin to user
 */
export const sendAdminEmailToUser = async ({
  userEmail,
  userName,
  subject,
  message,
  adminEmail,
  adminName,
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const emailConfigured = emailTransporter !== null || process.env.SENDGRID_API_KEY;

  if (isDevelopment && !emailConfigured) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 ADMIN EMAIL TO USER (Dev Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${userName} (${userEmail})`);
    console.log(`From: ${adminName} (${adminEmail})`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return true;
  }

  try {
    const emailSubject = `[OnlySwap Admin] ${subject}`;
    const emailText = `Hello ${userName},\n\n${message}\n\nBest regards,\nOnlySwap Admin Team${adminName ? `\n${adminName}` : ''}`;
    const emailHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #4CAF50; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">OnlySwap Admin Message</h1>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #1F2937; margin-bottom: 20px;">
            Hello ${userName},
          </p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6; white-space: pre-wrap; margin: 0;">
              ${message.replace(/\n/g, '<br>')}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b6b6b; margin-top: 30px; margin-bottom: 10px;">
            Best regards,<br>
            <strong>OnlySwap Admin Team</strong>
          </p>
          
          ${adminName ? `<p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
            ${adminName}
          </p>` : ''}
        </div>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
          <p style="color: #6b6b6b; font-size: 12px; margin: 0;">
            This is an official message from OnlySwap administrators.<br>
            Please do not reply directly to this email.
          </p>
        </div>
      </div>
    `;

    await sendEmail({ to: userEmail, subject: emailSubject, text: emailText, html: emailHtml, fromName: 'OnlySwap Admin' });
    console.log(`✅ Admin email sent to ${userEmail} from ${adminEmail || 'system'}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending admin email:', error.message);
    throw new Error('Failed to send email. Please try again.');
  }
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async () => {
  try {
    const hasGmail = emailTransporter !== null;
    const hasSendGrid = !!process.env.SENDGRID_API_KEY;
    
    if (hasGmail) {
      console.log('✅ Gmail SMTP is configured');
      return true;
    }
    if (hasSendGrid) {
      console.log('✅ SendGrid API key is configured');
      return true;
    }
    console.log('⚠️  No email service configured');
    return false;
  } catch (error) {
    console.error('❌ Email server configuration error:', error.message);
    return false;
  }
};
