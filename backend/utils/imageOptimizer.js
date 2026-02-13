import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Optimize and resize an image
 * @param {string} inputPath - Path to the input image
 * @param {string} outputPath - Path to save the optimized image
 * @param {Object} options - Optimization options
 * @returns {Promise<string>} - Path to the optimized image
 */
export const optimizeImage = async (inputPath, outputPath, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 85,
    format = 'jpeg',
  } = options;

  try {
    await sharp(inputPath)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toFile(outputPath);

    logger.info(`✅ Image optimized: ${path.basename(outputPath)}`);
    return outputPath;
  } catch (error) {
    logger.error(`❌ Image optimization failed for ${inputPath}:`, error);
    throw error;
  }
};

/**
 * Process uploaded image file
 * @param {Object} file - Multer file object
 * @param {string} destinationDir - Directory to save optimized image
 * @returns {Promise<string>} - Filename of the optimized image
 */
export const processUploadedImage = async (file, destinationDir) => {
  const originalPath = file.path;
  const optimizedFilename = `optimized-${file.filename}`;
  const optimizedPath = path.join(destinationDir, optimizedFilename);

  try {
    // Optimize the image
    await optimizeImage(originalPath, optimizedPath, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 85,
    });

    // Delete original file to save space
    const fs = await import('fs/promises');
    try {
      await fs.unlink(originalPath);
    } catch (unlinkError) {
      logger.warn(`Could not delete original file ${originalPath}:`, unlinkError);
    }

    return optimizedFilename;
  } catch (error) {
    logger.error('❌ Failed to process uploaded image:', error);
    // Return original filename if optimization fails
    return file.filename;
  }
};

/**
 * Get image metadata
 * @param {string} imagePath - Path to the image
 * @returns {Promise<Object>} - Image metadata
 */
export const getImageMetadata = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    };
  } catch (error) {
    logger.error('❌ Failed to get image metadata:', error);
    return null;
  }
};

