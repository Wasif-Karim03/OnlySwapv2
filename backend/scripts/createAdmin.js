import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/onlyswap';

// Get command line arguments
const email = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] || 'admin'; // Default to 'admin', can be 'superadmin'

async function createAdmin() {
  try {
    // Validate inputs
    if (!email || !password) {
      console.error('❌ Usage: node createAdmin.js <email> <password> [role]');
      console.error('   Example: node createAdmin.js admin@onlyswap.com mypassword123 superadmin');
      process.exit(1);
    }

    // Validate role
    if (role !== 'admin' && role !== 'superadmin') {
      console.error('❌ Role must be either "admin" or "superadmin"');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.log('⚠️  Admin already exists! Deleting and recreating...');
      await Admin.deleteOne({ email: email.toLowerCase() });
    }

    // Create the admin
    // Password will be hashed automatically by the pre-save hook
    const admin = await Admin.create({
      email: email.toLowerCase(),
      password: password, // Will be hashed automatically
      role: role,
    });

    console.log('✅ Admin created successfully!');
    console.log('📝 Admin details:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin._id}`);
    console.log(`   Created: ${admin.createdAt}`);
    console.log('\n💡 You can now login at: POST /api/admin/login');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdmin();

