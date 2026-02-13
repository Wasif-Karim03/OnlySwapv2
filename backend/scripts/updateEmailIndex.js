/**
 * Migration script to update email unique index to partial index
 * This allows soft-deleted users to have the same email, but prevents duplicates for active users
 * 
 * Run this script once to update the database index:
 * node scripts/updateEmailIndex.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onlyswap';

async function updateEmailIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Drop the old unique index on email if it exists
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Dropped old unique index on email');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️  Old unique index on email does not exist (already removed)');
      } else {
        console.log('⚠️  Could not drop old index (may not exist):', err.message);
      }
    }

    // Create new partial unique index (only for non-deleted users)
    await collection.createIndex(
      { email: 1 },
      {
        unique: true,
        partialFilterExpression: { isDeleted: false },
        name: 'email_1_partial'
      }
    );
    console.log('✅ Created new partial unique index on email (only for non-deleted users)');

    console.log('✅ Migration completed successfully!');
    console.log('📝 Note: Soft-deleted users can now have duplicate emails, but active users cannot.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

updateEmailIndex();


