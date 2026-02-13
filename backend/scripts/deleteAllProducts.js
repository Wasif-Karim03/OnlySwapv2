import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/onlyswap';

async function deleteAllProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Count products before deletion
    const productCount = await Product.countDocuments({});
    console.log(`📦 Found ${productCount} product(s) to delete\n`);

    if (productCount === 0) {
      console.log('⚠️  No products found in the database.');
      process.exit(0);
    }

    // Delete all products
    const result = await Product.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} product(s)`);
    console.log('\n✅ All products removed from database!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting products:', error);
    process.exit(1);
  }
}

// Run the script
deleteAllProducts();

