const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if URL is provided
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
}

// Local storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Upload to Cloudinary or return local URL
const uploadImage = async (file) => {
  if (process.env.CLOUDINARY_URL && file.path) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'influx-stations',
      });
      // Delete local file after Cloudinary upload
      fs.unlinkSync(file.path);
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Fallback to local
    }
  }

  // Local fallback
  if (file.path) {
    const relativePath = file.path.replace(path.join(__dirname, '../../'), '');
    return `${process.env.CLIENT_URL || 'http://localhost:5000'}/${relativePath.replace(/\\/g, '/')}`;
  }

  throw new Error('File upload failed');
};

module.exports = {
  upload,
  uploadImage,
};











