import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadStream = (buffer, options, retries = 3) => {
  return new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          ...options,
          timeout: 60000, // 60s timeout
        },
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            if (remaining > 0) {
              console.log(`Retrying upload, attempts remaining: ${remaining}`);
              setTimeout(() => attempt(remaining - 1), 1000); // 1s delay
            } else {
              reject(error);
            }
          }
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    };
    attempt(retries);
  });
};

const deleteAsset = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Error deleting asset from Cloudinary:", error);
        throw error;
    }
};

export { cloudinary, uploadStream, deleteAsset };
