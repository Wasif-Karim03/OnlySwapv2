import mongoose from 'mongoose';

const FeedCommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedPost',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedComment',
    default: null, // null means it's a top-level comment
  },
  university: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    trim: true,
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
FeedCommentSchema.index({ postId: 1, createdAt: -1 });
FeedCommentSchema.index({ userId: 1 });
FeedCommentSchema.index({ university: 1 });
FeedCommentSchema.index({ parentCommentId: 1 });
FeedCommentSchema.index({ isDeleted: 1 }); // For filtering deleted comments
FeedCommentSchema.index({ userId: 1, isDeleted: 1 }); // For user's comments query

const FeedComment = mongoose.model('FeedComment', FeedCommentSchema);

export default FeedComment;

