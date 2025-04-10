import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (data, originalname) => {
  try {
    console.log('Starting Cloudinary upload...');
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set',
    });

    // If data is a Buffer (from memoryStorage), upload directly
    if (Buffer.isBuffer(data)) {
      console.log('Uploading buffer to Cloudinary...');
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { resource_type: 'image', public_id: `photos/${Date.now()}-${originalname}` },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload_stream error:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload_stream success:', result);
              resolve(result);
            }
          }
        );
        stream.end(data);
      });
      return result.secure_url;
    }
    // If data is a file path (for local testing with diskStorage), upload from path
    console.log('Uploading file path to Cloudinary:', data);
    const result = await cloudinary.v2.uploader.upload(data, {
      resource_type: 'image',
      public_id: `photos/${Date.now()}-${originalname}`,
    });
    console.log('Cloudinary upload success:', result);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    console.error('Cloudinary error details:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
};

export default uploadToCloudinary;