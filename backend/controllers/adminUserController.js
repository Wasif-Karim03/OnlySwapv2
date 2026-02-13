import Bid from '../models/Bid.js';
import ChatThread from '../models/ChatThread.js';
import FeedComment from '../models/FeedComment.js';
import FeedPost from '../models/FeedPost.js';
import Product from '../models/Product.js';
import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';
import { sendAdminEmailToUser } from '../utils/emailService.js';

export const getUsers = async (req, res) => {
  try {
    const { search, university, suspended, includeDeleted } = req.query;
    const filter = {};

    if (university) filter.university = university;
    if (suspended !== undefined) filter.isSuspended = suspended === 'true';
    
    // Admins can see deleted users if includeDeleted=true, otherwise exclude them
    // Use $or to match both false and undefined (for existing users before soft delete was added)
    if (includeDeleted !== 'true') {
      filter.$or = [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ];
    }
    
    // Handle search - combine with existing $or if it exists
    if (search) {
      const searchConditions = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
      
      // If we already have $or for isDeleted, use $and to combine
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: searchConditions }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).select('-password');
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('❌ Get users error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get all products with full details (admins can see deleted products)
    const products = await Product.find({ sellerId: user._id })
      .sort({ createdAt: -1 })
      .select('-sellerId');

    // Get all bids with product details
    const bids = await Bid.find({ buyerId: user._id })
      .populate('productId', 'title price status category')
      .populate('sellerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Get bids received on user's products
    const bidsReceived = await Bid.find({ sellerId: user._id })
      .populate('productId', 'title price status category')
      .populate('buyerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Get chat threads
    const chatThreadsAsBuyer = await ChatThread.find({ buyerId: user._id })
      .populate('productId', 'title price')
      .populate('sellerId', 'firstName lastName email')
      .sort({ lastMessageAt: -1 });

    const chatThreadsAsSeller = await ChatThread.find({ sellerId: user._id })
      .populate('productId', 'title price')
      .populate('buyerId', 'firstName lastName email')
      .sort({ lastMessageAt: -1 });

    // Get support tickets
    const supportTickets = await SupportTicket.find({ userId: user._id })
      .sort({ createdAt: -1 });

    // Get reports against this user
    const reports = await SupportTicket.find({ reportedUserId: user._id })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Get feed posts made by this user (admins can see deleted posts)
    const feedPosts = await FeedPost.find({ userId: user._id })
      .populate('userId', 'firstName lastName email university')
      .sort({ createdAt: -1 });
    
    // Format posts to include like count and populate limited likes list
    const formattedFeedPosts = await Promise.all(
      feedPosts.map(async (post) => {
        const postObj = post.toObject();
        // Get total like count
        postObj.likeCount = post.likes ? post.likes.length : 0;
        // Populate only first 50 likes for performance (if any)
        if (post.likes && post.likes.length > 0) {
          const limitedLikes = post.likes.slice(0, 50);
          const populatedLikes = await User.find({ _id: { $in: limitedLikes } })
            .select('firstName lastName email');
          postObj.likes = populatedLikes;
        } else {
          postObj.likes = [];
        }
        return postObj;
      })
    );

    // Get feed comments made by this user (admins can see deleted comments)
    const feedComments = await FeedComment.find({ userId: user._id })
      .populate('userId', 'firstName lastName email university')
      .populate('postId', 'content')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      products: {
        total: products.length,
        available: products.filter(p => p.status === 'available').length,
        sold: products.filter(p => p.status === 'sold').length,
        pending: products.filter(p => p.status === 'pending').length,
      },
      bids: {
        made: bids.length,
        received: bidsReceived.length,
        total: bids.length + bidsReceived.length,
      },
      chats: {
        asBuyer: chatThreadsAsBuyer.length,
        asSeller: chatThreadsAsSeller.length,
        total: chatThreadsAsBuyer.length + chatThreadsAsSeller.length,
      },
      supportTickets: supportTickets.length,
      reports: reports.length,
      feedPosts: feedPosts.length,
      feedComments: feedComments.length,
    };

    res.json({ 
      success: true, 
      data: { 
        user, 
        stats,
        products,
        bids,
        bidsReceived,
        chatThreads: {
          asBuyer: chatThreadsAsBuyer,
          asSeller: chatThreadsAsSeller,
        },
        supportTickets,
        reports,
        feedPosts: formattedFeedPosts, // Feed posts with full user info visible
        feedComments, // Feed comments with full user info visible
      }
    });
  } catch (err) {
    console.error('❌ Get user by ID error:', err);
    res.status(500).json({ message: 'Error fetching user details', error: err.message });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.json({ 
      success: true, 
      message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'}`,
      data: { user }
    });
  } catch (err) {
    console.error('❌ Suspend user error:', err);
    res.status(500).json({ message: 'Error updating suspension' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if already deleted
    if (user.isDeleted) {
      return res.status(400).json({ 
        success: false,
        message: 'User already deleted' 
      });
    }

    const adminId = req.admin?._id || req.user?.userId;

    // Soft delete the user (preserve for admin history)
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = adminId;
    await user.save();

    // Cascade soft delete: Products (preserve for admin history)
    await Product.updateMany(
      { sellerId: user._id, isDeleted: false },
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        deletedBy: adminId 
      }
    );

    // Cascade soft delete: Feed Posts (preserve for admin history)
    await FeedPost.updateMany(
      { userId: user._id, isDeleted: false },
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        deletedBy: adminId 
      }
    );

    // Cascade soft delete: Feed Comments (preserve for admin history)
    await FeedComment.updateMany(
      { userId: user._id, isDeleted: false },
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        deletedBy: adminId 
      }
    );

    // Hard delete: Bids and Support Tickets (these don't need history)
    await Bid.deleteMany({ buyerId: user._id });
    await Bid.deleteMany({ sellerId: user._id });
    await SupportTicket.deleteMany({ userId: user._id });
    await SupportTicket.deleteMany({ reportedUserId: user._id });

    console.log('✅ User deleted (soft) by admin:', user.email);
    console.log('✅ Cascaded soft delete to products, posts, and comments');
    console.log('✅ Deleted bids and support tickets');

    res.json({ 
      success: true, 
      message: 'User and related data deleted. History preserved for admin access.' 
    });
  } catch (err) {
    console.error('❌ Delete user error:', err);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

export const sendEmailToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const admin = req.admin;

    await sendAdminEmailToUser({
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      subject,
      message,
      adminEmail: admin.email,
      adminName: `Admin (${admin.email})`,
    });

    res.json({ 
      success: true, 
      message: 'Email sent successfully to user' 
    });
  } catch (err) {
    console.error('❌ Send email error:', err);
    res.status(500).json({ 
      message: err.message || 'Error sending email' 
    });
  }
};

