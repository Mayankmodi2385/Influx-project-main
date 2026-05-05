const asyncHandler = require('express-async-handler');
const { uploadImage } = require('../utils/upload');

// @desc    Upload image
// @route   POST /api/upload
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const imageUrl = await uploadImage(req.file);
    res.json({
      message: 'File uploaded successfully',
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

module.exports = {
  uploadFile,
};











