const asyncHandler = require('express-async-handler');
const Station = require('../models/Station');
const Review = require('../models/Review');

// @desc    Get all stations with filters
// @route   GET /api/stations
const getStations = asyncHandler(async (req, res) => {
  const {
    lat,
    lng,
    radius = 10000,
    q,
    connector,
    minPrice,
    maxPrice,
    page = 1,
    limit = 20,
  } = req.query;

  const query = {};

  // Geo search
  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseInt(radius),
      },
    };
  }

  // Text search
  if (q) {
    query.$text = { $search: q };
  }

  // Connector filter
  if (connector) {
    query['connectors.type'] = connector;
  }

  // Price range
  if (minPrice || maxPrice) {
    query.pricePerKwh = {};
    if (minPrice) query.pricePerKwh.$gte = parseFloat(minPrice);
    if (maxPrice) query.pricePerKwh.$lte = parseFloat(maxPrice);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  let stationsQuery = Station.find(query).skip(skip).limit(parseInt(limit));

  // If geo search, calculate distance
  if (lat && lng) {
    stationsQuery = stationsQuery.lean();
  }

  const stations = await stationsQuery
    .populate('ownerId', 'name email')
    .sort({ createdAt: -1 });

  // Calculate distance if geo search
  let stationsWithDistance = stations;
  if (lat && lng && stations.length > 0) {
    stationsWithDistance = stations.map((station) => {
      const [lng1, lat1] = station.location.coordinates;
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        lat1,
        lng1
      );
      return { ...station, distance: Math.round(distance) };
    });
    stationsWithDistance.sort((a, b) => a.distance - b.distance);
  }

  const total = await Station.countDocuments(query);

  res.json({
    stations: stationsWithDistance,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get single station
// @route   GET /api/stations/:id
const getStation = asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id)
    .populate('ownerId', 'name email');

  if (!station) {
    return res.status(404).json({ message: 'Station not found' });
  }

  // Get reviews separately for better control
  const reviews = await Review.find({ stationId: station._id })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  res.json({
    station: {
      ...station.toObject(),
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    },
  });
});

// @desc    Create station
// @route   POST /api/stations
const createStation = asyncHandler(async (req, res) => {
  const stationData = {
    ...req.body,
    ownerId: req.user._id,
  };

  if (req.files && req.files.length > 0) {
    stationData.images = req.files.map((file) => file.path);
  }

  const station = await Station.create(stationData);
  await station.populate('ownerId', 'name email');

  res.status(201).json({
    message: 'Station created successfully',
    station,
  });
});

// @desc    Update station
// @route   PUT /api/stations/:id
const updateStation = asyncHandler(async (req, res) => {
  let station = await Station.findById(req.params.id);

  if (!station) {
    return res.status(404).json({ message: 'Station not found' });
  }

  // Check if user is owner
  if (station.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this station' });
  }

  const updateData = { ...req.body };

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => file.path);
    updateData.images = [...(station.images || []), ...newImages];
  }

  station = await Station.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate('ownerId', 'name email');

  res.json({
    message: 'Station updated successfully',
    station,
  });
});

// @desc    Delete station
// @route   DELETE /api/stations/:id
const deleteStation = asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id);

  if (!station) {
    return res.status(404).json({ message: 'Station not found' });
  }

  // Check if user is owner
  if (station.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this station' });
  }

  await Station.findByIdAndDelete(req.params.id);
  await Review.deleteMany({ stationId: station._id });

  res.json({ message: 'Station deleted successfully' });
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

module.exports = {
  getStations,
  getStation,
  createStation,
  updateStation,
  deleteStation,
};

