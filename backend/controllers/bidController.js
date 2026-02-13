import Bid from '../models/Bid.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ensureThread, createAndEmitMessage } from '../services/threadService.js';

// Create a new bid
export const createBid = async (req, res) => {
  try {
    const { productId, amount } = req.body;
    const buyerId = req.user.userId;

    // Validation
    if (!productId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and bid amount are required',
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid bid amount',
      });
    }

    // Get product details
    const product = await Product.findById(productId)
      .populate('sellerId', 'firstName lastName');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Get product image - prioritize first image from images array, fallback to imageUrl
    const productImage = product.images && product.images.length > 0 
      ? product.images[0] 
      : product.imageUrl || null;

    // Prevent users from bidding on their own products
    if (product.sellerId._id.toString() === buyerId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot bid on your own product',
      });
    }

    // Check if product is still available
    if (product.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'This product is no longer available',
      });
    }

    // Verify product is from user's university
    if (req.user && req.user.university) {
      if (product.university !== req.user.university) {
        return res.status(403).json({
          success: false,
          message: 'You can only bid on products from your university',
        });
      }
    }

    // Get buyer info
    const buyer = await User.findById(buyerId);

    // Create bid
    const bid = await Bid.create({
      productId,
      buyerId,
      sellerId: product.sellerId._id,
      amount,
    });

    await bid.populate('buyerId', 'firstName lastName');

    // Ensure thread exists for buyer/seller/product
    const thread = await ensureThread({
      productId,
      buyerId,
      sellerId: product.sellerId._id,
    });

    // Create initial system message with product image (image first, then text)
    const text = `I'm bidding $${amount} for "${product.title}".`;
    const autoMessage = await createAndEmitMessage({
      io: req.io,
      thread,
      senderId: buyerId,
      receiverId: product.sellerId._id,
      text,
      productImage: productImage, // Use first image from images array or imageUrl
      kind: 'system',
    });

    // Create notification for seller about the new bid
    const buyerName = `${bid.buyerId.firstName} ${bid.buyerId.lastName}`;
    const notification = await Notification.create({
      userId: product.sellerId._id,
      type: 'bid',
      message: `${buyerName} placed a bid of $${amount} on "${product.title}"`,
      relatedId: thread._id.toString(), // Store threadId so we can navigate to chat
      isRead: false,
    });

    console.log('✅ Created bid notification:', notification._id);

    // Emit notification via Socket.IO to seller
    req.io.to(product.sellerId._id.toString()).emit('newNotification', {
      type: 'bid',
      message: `${buyerName} placed a bid of $${amount} on "${product.title}"`,
      threadId: thread._id.toString(),
      productId: productId.toString(),
    });

    console.log('✅ Bid created with notification:', {
      threadId: thread._id,
      messageId: autoMessage._id,
      amount,
      sellerId: product.sellerId._id,
    });

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      threadId: thread._id.toString(),
      message: autoMessage,
      data: {
        bid,
        threadId: thread._id,
      },
    });
  } catch (error) {
    console.error('Error creating bid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bid',
      error: error.message,
    });
  }
};

// Get bids by product
export const getBidsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // First, verify the product exists and is from user's university
    const product = await Product.findById(productId);
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
          message: 'You can only view bids for products from your university',
        });
      }
    }

    const bids = await Bid.find({ productId })
      .populate('buyerId', 'firstName lastName email')
      .sort({ amount: -1 }); // Highest bids first

    res.json({
      success: true,
      count: bids.length,
      data: bids,
    });
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bids',
      error: error.message,
    });
  }
};

// Get my bids (as buyer)
export const getMyBids = async (req, res) => {
  try {
    const userId = req.user.userId;

    const bids = await Bid.find({ buyerId: userId })
      .populate('productId')
      .populate('sellerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bids.length,
      data: bids,
    });
  } catch (error) {
    console.error('Error fetching user bids:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your bids',
      error: error.message,
    });
  }
};

// Get bids on my products (as seller)
export const getBidsOnMyProducts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const bids = await Bid.find({ sellerId: userId })
      .populate('productId')
      .populate('buyerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bids.length,
      data: bids,
    });
  } catch (error) {
    console.error('Error fetching bids on your products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bids on your products',
      error: error.message,
    });
  }
};

