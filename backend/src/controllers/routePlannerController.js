const asyncHandler = require('express-async-handler');
const routeService = require('../services/routeService');

/**
 * @desc    Search for route and charging stations along route
 * @route   POST /api/routes/search
 * @access  Public (can be protected if needed)
 */
const searchRoute = asyncHandler(async (req, res) => {
  const { start, end, vehicleId, filters } = req.body;

  // Validate required fields
  if (!start || !end || !vehicleId) {
    return res.status(400).json({
      success: false,
      message: 'start, end, and vehicleId are required',
    });
  }

  // Validate coordinate format
  if (
    !Array.isArray(start) ||
    start.length !== 2 ||
    !Array.isArray(end) ||
    end.length !== 2
  ) {
    return res.status(400).json({
      success: false,
      message: 'start and end must be [lng, lat] arrays',
    });
  }

  try {
    // Extract userId from request if available (from auth middleware)
    const userId = req.user?.id || req.user?._id || null;
    
    const routePlan = await routeService.planRoute({
      start,
      end,
      vehicleId,
      filters: filters || {},
      userId,
    });

    res.json({
      success: true,
      data: routePlan,
    });
  } catch (error) {
    const statusCode = error.status || 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to plan route',
    });
  }
});

/**
 * @desc    Get mock route data for development/testing
 * @route   GET /api/routes/mock
 * @access  Public
 */
const getMockRoute = asyncHandler(async (req, res) => {
  const { start, end } = req.query;

  // Default coordinates (Pune to Mumbai)
  const defaultStart = [73.8567, 18.5204]; // Pune
  const defaultEnd = [72.8777, 19.0760]; // Mumbai

  const startCoords = start
    ? start.split(',').map((v) => parseFloat(v.trim()))
    : defaultStart;
  const endCoords = end
    ? end.split(',').map((v) => parseFloat(v.trim()))
    : defaultEnd;

  if (startCoords.length !== 2 || endCoords.length !== 2) {
    return res.status(400).json({
      success: false,
      message: 'Invalid coordinates. Use format: ?start=lng,lat&end=lng,lat',
    });
  }

  const mockData = routeService.getMockRouteData(startCoords, endCoords);

  res.json({
    success: true,
    data: {
      route: {
        start: startCoords,
        end: endCoords,
        coordinates: mockData.coordinates,
        distanceKm: mockData.distanceKm,
        durationSecs: mockData.durationSecs,
        durationMinutes: Math.round(mockData.durationSecs / 60),
      },
      useMock: true,
      message: 'This is mock route data. Configure ORS_API_KEY in .env to use real routing.',
    },
  });
});

module.exports = {
  searchRoute,
  getMockRoute,
};


