import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  type: {
    type: String,
    enum: ['bug', 'user_report', 'support'],
    required: [true, 'Ticket type is required'],
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },
  userData: {
    // Store user data snapshot at time of report
    email: String,
    firstName: String,
    lastName: String,
    university: String,
    userId: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ type: 1, status: 1 });
supportTicketSchema.index({ createdAt: -1 });

// Update updatedAt before saving
supportTicketSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;

