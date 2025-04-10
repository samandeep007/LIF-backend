import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (data, originalname) => {
  try {
    // If data is a Buffer (from memoryStorage), upload directly
    if (Buffer.isBuffer(data)) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', public_id: `photos/${Date.now()}-${originalname}` },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(data);
      });
      return result.secure_url;
    }
    // If data is a file path (for local testing with diskStorage), upload from path
    const result = await cloudinary.uploader.upload(data, {
      resource_type: 'image',
      public_id: `photos/${Date.now()}-${originalname}`,
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new ApiError(500, 'Failed to upload photo to Cloudinary');
  }
};


export default uploadToCloudinary;