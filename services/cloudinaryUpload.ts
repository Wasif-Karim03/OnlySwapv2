/**
 * Client-side Cloudinary upload utility
 * Uploads images directly from React Native to Cloudinary
 */

interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Upload image directly to Cloudinary from React Native
 * @param imageUri - Local file URI from ImagePicker
 * @param cloudName - Cloudinary cloud name
 * @param uploadPreset - Cloudinary upload preset (unsigned)
 * @returns Cloudinary upload result with secure URL
 */
export const uploadImageToCloudinary = async (
  imageUri: string,
  cloudName: string,
  uploadPreset: string
): Promise<CloudinaryUploadResult> => {
  try {
    console.log('☁️ Starting Cloudinary upload from client...');
    console.log('☁️ Image URI:', imageUri.substring(0, 50) + '...');
    
    // Create FormData for Cloudinary
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'onlyswap/products');
    
    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    console.log('☁️ Uploading to:', uploadUrl);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - let fetch set it with boundary
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cloudinary upload failed:', errorText);
      throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Cloudinary upload successful:', result.secure_url);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param imageUris - Array of local file URIs
 * @param cloudName - Cloudinary cloud name
 * @param uploadPreset - Cloudinary upload preset
 * @returns Array of Cloudinary upload results
 */
export const uploadMultipleImagesToCloudinary = async (
  imageUris: string[],
  cloudName: string,
  uploadPreset: string
): Promise<CloudinaryUploadResult[]> => {
  console.log(`☁️ Uploading ${imageUris.length} images to Cloudinary...`);
  
  const uploadPromises = imageUris.map((uri, index) => {
    console.log(`☁️ Uploading image ${index + 1}/${imageUris.length}...`);
    return uploadImageToCloudinary(uri, cloudName, uploadPreset);
  });

  const results = await Promise.all(uploadPromises);
  console.log(`✅ All ${results.length} images uploaded to Cloudinary`);
  
  return results;
};

