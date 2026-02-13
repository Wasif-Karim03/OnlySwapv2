import ChatThread from '../models/ChatThread.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Ensure a thread exists for buyer/seller/product combination
 * Creates one if it doesn't exist, returns existing one if it does
 */
export const ensureThread = async ({ productId, buyerId, sellerId }) => {
  try {
    let thread = await ChatThread.findOne({
      productId,
      buyerId,
      sellerId,
    });

    if (!thread) {
      thread = await ChatThread.create({
        productId,
        buyerId,
        sellerId,
      });
      console.log('✅ Created new thread:', thread._id);
    } else {
      console.log('♻️  Reused existing thread:', thread._id);
    }

    return thread;
  } catch (error) {
    console.error('Error ensuring thread:', error);
    throw error;
  }
};

/**
 * Create a message and emit via Socket.IO
 */
export const createAndEmitMessage = async ({
  io,
  thread,
  senderId,
  receiverId,
  text,
  productImage = null,
  kind = 'user',
}) => {
  try {
    // Create message in database
    const message = await Message.create({
      threadId: thread._id,
      senderId,
      receiverId,
      text,
      productImage,
      kind,
    });

    // Populate sender info for response
    await message.populate('senderId', 'firstName lastName email');

    // Update thread last message
    await ChatThread.findByIdAndUpdate(thread._id, {
      lastMessage: text,
      lastMessageAt: new Date(),
    });

    // Create notification for receiver (only for user messages, not system/bid messages)
    // Bid notifications are created in bidController
    if (kind === 'user') {
      const senderUser = await User.findById(senderId);
      
      // Get product title from thread - populate if needed
      let productTitle = 'your product';
      if (thread.productId) {
        if (typeof thread.productId === 'object' && thread.productId.title) {
          productTitle = thread.productId.title;
        } else {
          // Need to populate
          await thread.populate('productId', 'title');
          productTitle = thread.productId?.title || 'your product';
        }
      }
      
      const notification = await Notification.create({
        userId: receiverId,
        type: 'message',
        message: `${senderUser.firstName} ${senderUser.lastName}: ${text}`,
        relatedId: thread._id.toString(),
        isRead: false,
      });

      console.log('✅ Created message notification:', notification._id);

      // Emit notification to receiver via Socket.IO
      io.to(receiverId.toString()).emit('newNotification', {
        type: 'message',
        message: `${senderUser.firstName} ${senderUser.lastName}: ${text}`,
        threadId: thread._id.toString(),
        productTitle: productTitle,
      });
    }

    // Emit Socket.IO event to thread room (for users currently viewing the chat)
    io.to(thread._id.toString()).emit('newMessage', message);
    console.log('📤 Emitted message to thread room:', thread._id.toString());

    // Also emit to receiver's user room (for badge updates in tab bar)
    // This ensures the unread count badge updates even if user is not in the thread room
    io.to(receiverId.toString()).emit('newMessage', message);
    console.log('📤 Emitted message to receiver user room:', receiverId.toString());

    return message;
  } catch (error) {
    console.error('Error creating and emitting message:', error);
    throw error;
  }
};

