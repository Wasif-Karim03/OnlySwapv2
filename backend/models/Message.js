import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatThread',
    required: [true, 'Thread ID is required'],
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required'],
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver ID is required'],
  },
  text: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
  },
  productImage: {
    type: String,
    default: null, // Only included on first message (from bid)
  },
  kind: {
    type: String,
    enum: ['system', 'user'],
    default: 'user',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
messageSchema.index({ threadId: 1, createdAt: -1 }); // Compound index for loading chat history
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

