import Notification from '../models/Notification.js';

// Get all notifications for a user (excluding message notifications - those show in Chat tab)
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50 } = req.query;

    // Fetch bid, sale, and admin_message notifications (message notifications show in Chat tab)
    const notifications = await Notification.find({ 
      userId,
      type: { $in: ['bid', 'sale', 'admin_message'] } // Include admin messages
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Count unread notifications (including admin messages)
    const unreadCount = await Notification.countDocuments({
      userId,
      type: { $in: ['bid', 'sale', 'admin_message'] }, // Include admin messages
      isRead: false,
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
};

// Get unread notifications count (excluding message notifications)
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Count bid, sale, and admin_message notifications (message notifications show in Chat tab)
    const unreadCount = await Notification.countDocuments({
      userId,
      type: { $in: ['bid', 'sale', 'admin_message'] }, // Include admin messages
      isRead: false,
    });

    res.json({
      success: true,
      count: unreadCount,
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

// Get unread message notifications count per thread (for chat tab badges)
export const getUnreadMessageNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all unread message notifications
    const unreadMessages = await Notification.find({
      userId,
      type: 'message',
      isRead: false,
    }).select('relatedId');

    // Count unread messages per thread
    const threadCounts = {};
    unreadMessages.forEach((notification) => {
      const threadId = notification.relatedId?.toString();
      if (threadId) {
        threadCounts[threadId] = (threadCounts[threadId] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: threadCounts,
      total: unreadMessages.length,
    });
  } catch (error) {
    console.error('Error fetching unread message notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread message notifications',
      error: error.message,
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Find notification and verify it belongs to the user
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own notifications as read',
      });
    }

    // Update notification
    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
};

// Mark all message notifications for a thread as read
export const markThreadMessageNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { threadId } = req.params;

    if (!threadId) {
      return res.status(400).json({
        success: false,
        message: 'Thread ID is required',
      });
    }

    const result = await Notification.updateMany(
      { 
        userId, 
        type: 'message',
        relatedId: threadId,
        isRead: false 
      },
      { isRead: true }
    );

    console.log(`✅ Marked ${result.modifiedCount} message notification(s) as read for thread ${threadId}`);

    res.json({
      success: true,
      message: 'Message notifications marked as read',
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error marking thread message notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message notifications as read',
      error: error.message,
    });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Find notification and verify it belongs to the user
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own notifications',
      });
    }

    await Notification.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
};

