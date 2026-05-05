const asyncHandler = require('express-async-handler');
const chargerApiService = require('../services/chargerApiService');

/**
 * @swagger
 * /api/charger-api/stations:
 *   get:
 *     summary: Fetch stations from charger company APIs
 *     tags: [Charger API]
 *     parameters:
 *       - in: query
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: Charger company provider (chargepoint, evgo, tesla, etc.)
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude for location-based search
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude for location-based search
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: Search radius in meters
 *     responses:
 *       200:
 *         description: List of normalized stations from charger company API
 */
const fetchStations = asyncHandler(async (req, res) => {
  const { provider, lat, lng, radius } = req.query;

  if (!provider) {
    return res.status(400).json({ message: 'Provider parameter is required' });
  }

  try {
    const stations = await chargerApiService.fetchStations(provider, {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseInt(radius) || 50000,
    });

    res.json({
      success: true,
      count: stations.length,
      stations,
      provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/charger-api/providers:
 *   get:
 *     summary: Get list of available charger company providers
 *     tags: [Charger API]
 *     responses:
 *       200:
 *         description: List of configured providers
 */
const getProviders = asyncHandler(async (req, res) => {
  const providers = chargerApiService.getAvailableProviders();
  
  res.json({
    success: true,
    providers,
    count: providers.length,
  });
});

/**
 * @swagger
 * /api/charger-api/stations/:stationId/availability:
 *   get:
 *     summary: Get real-time availability for a station
 *     tags: [Charger API]
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Real-time availability data
 */
const getStationAvailability = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  const { provider } = req.query;

  if (!provider) {
    return res.status(400).json({ message: 'Provider parameter is required' });
  }

  try {
    const availability = await chargerApiService.fetchStationAvailability(provider, stationId);
    
    res.json({
      success: true,
      availability,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = {
  fetchStations,
  getProviders,
  getStationAvailability,
};




