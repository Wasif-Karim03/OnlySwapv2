import mongoose from 'mongoose';

const passwordResetCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Reset code is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: automatically delete documents after 10 minutes
passwordResetCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 }); // 600 seconds = 10 minutes

// Index for fast lookups by email and code
passwordResetCodeSchema.index({ email: 1, code: 1 });

const PasswordResetCode = mongoose.model('PasswordResetCode', passwordResetCodeSchema);

export default PasswordResetCode;

