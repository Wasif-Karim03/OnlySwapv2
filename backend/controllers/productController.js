import Product from '../models/Product.js';
import Bid from '../models/Bid.js';
import logger from '../utils/logger.js';
import { processUploadedImage } from '../utils/imageOptimizer.js';
import { uploadToCloudinary } from '../utils/cloudinaryService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all products (with optional filters and pagination)
// Note: This route now requires authentication to filter by university
export const getProducts = async (req, res) => {
  try {
    const { 
      category, 
      status = 'available', 
      page = 1, 
      limit = 20,
      excludeSeller,
      excludeBidProducts,
    } = req.query;

          // Build filter object
          // Note: isSuspended field may not exist for older products (undefined), so we check for != true
          const filter = { 
            status, 
            isDeleted: false, 
            isSuspended: { $ne: true } // Exclude suspended products (matches false, null, and undefined)
          };
    
    // CRITICAL: Filter by user's university if authenticated
    // This ensures users only see products from their own university
    // Use case-insensitive matching to handle variations
    if (req.user && req.user.university) {
      const userUniversity = req.user.university.trim();
      // Use MongoDB $regex with $options for case-insensitive matching (more reliable)
      filter.university = { 
        $regex: `^${userUniversity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 
        $options: 'i' 
      };
      logger.info(`🔍 Filtering products by university (case-insensitive): "${userUniversity}"`);
    } else {
      // If not authenticated, return empty (or require auth - your choice)
      // For security, require authentication for marketplace
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view products',
      });
    }
    
    if (category) filter.category = category;
    
    // Exclude seller's own products if excludeSeller parameter is provided (for buyer mode)
    if (excludeSeller) {
      filter.sellerId = { $ne: excludeSeller };
    }

    // Exclude products the user has already placed bids on (when requested)
    const shouldExcludeBidProducts = excludeBidProducts === 'true' || excludeBidProducts === true;
    if (shouldExcludeBidProducts && req.user?.userId) {
      const bidProductIds = await Bid.distinct('productId', { buyerId: req.user.userId });
      if (bidProductIds.length > 0) {
        filter._id = { ...(filter._id || {}), $nin: bidProductIds };
      }
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    logger.info(`📊 Found ${total} product(s) matching filters`);

    // Fetch products (exclude deleted) with pagination
    const products = await Product.find(filter)
      .populate('sellerId', 'firstName lastName email university')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    logger.info(`✅ Returning ${products.length} product(s) (page ${pageNum}, limit ${limitNum})`);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get single product by ID
// If user is authenticated, verify product is from their university
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ 
      _id: id,
      isDeleted: false,
      isSuspended: false 
    })
      .populate('sellerId', 'firstName lastName email university');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // If user is authenticated, verify product is from their university
    // This prevents users from accessing products from other universities
    if (req.user && req.user.university) {
      if (product.university !== req.user.university) {
        return res.status(403).json({
          success: false,
          message: 'You can only view products from your university',
        });
      }
    }
    // If not authenticated, allow access (for public viewing, but this is less secure)
    // Consider requiring authentication if you want strict university isolation

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, university, images } = req.body;
    const sellerId = req.user.userId;

    logger.info(`📦 Creating product: ${title} by user ${sellerId}`);
    
    // Check if this is JSON request with Cloudinary URLs or FormData with files
    const isJsonRequest = req.headers['content-type']?.includes('application/json');
    const hasCloudinaryUrls = Array.isArray(images) && images.length > 0 && typeof images[0] === 'string' && images[0].startsWith('http');
    
    logger.info(`📁 Request type: ${isJsonRequest ? 'JSON (Cloudinary URLs)' : 'FormData (files)'}`);
    logger.info(`📁 Files received: ${req.files?.length || 0} files`);
    logger.info(`📁 Cloudinary URLs received: ${hasCloudinaryUrls ? images.length : 0} URLs`);

    // Validation
    if (!title || !description || !price || !category || !university) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }
    
    // Validate images
    if (hasCloudinaryUrls && images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required',
      });
    }
    
    if (!hasCloudinaryUrls && (!req.files || req.files.length === 0) && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required',
      });
    }

    // Handle images: either Cloudinary URLs (from client) or files (from FormData)
    let imageUrls = [];
    
    // If images are already Cloudinary URLs (from client-side upload)
    if (hasCloudinaryUrls) {
      logger.info(`☁️ Using Cloudinary URLs from client: ${images.length} images`);
      imageUrls = images; // Use the Cloudinary URLs directly
      logger.info(`✅ Using ${imageUrls.length} Cloudinary URLs`);
    } else {
      // Upload files to Cloudinary (if configured) or use local storage
      const useCloudinary = !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );

      if (useCloudinary) {
        logger.info('☁️ Using Cloudinary for image storage (server-side)');
        
        if (req.files && req.files.length > 0) {
          logger.info(`📸 Processing ${req.files.length} image(s) with Cloudinary`);
          for (const file of req.files) {
            try {
              logger.info(`🖼️ Uploading to Cloudinary: ${file.filename} (${file.size} bytes)`);
              const cloudinaryResult = await uploadToCloudinary(file.path, 'products');
              imageUrls.push(cloudinaryResult.url);
              logger.info(`✅ Image uploaded to Cloudinary: ${cloudinaryResult.url}`);
              
              // Clean up local file after upload
              const fs = await import('fs');
              try {
                await fs.promises.unlink(file.path);
              } catch (unlinkError) {
                logger.warn(`⚠️ Could not delete local file ${file.path}:`, unlinkError);
              }
            } catch (error) {
              logger.error(`❌ Failed to upload image ${file.filename} to Cloudinary:`, error);
              // Fallback to local storage if Cloudinary fails
              const uploadsDir = path.join(__dirname, '../uploads');
              try {
                const optimizedFilename = await processUploadedImage(file, uploadsDir);
                imageUrls.push(`/uploads/${optimizedFilename}`);
                logger.info(`✅ Fallback: Image saved locally: ${optimizedFilename}`);
              } catch (fallbackError) {
                logger.error(`❌ Fallback also failed for ${file.filename}:`, fallbackError);
              }
            }
          }
        } else if (req.file) {
          // Single image (backward compatibility)
          logger.info(`📸 Processing single image with Cloudinary: ${req.file.filename} (${req.file.size} bytes)`);
          try {
            const cloudinaryResult = await uploadToCloudinary(req.file.path, 'products');
            imageUrls.push(cloudinaryResult.url);
            logger.info(`✅ Image uploaded to Cloudinary: ${cloudinaryResult.url}`);
            
            // Clean up local file
            const fs = await import('fs');
            try {
              await fs.promises.unlink(req.file.path);
            } catch (unlinkError) {
              logger.warn(`⚠️ Could not delete local file ${req.file.path}:`, unlinkError);
            }
          } catch (error) {
            logger.error(`❌ Failed to upload image ${req.file.filename} to Cloudinary:`, error);
            // Fallback to local storage
            const uploadsDir = path.join(__dirname, '../uploads');
            try {
              const optimizedFilename = await processUploadedImage(req.file, uploadsDir);
              imageUrls.push(`/uploads/${optimizedFilename}`);
              logger.info(`✅ Fallback: Image saved locally: ${optimizedFilename}`);
            } catch (fallbackError) {
              logger.error(`❌ Fallback also failed:`, fallbackError);
            }
          }
        } else {
          logger.warn('⚠️ No images received in request');
        }
      } else {
        // Use local storage (original behavior)
        logger.info('📁 Using local storage for images (Cloudinary not configured)');
        const uploadsDir = path.join(__dirname, '../uploads');
        
        // Ensure uploads directory exists
        const fs = await import('fs');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
          logger.info('✅ Created uploads directory in createProduct');
        }
        
        if (req.files && req.files.length > 0) {
          logger.info(`📸 Processing ${req.files.length} image(s) locally`);
          for (const file of req.files) {
            try {
              logger.info(`🖼️ Processing image: ${file.filename} (${file.size} bytes)`);
              const optimizedFilename = await processUploadedImage(file, uploadsDir);
              imageUrls.push(`/uploads/${optimizedFilename}`);
              logger.info(`✅ Image processed: ${optimizedFilename}`);
            } catch (error) {
              logger.error(`❌ Failed to optimize image ${file.filename}:`, error);
              imageUrls.push(`/uploads/${file.filename}`);
            }
          }
        } else if (req.file) {
          logger.info(`📸 Processing single image locally: ${req.file.filename} (${req.file.size} bytes)`);
          try {
            const optimizedFilename = await processUploadedImage(req.file, uploadsDir);
            imageUrls.push(`/uploads/${optimizedFilename}`);
            logger.info(`✅ Image processed: ${optimizedFilename}`);
          } catch (error) {
            logger.error(`❌ Failed to optimize image ${req.file.filename}:`, error);
            imageUrls.push(`/uploads/${req.file.filename}`);
          }
        } else {
          logger.warn('⚠️ No images received in request');
        }
      }
    }

    // For backward compatibility, also set imageUrl to first image (relative path)
    const imageUrl = images.length > 0 ? images[0] : null;

    // Create product
    const product = await Product.create({
      sellerId,
      title,
      description,
      price,
      category,
      university,
      imageUrl, // Keep for backward compatibility (first image)
      images: imageUrls, // Array of image URLs (Cloudinary URLs or local paths)
    });

    // Populate seller info
    await product.populate('sellerId', 'firstName lastName email university');

    logger.info(`✅ Product created: ${product._id} by user ${sellerId}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Update product (only by seller)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    // Check if product exists and user owns it (exclude deleted and suspended products)
    const product = await Product.findOne({ 
      _id: id,
      isDeleted: false,
      isSuspended: false 
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.sellerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own products',
      });
    }

    // Update images if uploaded - optimize and store relative paths
    const uploadsDir = path.join(__dirname, '../uploads');
    if (req.files && req.files.length > 0) {
      // Process and optimize each image
      const newImages = [];
      for (const file of req.files) {
        try {
          const optimizedFilename = await processUploadedImage(file, uploadsDir);
          newImages.push(`/uploads/${optimizedFilename}`);
        } catch (error) {
          logger.error(`Failed to optimize image ${file.filename}:`, error);
          newImages.push(`/uploads/${file.filename}`);
        }
      }
      updateData.images = newImages;
      updateData.imageUrl = newImages[0]; // Update imageUrl to first image for backward compatibility
    } else if (req.file) {
      // Single image (backward compatibility)
      try {
        const optimizedFilename = await processUploadedImage(req.file, uploadsDir);
        updateData.imageUrl = `/uploads/${optimizedFilename}`;
        updateData.images = [updateData.imageUrl];
      } catch (error) {
        logger.error(`Failed to optimize image ${req.file.filename}:`, error);
        updateData.imageUrl = `/uploads/${req.file.filename}`;
        updateData.images = [updateData.imageUrl];
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('sellerId', 'firstName lastName email university');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Delete product (only by seller)
// Soft delete product (mark as deleted but keep in database)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if product exists and user owns it (exclude deleted and suspended products)
    const product = await Product.findOne({ 
      _id: id,
      isDeleted: false,
      isSuspended: false 
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.sellerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own products',
      });
    }

    // Soft delete: mark as deleted, store metadata, but keep in database
    product.isDeleted = true;
    product.deletedAt = new Date();
    product.deletedBy = userId;
    product.status = 'pending'; // Remove from marketplace
    await product.save();

    logger.info('✅ Product soft deleted:', {
      productId: id,
      deletedBy: userId,
      deletedAt: product.deletedAt,
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get seller's products (include deleted ones for seller to see)
export const getMyProducts = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all products (including deleted) for the seller
    const products = await Product.find({ sellerId: userId })
      .populate('sellerId', 'firstName lastName email university')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    logger.error('Error fetching user products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Mark product as sold
export const markAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const product = await Product.findOne({ 
      _id: id,
      isDeleted: false,
      isSuspended: false 
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.sellerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own products as sold',
      });
    }

    // Mark as sold - will be excluded from marketplace
    product.status = 'sold';
    await product.save();

    logger.info('✅ Product marked as sold:', id);

    res.json({
      success: true,
      message: 'Product marked as sold',
      data: product,
    });
  } catch (error) {
    logger.error('Error marking product as sold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark product as sold',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Track swipe (left = skip, right = interested)
export const trackSwipe = async (req, res) => {
  try {
    const { productId, swipeType } = req.body; // swipeType: 'left' or 'right'

    if (!productId || !swipeType || !['left', 'right'].includes(swipeType)) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and swipe type (left/right) are required',
      });
    }

    const product = await Product.findOne({ 
      _id: productId,
      isDeleted: false,
      isSuspended: false 
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Verify product is from user's university
    if (req.user && req.user.university) {
      if (product.university !== req.user.university) {
        return res.status(403).json({
          success: false,
          message: 'You can only interact with products from your university',
        });
      }
    }

    // Increment appropriate counter
    if (swipeType === 'left') {
      product.leftSwipeCount = (product.leftSwipeCount || 0) + 1;
    } else {
      product.rightSwipeCount = (product.rightSwipeCount || 0) + 1;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Swipe tracked successfully',
      data: {
        leftSwipeCount: product.leftSwipeCount,
        rightSwipeCount: product.rightSwipeCount,
      },
    });
  } catch (error) {
    logger.error('Error tracking swipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track swipe',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

