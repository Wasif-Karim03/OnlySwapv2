import Message from '../models/Message.js';
import ChatThread from '../models/ChatThread.js';
import { createAndEmitMessage, ensureThread } from '../services/threadService.js';

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { threadId: threadIdFromParam } = req.params;
    const { threadId: threadIdFromBody, senderId, receiverId, text } = req.body;
    const threadId = threadIdFromParam || threadIdFromBody;
    const authenticatedUserId = req.user.userId;

    // Validate sender matches authenticated user
    if (senderId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send message as another user',
      });
    }

    // Validation
    if (!threadId || !receiverId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Thread ID, receiver ID, and message text are required',
      });
    }

    if (text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

    // Verify thread exists
    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found',
      });
    }

    // Create and emit message
    const newMessage = await createAndEmitMessage({
      io: req.io,
      thread,
      senderId,
      receiverId,
      text: text.trim(),
      kind: 'user',
    });

    console.log('✅ Message sent:', {
      threadId,
      messageId: newMessage._id,
      senderId,
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

// Get thread history
export const getMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.userId;

    // Verify thread exists and user is participant
    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found',
      });
    }

    // Verify user is part of this thread
    const isParticipant =
      thread.buyerId.toString() === userId ||
      thread.sellerId.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this thread',
      });
    }

    // Get all messages in this thread
    const messages = await Message.find({ threadId })
      .populate('senderId', 'firstName lastName email')
      .sort({ createdAt: 1 }); // Oldest first

    res.json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
};

// Get all threads for a user
export const getChats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all threads where user is either buyer or seller
    const threads = await ChatThread.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate('buyerId', 'firstName lastName email')
      .populate('sellerId', 'firstName lastName email')
      .populate('productId', 'title imageUrl')
      .sort({ lastMessageAt: -1 });

    // For each thread, get the most recent message
    const threadsWithMessages = await Promise.all(
      threads.map(async (thread) => {
        const lastMessage = await Message.findOne({ threadId: thread._id })
          .sort({ createdAt: -1 })
          .populate('senderId', 'firstName lastName');

        return {
          threadId: thread._id,
          otherUser: thread.buyerId._id.toString() === userId 
            ? thread.sellerId 
            : thread.buyerId,
          lastMessage,
          product: thread.productId,
          lastMessageAt: thread.lastMessageAt,
        };
      })
    );

    res.json({
      success: true,
      count: threadsWithMessages.length,
      data: threadsWithMessages,
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch threads',
      error: error.message,
    });
  }
};

// Get thread by ID (for navigation from notifications)
export const getThreadById = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.userId;

    const thread = await ChatThread.findById(threadId)
      .populate('buyerId', 'firstName lastName email')
      .populate('sellerId', 'firstName lastName email')
      .populate('productId', 'title imageUrl');

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found',
      });
    }

    // Verify user is part of this thread
    const isParticipant =
      thread.buyerId._id.toString() === userId ||
      thread.sellerId._id.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this thread',
      });
    }

    // Determine the other user
    const otherUser = thread.buyerId._id.toString() === userId
      ? thread.sellerId
      : thread.buyerId;

    res.json({
      success: true,
      data: {
        threadId: thread._id,
        contactName: `${otherUser.firstName} ${otherUser.lastName}`,
        contactId: otherUser._id,
        productTitle: thread.productId?.title || 'Unknown Product',
        productImage: thread.productId?.imageUrl || null,
      },
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thread',
      error: error.message,
    });
  }
};

// Get or create thread by productId and sellerId
export const getThreadByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    // Find thread where user is buyer and matches product
    let thread = await ChatThread.findOne({
      productId,
      buyerId: userId,
    })
      .populate('buyerId', 'firstName lastName email')
      .populate('sellerId', 'firstName lastName email')
      .populate('productId', 'title imageUrl');

    // If not found, try to create one - but we need sellerId from product
    if (!thread) {
      const Product = (await import('../models/Product.js')).default;
      const product = await Product.findById(productId).populate('sellerId');
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Verify product is from user's university
      if (req.user && req.user.university) {
        if (product.university !== req.user.university) {
          return res.status(403).json({
            success: false,
            message: 'You can only access products from your university',
          });
        }
      }

      // Create thread using ensureThread
      thread = await ensureThread({
        productId,
        buyerId: userId,
        sellerId: product.sellerId._id,
      });

      // Populate after creation
      await thread.populate('buyerId', 'firstName lastName email');
      await thread.populate('sellerId', 'firstName lastName email');
      await thread.populate('productId', 'title imageUrl');
    }

    // Determine the other user
    const otherUser = thread.buyerId._id.toString() === userId
      ? thread.sellerId
      : thread.buyerId;

    res.json({
      success: true,
      data: {
        threadId: thread._id,
        contactName: `${otherUser.firstName} ${otherUser.lastName}`,
        contactId: otherUser._id,
        productTitle: thread.productId?.title || 'Unknown Product',
        productImage: thread.productId?.imageUrl || null,
      },
    });
  } catch (error) {
    console.error('Error fetching thread by product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thread',
      error: error.message,
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Count messages where receiver is the user and message is unread
    // Include messages without isRead field (backward compatibility) or with isRead: false
    const unreadMessages = await Message.countDocuments({
      receiverId: userId,
      $or: [
        { isRead: false },
        { isRead: { $exists: false } }, // Include old messages without isRead field
      ],
    });

    res.json({
      success: true,
      count: unreadMessages,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message,
    });
  }
};

// Mark all messages in a thread as read for the current user
export const markThreadMessagesAsRead = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.userId;

    if (!threadId) {
      return res.status(400).json({
        success: false,
        message: 'Thread ID is required',
      });
    }

    // Verify thread exists and user is a participant
    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found',
      });
    }

    const isParticipant = 
      thread.buyerId.toString() === userId || 
      thread.sellerId.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this thread',
      });
    }

    // Mark all messages in this thread as read where current user is the receiver
    const result = await Message.updateMany(
      {
        threadId: thread._id,
        receiverId: userId,
        $or: [
          { isRead: false },
          { isRead: { $exists: false } },
        ],
      },
      { isRead: true }
    );

    console.log(`✅ Marked ${result.modifiedCount} message(s) as read for thread ${threadId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Messages marked as read',
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message,
    });
  }
};

