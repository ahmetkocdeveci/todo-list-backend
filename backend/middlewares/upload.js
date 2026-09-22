const cloudinary = require('../config/cloudinary');
const { unlink } = require('fs/promises');

const removeTempFile = async (filePath) => {
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Temporary upload cleanup failed:', error.message);
    }
  }
};

const cleanupUploadTempFiles = (req, res, next) => {
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;

    const files = Object.values(req.files || {}).flatMap((file) => (
      Array.isArray(file) ? file : [file]
    ));
    void Promise.all(files.map((file) => removeTempFile(file?.tempFilePath)));
  };

  res.once('finish', cleanup);
  res.once('close', cleanup);
  next();
};

const uploadToCloudinary = async (file, folder = 'todo-images') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const error = new Error('Image upload is not configured. Add Cloudinary credentials to the server environment.');
    error.statusCode = 503;
    throw error;
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    const error = new Error('Only JPEG, PNG, WebP and GIF images are allowed.');
    error.statusCode = 400;
    throw error;
  }

  const result = await cloudinary.uploader.upload(file.tempFilePath, {
    folder,
    transformation: [
      { width: 800, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

const safeDeleteFromCloudinary = async (publicId) => {
  try {
    await deleteFromCloudinary(publicId);
  } catch (error) {
    console.error('Cloudinary cleanup failed:', error.message);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  safeDeleteFromCloudinary,
  cleanupUploadTempFiles,
};
