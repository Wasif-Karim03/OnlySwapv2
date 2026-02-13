import mongoose from 'mongoose';

const verificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Verification code is required'],
  },
  userData: {
    firstName: String,
    lastName: String,
    university: String,
    password: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: automatically delete documents after 2 minutes
verificationCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 }); // 120 seconds = 2 minutes

// Index for fast lookups by email and code
verificationCodeSchema.index({ email: 1, code: 1 });

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);

export default VerificationCode;

