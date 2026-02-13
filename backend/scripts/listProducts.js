import mongoose from 'mongoose';
import Product from '../models/Product.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/onlyswap';

async function listProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Get all products with populated seller info
    const products = await Product.find({})
      .populate('sellerId', 'firstName lastName email university')
      .sort({ createdAt: -1 });
    const productCount = products.length;

    console.log(`📦 Total Products: ${productCount}\n`);

    if (productCount === 0) {
      console.log('⚠️  No products found in the database.');
    } else {
      console.log('📋 Product Listings:\n');
      products.forEach((product, index) => {
        const sellerName = product.sellerId?.firstName && product.sellerId?.lastName
          ? `${product.sellerId.firstName} ${product.sellerId.lastName}`
          : product.sellerId?._id?.toString() || 'Unknown';
        const sellerEmail = product.sellerId?.email || 'N/A';
        
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   📝 Description: ${product.description || 'N/A'}`);
        console.log(`   💰 Price: $${product.price}`);
        console.log(`   🏷️  Category: ${product.category || 'N/A'}`);
        console.log(`   🏫 University: ${product.university || 'N/A'}`);
        console.log(`   📊 Status: ${product.status || 'available'}`);
        console.log(`   👤 Seller: ${sellerName} (${sellerEmail})`);
        console.log(`   📅 Created: ${product.createdAt.toLocaleString()}`);
        if (product.images && product.images.length > 0) {
          console.log(`   🖼️  Images (${product.images.length}):`);
          product.images.forEach((img, i) => {
            console.log(`      ${i + 1}. ${img}`);
          });
        } else if (product.imageUrl) {
          console.log(`   🖼️  Image: ${product.imageUrl}`);
        } else {
          console.log(`   🖼️  Images: None`);
        }
        console.log(`   🆔 ID: ${product._id}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing products:', error);
    process.exit(1);
  }
}

// Run the script
listProducts();

