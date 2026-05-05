const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Station = require('../models/Station');

// @desc    Toggle favorite station
// @route   POST /api/favorites/:stationId
const toggleFavorite = asyncHandler(async (req, res) => {
  const { stationId } = req.params;

  const station = await Station.findById(stationId);
  if (!station) {
    return res.status(404).json({ message: 'Station not found' });
  }

  const user = await User.findById(req.user._id);
  const index = user.favorites.indexOf(stationId);

  if (index > -1) {
    user.favorites.splice(index, 1);
    await user.save();
    res.json({ message: 'Removed from favorites', isFavorite: false });
  } else {
    user.favorites.push(stationId);
    await user.save();
    res.json({ message: 'Added to favorites', isFavorite: true });
  }
});

// @desc    Get user favorites
// @route   GET /api/favorites
const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'favorites',
    populate: {
      path: 'ownerId',
      select: 'name',
    },
  });

  res.json({
    favorites: user.favorites,
  });
});

module.exports = {
  toggleFavorite,
  getFavorites,
};











