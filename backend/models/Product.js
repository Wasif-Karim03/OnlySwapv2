import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required'],
  },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  imageUrl: {
    type: String,
    default: null,
  },
  images: {
    type: [String],
    default: [],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Textbooks', 'Electronics', 'Clothing', 'Furniture', 'Sports Equipment', 'Other'],
  },
  university: {
    type: String,
    required: [true, 'University is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'pending'],
    default: 'available',
  },
  // Swipe tracking
  leftSwipeCount: {
    type: Number,
    default: 0,
  },
  rightSwipeCount: {
    type: Number,
    default: 0,
  },
  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Suspension fields
  isSuspended: {
    type: Boolean,
    default: false,
  },
  suspendedAt: {
    type: Date,
    default: null,
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
  },
  suspensionReason: {
    type: String,
    default: null,
    trim: true,
    maxlength: [500, 'Suspension reason cannot exceed 500 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
productSchema.index({ sellerId: 1 });
productSchema.index({ university: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ university: 1, status: 1 }); // Compound index for common queries
productSchema.index({ isDeleted: 1 }); // For filtering deleted products
productSchema.index({ sellerId: 1, isDeleted: 1 }); // For seller's products query
productSchema.index({ isSuspended: 1 }); // For filtering suspended products
productSchema.index({ isDeleted: 1, isSuspended: 1 }); // Compound index for marketplace queries

const Product = mongoose.model('Product', productSchema);

export default Product;

