import Product from '../models/Product.js';
import User from '../models/User.js';
import ChatThread from '../models/ChatThread.js';
import { createAndEmitMessage } from '../services/threadService.js';
import { sendAdminEmailToUser } from '../utils/emailService.js';
import logger from '../utils/logger.js';

/**
 * Suspend a product
 * Admin can suspend any product with a reason
 * This will:
 * 1. Mark product as suspended
 * 2. Send email to seller
 * 3. Create chat message from admin to seller with reason and product image
 */
export const suspendProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;
    const admin = req.admin;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is required',
      });
    }

    // Find product
    const product = await Product.findById(productId)
      .populate('sellerId', 'firstName lastName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if already suspended
    if (product.isSuspended) {
      return res.status(400).json({
        success: false,
        message: 'Product is already suspended',
      });
    }

    // Get seller info
    const seller = await User.findById(product.sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    // Suspend product
    product.isSuspended = true;
    product.suspendedAt = new Date();
    product.suspendedBy = admin._id;
    product.suspensionReason = reason.trim();
    await product.save();

    // Get product image (first image from images array or imageUrl)
    const productImage = product.images && product.images.length > 0 
      ? product.images[0] 
      : product.imageUrl;

    // Prepare email message
    const emailSubject = 'Product Suspended - OnlySwap';
    const emailMessage = `Your product "${product.title}" has been suspended by an OnlySwap administrator.\n\nReason: ${reason}\n\nThis product will no longer be visible to other users in the marketplace. If you have any questions or concerns, please contact support through the app.`;

    // Send email to seller
    try {
      await sendAdminEmailToUser({
        userEmail: seller.email,
        userName: `${seller.firstName} ${seller.lastName}`,
        subject: emailSubject,
        message: emailMessage,
        adminEmail: admin.email,
        adminName: `Admin (${admin.email})`,
      });
      logger.info(`✅ Suspension email sent to seller: ${seller.email}`);
    } catch (emailError) {
      logger.error('❌ Error sending suspension email:', emailError);
      // Don't fail the suspension if email fails
    }

    // Get or create system admin user for chat messages
    let systemAdminUser;
    try {
      const User = (await import('../models/User.js')).default;
      // Look for system admin user (email: system@onlyswap.edu)
      // Using .edu to pass email validation
      systemAdminUser = await User.findOne({ email: 'system@onlyswap.edu' });
      
      if (!systemAdminUser) {
        // Create system admin user if it doesn't exist
        // This user is only used for sending system messages, not for login
        systemAdminUser = await User.create({
          firstName: 'OnlySwap',
          lastName: 'Admin',
          email: 'system@onlyswap.edu',
          password: 'system_user_no_login_' + Date.now() + Math.random().toString(36), // Random password, won't be used
          university: 'System', // Special university for system user
          role: 'admin',
          isSuspended: false,
        });
        logger.info(`✅ Created system admin user: ${systemAdminUser._id}`);
      }
    } catch (systemUserError) {
      logger.error('❌ Error getting/creating system admin user:', systemUserError);
      systemAdminUser = null;
    }

    // Create notification for the seller about product suspension
    try {
      const Notification = (await import('../models/Notification.js')).default;
      
      const notificationMessage = `Your product "${product.title}" has been suspended by an admin.\n\nReason: ${reason}`;
      
      const notification = await Notification.create({
        userId: seller._id,
        type: 'admin_message',
        message: notificationMessage,
        relatedId: product._id.toString(),
        isRead: false,
      });

      // Emit notification via Socket.IO if available
      if (req.io) {
        req.io.to(seller._id.toString()).emit('newNotification', {
          type: 'admin_message',
          message: notificationMessage,
          productId: product._id.toString(),
          productTitle: product.title,
          productImage: productImage,
        });
        logger.info(`✅ Suspension notification sent via socket`);
      }

      logger.info(`✅ Created suspension notification: ${notification._id}`);
    } catch (notificationError) {
      logger.error('❌ Error creating suspension notification:', notificationError);
      // Don't fail the suspension if notification fails
    }

    // Create chat message from admin to seller
    if (systemAdminUser) {
      try {
        const ChatThread = (await import('../models/ChatThread.js')).default;
        const { ensureThread, createAndEmitMessage } = await import('../services/threadService.js');
        
        // Create or get chat thread between system admin and seller
        // Use null productId for admin messages
        let adminThread = await ChatThread.findOne({
          buyerId: systemAdminUser._id,
          sellerId: seller._id,
          productId: null,
        });

        if (!adminThread) {
          adminThread = await ChatThread.create({
            buyerId: systemAdminUser._id,
            sellerId: seller._id,
            productId: null,
            lastMessage: '',
            lastMessageAt: new Date(),
          });
          logger.info(`✅ Created admin chat thread: ${adminThread._id}`);
        }

        // Create chat message with suspension reason and product image
        const chatMessage = `Your product "${product.title}" has been suspended by an OnlySwap administrator.\n\nReason: ${reason}\n\nThis product will no longer be visible to other users in the marketplace.`;

        if (req.io) {
          await createAndEmitMessage({
            io: req.io,
            thread: adminThread,
            senderId: systemAdminUser._id,
            receiverId: seller._id,
            text: chatMessage,
            productImage: productImage,
            kind: 'system',
          });
          logger.info(`✅ Suspension chat message sent via socket`);
        } else {
          // Fallback: create message directly without socket emission
          const Message = (await import('../models/Message.js')).default;
          await Message.create({
            threadId: adminThread._id,
            senderId: systemAdminUser._id,
            receiverId: seller._id,
            text: chatMessage,
            productImage: productImage,
            kind: 'system',
          });
          
          // Update thread
          await ChatThread.findByIdAndUpdate(adminThread._id, {
            lastMessage: chatMessage,
            lastMessageAt: new Date(),
          });
          logger.info(`✅ Suspension chat message created (no socket)`);
        }
      } catch (chatError) {
        logger.error('❌ Error creating suspension chat message:', chatError);
        // Don't fail the suspension if chat message fails
      }
    }

    logger.info(`✅ Product suspended: ${productId} by admin ${admin.email}`);

    res.json({
      success: true,
      message: 'Product suspended successfully',
      data: {
        product: {
          _id: product._id,
          title: product.title,
          isSuspended: product.isSuspended,
          suspendedAt: product.suspendedAt,
          suspensionReason: product.suspensionReason,
        },
      },
    });
  } catch (error) {
    logger.error('❌ Error suspending product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Unsuspend a product
 */
export const unsuspendProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const admin = req.admin;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (!product.isSuspended) {
      return res.status(400).json({
        success: false,
        message: 'Product is not suspended',
      });
    }

    // Unsuspend product
    product.isSuspended = false;
    product.suspendedAt = null;
    product.suspendedBy = null;
    product.suspensionReason = null;
    await product.save();

    logger.info(`✅ Product unsuspended: ${productId} by admin ${admin.email}`);

    res.json({
      success: true,
      message: 'Product unsuspended successfully',
      data: {
        product: {
          _id: product._id,
          title: product.title,
          isSuspended: product.isSuspended,
        },
      },
    });
  } catch (error) {
    logger.error('❌ Error unsuspending product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsuspend product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

