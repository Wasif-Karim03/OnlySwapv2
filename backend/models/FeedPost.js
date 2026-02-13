import mongoose from 'mongoose';

const FeedPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  university: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: [1000, 'Content cannot exceed 1000 characters'],
    trim: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  commentCount: {
    type: Number,
    default: 0,
  },
  isAnonymous: {
    type: Boolean,
    default: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
FeedPostSchema.index({ university: 1, createdAt: -1 });
FeedPostSchema.index({ userId: 1 });
FeedPostSchema.index({ createdAt: -1 });
FeedPostSchema.index({ isDeleted: 1 }); // For filtering deleted posts
FeedPostSchema.index({ userId: 1, isDeleted: 1 }); // For user's posts query

const FeedPost = mongoose.model('FeedPost', FeedPostSchema);

export default FeedPost;

