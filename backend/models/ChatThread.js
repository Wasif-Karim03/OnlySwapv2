import mongoose from 'mongoose';

const chatThreadSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false, // Optional for feed posts
    default: null,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer ID is required'],
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required'],
  },
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Unique compound index to guarantee one thread per buyer/seller/product combination
// For products, ensure unique combination
chatThreadSchema.index(
  { buyerId: 1, sellerId: 1, productId: 1 },
  { 
    unique: true,
    partialFilterExpression: { productId: { $ne: null } },
    sparse: true
  }
);
// For feed posts (no product), ensure one thread per user pair (bidirectional)
chatThreadSchema.index(
  { buyerId: 1, sellerId: 1 },
  { 
    unique: true,
    partialFilterExpression: { productId: null },
    sparse: true
  }
);

// Additional indexes for performance
chatThreadSchema.index({ buyerId: 1, lastMessageAt: -1 });
chatThreadSchema.index({ sellerId: 1, lastMessageAt: -1 });
chatThreadSchema.index({ productId: 1 });

const ChatThread = mongoose.model('ChatThread', chatThreadSchema);

export default ChatThread;

