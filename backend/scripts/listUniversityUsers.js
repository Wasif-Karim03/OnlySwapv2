import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get MONGO_URI from command line argument or environment variable
// Usage: node listUniversityUsers.js "University Name" "mongodb+srv://..."
// Or set MONGO_URI in .env file
const mongoURI = process.argv[3] || process.env.MONGO_URI || 'mongodb://localhost:27017/onlyswap';

// Get university name from command line argument
const universityName = process.argv[2] || 'Ohio Wesleyan University';

console.log('🔗 Connecting to:', mongoURI.includes('localhost') ? 'LOCAL database' : 'PRODUCTION database (Railway/Atlas)');
console.log('');

async function listUniversityUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users from the specified university (case-insensitive)
    const users = await User.find({
      university: { $regex: new RegExp(`^${universityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      isDeleted: false,
    }).select('firstName lastName email university createdAt');

    console.log(`📊 Found ${users.length} user(s) from "${universityName}":\n`);
    console.log('═'.repeat(80));

    if (users.length === 0) {
      console.log('No users found for this university.');
      process.exit(0);
    }

    // Get product counts for each user
    let totalProducts = 0;
    let totalAvailableProducts = 0;
    let totalSoldProducts = 0;
    let totalSuspendedProducts = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Count all products (including deleted and suspended for admin view)
      const allProducts = await Product.find({ sellerId: user._id });
      const availableProducts = await Product.find({ 
        sellerId: user._id, 
        status: 'available',
        isDeleted: false,
        isSuspended: false 
      });
      const soldProducts = await Product.find({ 
        sellerId: user._id, 
        status: 'sold',
        isDeleted: false 
      });
      const suspendedProducts = await Product.find({ 
        sellerId: user._id, 
        isSuspended: true 
      });

      const productCount = allProducts.length;
      const availableCount = availableProducts.length;
      const soldCount = soldProducts.length;
      const suspendedCount = suspendedProducts.length;

      totalProducts += productCount;
      totalAvailableProducts += availableCount;
      totalSoldProducts += soldCount;
      totalSuspendedProducts += suspendedCount;

      console.log(`\n${i + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   University: ${user.university}`);
      console.log(`   Account Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   Products Posted:`);
      console.log(`      - Total: ${productCount}`);
      console.log(`      - Available: ${availableCount}`);
      console.log(`      - Sold: ${soldCount}`);
      console.log(`      - Suspended: ${suspendedCount}`);
      console.log(`   ${user.isSuspended ? '⚠️  ACCOUNT SUSPENDED' : '✅ Active'}`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n📈 SUMMARY:');
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Total Products Posted: ${totalProducts}`);
    console.log(`   Available Products: ${totalAvailableProducts}`);
    console.log(`   Sold Products: ${totalSoldProducts}`);
    console.log(`   Suspended Products: ${totalSuspendedProducts}`);
    console.log(`   Average Products per User: ${(totalProducts / users.length).toFixed(2)}`);
    console.log('═'.repeat(80) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
listUniversityUsers();

