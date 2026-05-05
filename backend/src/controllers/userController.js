const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('favorites', 'name address location images pricePerKwh')
    .select('-passwordHash');

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      favorites: user.favorites,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Update user profile
// @route   PUT /api/users/me
const updateMe = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const updateData = {};

  if (name) updateData.name = name;

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  }).select('-passwordHash');

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

module.exports = {
  getMe,
  updateMe,
};











