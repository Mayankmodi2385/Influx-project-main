const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Station = require('../models/Station');

// @desc    Create review
// @route   POST /api/stations/:id/reviews
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const stationId = req.params.id;

  const station = await Station.findById(stationId);
  if (!station) {
    return res.status(404).json({ message: 'Station not found' });
  }

  // Check if user already reviewed this station
  const existingReview = await Review.findOne({
    stationId,
    userId: req.user._id,
  });

  if (existingReview) {
    return res.status(400).json({ message: 'You have already reviewed this station' });
  }

  const review = await Review.create({
    stationId,
    userId: req.user._id,
    rating,
    comment,
  });

  await review.populate('userId', 'name');

  res.status(201).json({
    message: 'Review created successfully',
    review,
  });
});

// @desc    Get reviews for a station
// @route   GET /api/stations/:id/reviews
const getReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const stationId = req.params.id;

  const station = await Station.findById(stationId);
  if (!station) {
    return res.status(404).json({ message: 'Station not found' });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = await Review.find({ stationId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ stationId });

  const avgRating =
    total > 0
      ? (await Review.aggregate([
          { $match: { stationId: station._id } },
          { $group: { _id: null, avgRating: { $avg: '$rating' } } },
        ]))[0]?.avgRating || 0
      : 0;

  res.json({
    reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
    avgRating: Math.round(avgRating * 10) / 10,
  });
});

module.exports = {
  createReview,
  getReviews,
};











