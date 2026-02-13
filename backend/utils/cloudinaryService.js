import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

// Configure Cloudinary (only if credentials are provided)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the local file
 * @param {string} folder - Folder name in Cloudinary (optional)
 * @returns {Promise<Object>} - Cloudinary upload result with secure URL
 */
export const uploadToCloudinary = async (filePath, folder = 'onlyswap') => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }

    logger.info(`☁️ Uploading to Cloudinary: ${filePath}`);

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        {
          width: 1200,
          height: 1200,
          crop: 'limit',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
      // Optimize for web
      eager: [
        { width: 800, height: 800, crop: 'limit', quality: 'auto' },
        { width: 400, height: 400, crop: 'limit', quality: 'auto' },
      ],
    });

    logger.info(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error) {
    logger.error('❌ Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload image buffer directly to Cloudinary (without saving to disk first)
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Original filename
 * @param {string} folder - Folder name in Cloudinary (optional)
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadBufferToCloudinary = async (buffer, filename, folder = 'onlyswap') => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials not configured.');
    }

    logger.info(`☁️ Uploading buffer to Cloudinary: ${filename}`);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            {
              width: 1200,
              height: 1200,
              crop: 'limit',
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
        },
        (error, result) => {
          if (error) {
            logger.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            logger.info(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    logger.error('❌ Cloudinary buffer upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`🗑️ Deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error('❌ Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
export const extractPublicId = (url) => {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

