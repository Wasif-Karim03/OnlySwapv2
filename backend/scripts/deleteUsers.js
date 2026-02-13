import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/onlyswap';

async function deleteUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Emails to delete
    const emailsToDelete = [
      'khairul.islam@hws.edu',  // Account 2
      'test@harvard.edu'         // Account 3
    ];

    console.log('🗑️  Deleting accounts...\n');

    for (const email of emailsToDelete) {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        await User.deleteOne({ email: email.toLowerCase() });
        console.log(`✅ Deleted: ${user.firstName} ${user.lastName} (${email})`);
      } else {
        console.log(`⚠️  Account not found: ${email}`);
      }
    }

    console.log('\n✅ Deletion complete!');
    
    // Show remaining accounts
    const remainingCount = await User.countDocuments({});
    console.log(`\n📊 Remaining accounts: ${remainingCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    process.exit(1);
  }
}

// Run the script
deleteUsers();

