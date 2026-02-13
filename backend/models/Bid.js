import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
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
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount cannot be negative'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
bidSchema.index({ productId: 1 });
bidSchema.index({ buyerId: 1 });
bidSchema.index({ sellerId: 1 });
bidSchema.index({ createdAt: -1 });
bidSchema.index({ productId: 1, createdAt: -1 }); // Compound index for listing bids by product

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;

