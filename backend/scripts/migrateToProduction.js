import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

// Get connection strings from command line
const localURI = process.argv[2] || 'mongodb://localhost:27017/onlyswap';
const productionURI = process.argv[3];

if (!productionURI) {
  console.error('❌ Error: Production MONGO_URI is required!');
  console.error('');
  console.error('Usage:');
  console.error('  node scripts/migrateToProduction.js [local_uri] [production_uri]');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/migrateToProduction.js mongodb://localhost:27017/onlyswap mongodb+srv://...');
  console.error('');
  console.error('To get production URI:');
  console.error('  1. Go to https://railway.app');
  console.error('  2. Open your OnlySwap project');
  console.error('  3. Click on MongoDB service (or check Variables tab)');
  console.error('  4. Copy the MONGO_URI value');
  process.exit(1);
}

let localConnection, productionConnection;

async function migrateToProduction() {
  try {
    console.log('🔄 Starting migration from LOCAL to PRODUCTION...\n');
    
    // Connect to local database
    console.log('📡 Connecting to LOCAL database...');
    localConnection = await mongoose.createConnection(localURI).asPromise();
    console.log('✅ Connected to LOCAL database\n');
    
    // Connect to production database
    console.log('📡 Connecting to PRODUCTION database...');
    productionConnection = await mongoose.createConnection(productionURI).asPromise();
    console.log('✅ Connected to PRODUCTION database\n');
    
    // Get models for both databases
    const LocalUser = localConnection.model('User', User.schema);
    const LocalProduct = localConnection.model('Product', Product.schema);
    const ProductionUser = productionConnection.model('User', User.schema);
    const ProductionProduct = productionConnection.model('Product', Product.schema);
    
    // Step 1: Migrate Users
    console.log('👥 Step 1: Migrating users...');
    const localUsers = await LocalUser.find({ isDeleted: false });
    console.log(`   Found ${localUsers.length} user(s) in local database`);
    
    let usersCreated = 0;
    let usersSkipped = 0;
    
    for (const user of localUsers) {
      // Check if user already exists in production
      const existingUser = await ProductionUser.findOne({ email: user.email });
      
      if (existingUser) {
        console.log(`   ⚠️  User ${user.email} already exists in production - skipping`);
        usersSkipped++;
      } else {
        // Create user in production (without password hash - they'll need to reset)
        // Actually, we should copy the password hash so they can login
        const newUser = await ProductionUser.create({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: user.password, // Copy password hash
          university: user.university,
          profilePicture: user.profilePicture,
          role: user.role,
          isSuspended: user.isSuspended,
          createdAt: user.createdAt,
        });
        console.log(`   ✅ Migrated user: ${user.email} (${user.firstName} ${user.lastName})`);
        usersCreated++;
      }
    }
    
    console.log(`   ✅ Users: ${usersCreated} created, ${usersSkipped} skipped\n`);
    
    // Step 2: Migrate Products
    console.log('📦 Step 2: Migrating products...');
    const localProducts = await LocalProduct.find({ isDeleted: false });
    console.log(`   Found ${localProducts.length} product(s) in local database`);
    
    let productsCreated = 0;
    let productsSkipped = 0;
    
    for (const product of localProducts) {
      // Find the seller in production
      const localSeller = await LocalUser.findById(product.sellerId);
      if (!localSeller) {
        console.log(`   ⚠️  Seller not found for product "${product.title}" - skipping`);
        productsSkipped++;
        continue;
      }
      
      const productionSeller = await ProductionUser.findOne({ email: localSeller.email });
      if (!productionSeller) {
        console.log(`   ⚠️  Seller ${localSeller.email} not found in production - skipping product`);
        productsSkipped++;
        continue;
      }
      
      // Check if product already exists (by title and seller)
      const existingProduct = await ProductionProduct.findOne({
        title: product.title,
        sellerId: productionSeller._id,
        createdAt: product.createdAt,
      });
      
      if (existingProduct) {
        console.log(`   ⚠️  Product "${product.title}" already exists - skipping`);
        productsSkipped++;
      } else {
        // Create product in production
        const newProduct = await ProductionProduct.create({
          sellerId: productionSeller._id,
          title: product.title,
          description: product.description,
          price: product.price,
          category: product.category,
          university: product.university,
          imageUrl: product.imageUrl,
          images: product.images,
          status: product.status,
          leftSwipeCount: product.leftSwipeCount,
          rightSwipeCount: product.rightSwipeCount,
          isDeleted: product.isDeleted,
          deletedAt: product.deletedAt,
          deletedBy: product.deletedBy,
          isSuspended: product.isSuspended,
          suspendedAt: product.suspendedAt,
          suspendedBy: product.suspendedBy,
          suspensionReason: product.suspensionReason,
          createdAt: product.createdAt,
        });
        console.log(`   ✅ Migrated product: "${product.title}" by ${localSeller.email}`);
        productsCreated++;
      }
    }
    
    console.log(`   ✅ Products: ${productsCreated} created, ${productsSkipped} skipped\n`);
    
    // Summary
    console.log('═'.repeat(80));
    console.log('📊 MIGRATION SUMMARY:');
    console.log('═'.repeat(80));
    console.log(`   Users migrated: ${usersCreated}`);
    console.log(`   Users skipped (already exist): ${usersSkipped}`);
    console.log(`   Products migrated: ${productsCreated}`);
    console.log(`   Products skipped: ${productsSkipped}`);
    console.log('═'.repeat(80));
    console.log('\n✅ Migration completed successfully!');
    console.log('\n⚠️  IMPORTANT: Update your .env file to use production MONGO_URI');
    console.log('   Change: MONGO_URI=mongodb://localhost:27017/onlyswap');
    console.log(`   To:     MONGO_URI=${productionURI}`);
    console.log('');
    
    // Close connections
    await localConnection.close();
    await productionConnection.close();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error.stack);
    if (localConnection) await localConnection.close();
    if (productionConnection) await productionConnection.close();
    process.exit(1);
  }
}

migrateToProduction();

