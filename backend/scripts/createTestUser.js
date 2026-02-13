import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/onlyswap';

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'cjbegg@owu.edu' });
    if (existingUser) {
      console.log('⚠️  User already exists! Deleting and recreating...');
      await User.deleteOne({ email: 'cjbegg@owu.edu' });
    }

    // Create the test user
    // Password will be hashed automatically by the pre-save hook
    const testUser = await User.create({
      firstName: 'Christian',
      lastName: 'Begg',
      email: 'cjbegg@owu.edu',
      password: 'Cj2003#,,', // Will be hashed automatically
      university: 'Ohio Wesleyan University', // Extracted from email domain
    });

    console.log('✅ Test user created successfully!');
    console.log('📝 User details:');
    console.log(`   Name: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   University: ${testUser.university}`);
    console.log(`   ID: ${testUser._id}`);
    console.log('\n💡 You can now login with:');
    console.log('   Email: cjbegg@owu.edu');
    console.log('   Password: Cj2003#,,');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

// Run the script
createTestUser();

