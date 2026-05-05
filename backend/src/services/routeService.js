const axios = require('axios');
const mongoose = require('mongoose');
const Station = require('../models/Station');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { lineBuffer, pointDistanceKm, simplifyLineIfNeeded, pointInPolygon } = require('../utils/geoUtils');

/**
 * Get route from OpenRouteService (ORS) API
 * @param {Array} start - [lng, lat] coordinates of start point
 * @param {Array} end - [lng, lat] coordinates of end point
 * @returns {Object} { polyline, distanceKm, durationSecs, coordinates }
 */
async function getRouteFromORS(start, end) {
  const orsApiKey = process.env.ORS_API_KEY;
  const routeProvider = process.env.ROUTE_PROVIDER || 'ORS';

  // If no ORS key or provider is not ORS, return null to trigger mock
  if (!orsApiKey || routeProvider !== 'ORS') {
    return null;
  }

  try {
    const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
    const response = await axios.post(
      url,
      {
        coordinates: [start, end],
        format: 'geojson',
      },
      {
        headers: {
          Authorization: orsApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const geometry = response.data.features[0].geometry;
    const properties = response.data.features[0].properties;

    // Extract coordinates from GeoJSON LineString
    const coordinates = geometry.coordinates; // [[lng, lat], ...]

    // Distance in meters, convert to km
    const distanceKm = (properties.segments[0].distance || 0) / 1000;

    // Duration in seconds
    const durationSecs = properties.segments[0].duration || 0;

    return {
      polyline: coordinates,
      distanceKm: Math.round(distanceKm * 100) / 100, // Round to 2 decimals
      durationSecs: Math.round(durationSecs),
      coordinates,
    };
  } catch (error) {
    console.error('ORS API error:', error.message);
    // Return null to trigger fallback to mock
    return null;
  }
}

/**
 * Estimate number of charging stops needed based on vehicle range and current charge
 * @param {number} distanceKm - Total distance in kilometers
 * @param {Object} vehicle - Vehicle object with range, currentChargePercent
 * @returns {Array} Array of stop objects with { stopNumber, distanceFromStart, requiredChargePercent }
 */
function estimateStops(distanceKm, vehicle) {
  const stops = [];
  
  // Effective range with current charge
  const effectiveRangeKm = vehicle.range * (vehicle.currentChargePercent / 100);
  
  let remainingDistance = distanceKm;
  let distanceFromStart = 0;
  let stopNumber = 1;

  // If we can make it with current charge, no stops needed
  if (remainingDistance <= effectiveRangeKm) {
    return stops;
  }

  // First leg: use current charge
  remainingDistance -= effectiveRangeKm;
  distanceFromStart += effectiveRangeKm;

  // Subsequent stops: charge to 80% for efficiency (or use full range if needed)
  const chargeTargetPercent = 80; // Charge to 80% for faster charging
  const rangePerStop = vehicle.range * (chargeTargetPercent / 100);

  while (remainingDistance > 0) {
    const stopDistance = Math.min(remainingDistance, rangePerStop);
    distanceFromStart += stopDistance;
    remainingDistance -= stopDistance;

    stops.push({
      stopNumber,
      distanceFromStart: Math.round(distanceFromStart * 100) / 100,
      requiredChargePercent: chargeTargetPercent,
      // Estimate km needed to reach next stop or destination
      kmNeeded: Math.min(remainingDistance, rangePerStop),
    });

    stopNumber++;
  }

  return stops;
}

/**
 * Find charging stations within buffer distance of route
 * @param {Array} lineCoordinates - Array of [lng, lat] coordinate pairs
 * @param {number} bufferKm - Buffer distance in kilometers (default: 5)
 * @param {Object} filters - Filter options { minPowerKw, amenities, providers }
 * @returns {Array} Array of station objects with distance from route
 */
async function findStationsAlongRoute(lineCoordinates, bufferKm = 5, filters = {}) {
  if (!lineCoordinates || lineCoordinates.length < 2) {
    return [];
  }

  // Simplify line if needed for performance
  const simplifiedCoords = simplifyLineIfNeeded(lineCoordinates);
  
  // Create buffer polygon
  const bufferPolygon = lineBuffer(simplifiedCoords, bufferKm);

  // Build MongoDB query
  // MongoDB expects GeoJSON format: { type: 'Polygon', coordinates: [...] }
  const query = {
    location: {
      $geoWithin: {
        $geometry: {
          type: bufferPolygon.geometry.type,
          coordinates: bufferPolygon.geometry.coordinates,
        },
      },
    },
  };

  // Apply filters
  if (filters.minPowerKw) {
    query.powerRating = { $gte: filters.minPowerKw };
  }

  if (filters.providers && filters.providers.length > 0) {
    query.provider = { $in: filters.providers };
  }

  // Find stations within buffer
  let stations = await Station.find(query).lean();

  // Filter by amenities if specified (client-side filter as MongoDB doesn't support array contains all)
  if (filters.amenities && filters.amenities.length > 0) {
    stations = stations.filter((station) => {
      if (!station.amenities || station.amenities.length === 0) return false;
      return filters.amenities.every((amenity) => station.amenities.includes(amenity));
    });
  }

  // Calculate distance from route for each station
  const stationsWithDistance = stations.map((station) => {
    const stationPoint = station.location.coordinates; // [lng, lat]
    
    // Find closest point on route to station
    let minDistance = Infinity;
    for (let i = 0; i < simplifiedCoords.length - 1; i++) {
      const segmentStart = simplifiedCoords[i];
      const segmentEnd = simplifiedCoords[i + 1];
      
      // Calculate distance from point to line segment
      const distance = pointDistanceKm(stationPoint, segmentStart);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return {
      ...station,
      distanceFromRoute: Math.round(minDistance * 100) / 100, // Round to 2 decimals
    };
  });

  // Sort by distance from route (ascending)
  stationsWithDistance.sort((a, b) => a.distanceFromRoute - b.distanceFromRoute);

  return stationsWithDistance;
}

/**
 * Estimate charge time and cost for a station stop
 * @param {Object} station - Station object
 * @param {Object} vehicle - Vehicle object
 * @param {number} requiredKm - Kilometers needed to reach next stop or destination
 * @returns {Object} { chargeTimeMinutes, costRupees, kwhNeeded }
 */
function estimateChargeTimeAndCost(station, vehicle, requiredKm) {
  // Calculate kWh needed: (km / range) * batteryCapacity
  const kwhNeeded = (requiredKm / vehicle.range) * vehicle.batteryCapacity;

  // Use station's powerRating (max kW from connectors)
  // If not available, estimate from connectors or use default
  let chargerPowerKw = station.powerRating;
  if (!chargerPowerKw && station.connectors && station.connectors.length > 0) {
    chargerPowerKw = Math.max(...station.connectors.map((c) => c.powerKw || 0));
  }
  if (!chargerPowerKw) {
    chargerPowerKw = 50; // Default 50kW charger
  }

  // Charge time in minutes: (kWh / kW) * 60
  // Add 10% overhead for charging efficiency
  const chargeTimeMinutes = Math.ceil((kwhNeeded / chargerPowerKw) * 60 * 1.1);

  // Cost in rupees: kWh * costPerKWh
  const costPerKWh = station.costPerKWh || station.pricePerKwh || 0;
  const costRupees = Math.ceil(kwhNeeded * costPerKWh);

  return {
    chargeTimeMinutes,
    costRupees,
    kwhNeeded: Math.round(kwhNeeded * 100) / 100,
  };
}

/**
 * Rank stations by preference (distance, availability, provider preference, power)
 * @param {Array} stations - Array of station objects
 * @param {Array} preferredProviders - Array of preferred provider names
 * @returns {Array} Ranked stations
 */
function rankStations(stations, preferredProviders = []) {
  return stations.map((station) => {
    let score = 0;

    // Distance score (closer is better, max 100 points)
    const maxDistance = 5; // 5km buffer
    const distanceScore = Math.max(0, 100 - (station.distanceFromRoute / maxDistance) * 100);
    score += distanceScore * 0.4; // 40% weight

    // Availability score (more available chargers is better, max 50 points)
    const availableChargers = station.availableChargers || 0;
    const availabilityScore = Math.min(50, availableChargers * 10);
    score += availabilityScore * 0.2; // 20% weight

    // Provider preference score (max 20 points)
    if (preferredProviders.length > 0 && station.provider) {
      if (preferredProviders.includes(station.provider)) {
        score += 20; // 20% weight
      }
    }

    // Power rating score (higher is better, max 20 points)
    const powerRating = station.powerRating || 0;
    const powerScore = Math.min(20, (powerRating / 150) * 20); // 150kW = max score
    score += powerScore * 0.2; // 20% weight

    return {
      ...station,
      rankingScore: Math.round(score * 100) / 100,
    };
  }).sort((a, b) => b.rankingScore - a.rankingScore);
}

/**
 * Get vehicle by ID with fallback lookup strategies
 * Tolerates non-ObjectId vehicleId values and provides robust fallback
 * @param {string|number} vehicleId - Vehicle ID (ObjectId, numeric string, or number)
 * @param {string} userId - Optional user ID for fallback lookup
 * @returns {Object} Vehicle document
 * @throws {Error} If vehicle not found
 */
async function getVehicleByIdOrFallback(vehicleId, userId = null) {
  // Strategy 1: Try ObjectId lookup if valid
  if (mongoose.isValidObjectId(vehicleId)) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (vehicle) {
      console.log(`[Vehicle Lookup] Found vehicle by ObjectId: ${vehicleId}`);
      return vehicle;
    }
  }

  // Strategy 2: If vehicleId parses to a number, try legacyId lookup
  const numericId = Number(vehicleId);
  if (!isNaN(numericId) && isFinite(numericId)) {
    const vehicle = await Vehicle.findOne({ legacyId: numericId });
    if (vehicle) {
      console.log(`[Vehicle Lookup] Found vehicle by legacyId: ${numericId}`);
      return vehicle;
    }
  }

  // Strategy 3: If userId provided, return first vehicle for user
  if (userId && mongoose.isValidObjectId(userId)) {
    const vehicle = await Vehicle.findOne({ userId }).sort({ _id: 1 });
    if (vehicle) {
      console.log(`[Vehicle Lookup] Found vehicle by userId fallback: ${userId}`);
      return vehicle;
    }
  }

  // None found - throw error
  console.log(`[Vehicle Lookup] Failed to find vehicle with vehicleId: ${vehicleId}, userId: ${userId}`);
  const error = new Error('Vehicle not found or invalid vehicleId');
  error.status = 400;
  throw error;
}

/**
 * Main route planning function
 * @param {Object} params - { start, end, vehicleId, filters, userId }
 * @returns {Object} Route plan with stations, estimates, etc.
 */
async function planRoute({ start, end, vehicleId, filters = {}, userId = null }) {
  // Validate inputs
  if (!start || !end || !vehicleId) {
    throw new Error('start, end, and vehicleId are required');
  }

  if (!Array.isArray(start) || start.length !== 2 || !Array.isArray(end) || end.length !== 2) {
    throw new Error('start and end must be [lng, lat] arrays');
  }

  // Get vehicle using robust lookup with fallback
  const vehicle = await getVehicleByIdOrFallback(vehicleId, userId);

  // Get route from ORS (or null if no key)
  let routeData = await getRouteFromORS(start, end);
  let useMock = false;

  // If ORS failed or no key, use mock data
  if (!routeData) {
    useMock = true;
    routeData = getMockRouteData(start, end);
  }

  const { coordinates, distanceKm, durationSecs } = routeData;

  // Estimate stops
  const stops = estimateStops(distanceKm, vehicle);

  // Find stations along route
  const allStations = await findStationsAlongRoute(coordinates, 5, filters);

  // Get user preferences if available
  let preferredProviders = [];
  if (vehicle.userId) {
    const user = await User.findById(vehicle.userId).select('preferredProviders');
    if (user && user.preferredProviders) {
      preferredProviders = user.preferredProviders;
    }
  }

  // Rank stations
  const rankedStations = rankStations(allStations, preferredProviders);

  // For each stop, recommend best station and calculate charge time/cost
  const stopRecommendations = stops.map((stop) => {
    // Find best station near this stop location
    // For simplicity, use top-ranked station (could be improved with distance-based matching)
    const recommendedStation = rankedStations[0] || null;

    if (!recommendedStation) {
      return {
        ...stop,
        station: null,
        chargeTimeMinutes: 0,
        costRupees: 0,
      };
    }

    const { chargeTimeMinutes, costRupees, kwhNeeded } = estimateChargeTimeAndCost(
      recommendedStation,
      vehicle,
      stop.kmNeeded
    );

    return {
      ...stop,
      station: {
        id: recommendedStation._id,
        name: recommendedStation.name,
        address: recommendedStation.address,
        location: recommendedStation.location,
        provider: recommendedStation.provider,
        powerRating: recommendedStation.powerRating,
        availableChargers: recommendedStation.availableChargers,
        amenities: recommendedStation.amenities || [],
        costPerKWh: recommendedStation.costPerKWh || recommendedStation.pricePerKwh,
        distanceFromRoute: recommendedStation.distanceFromRoute,
      },
      chargeTimeMinutes,
      costRupees,
      kwhNeeded,
    };
  });

  // Calculate totals
  const totalChargeTimeMinutes = stopRecommendations.reduce(
    (sum, stop) => sum + stop.chargeTimeMinutes,
    0
  );
  const totalCostRupees = stopRecommendations.reduce((sum, stop) => sum + stop.costRupees, 0);
  const totalEstimatedTimeMinutes = durationSecs / 60 + totalChargeTimeMinutes;

  return {
    route: {
      start,
      end,
      coordinates,
      distanceKm,
      durationSecs,
      durationMinutes: Math.round(durationSecs / 60),
    },
    vehicle: {
      id: vehicle._id,
      name: vehicle.name,
      range: vehicle.range,
      batteryCapacity: vehicle.batteryCapacity,
      currentChargePercent: vehicle.currentChargePercent,
    },
    stops: stopRecommendations,
    summary: {
      totalStops: stops.length,
      totalDistanceKm: distanceKm,
      driveTimeMinutes: Math.round(durationSecs / 60),
      totalChargeTimeMinutes,
      totalEstimatedTimeMinutes: Math.round(totalEstimatedTimeMinutes),
      totalCostRupees,
    },
    allStations: rankedStations.slice(0, 20), // Top 20 stations
    useMock,
  };
}

/**
 * Generate mock route data for development/testing
 * @param {Array} start - [lng, lat]
 * @param {Array} end - [lng, lat]
 * @returns {Object} Mock route data
 */
function getMockRouteData(start, end) {
  // Simple straight-line approximation with a few waypoints
  const coordinates = [
    start,
    [
      (start[0] + end[0]) * 0.33,
      (start[1] + end[1]) * 0.33,
    ],
    [
      (start[0] + end[0]) * 0.66,
      (start[1] + end[1]) * 0.66,
    ],
    end,
  ];

  // Estimate distance using Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = ((end[1] - start[1]) * Math.PI) / 180;
  const dLon = ((end[0] - start[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start[1] * Math.PI) / 180) *
      Math.cos((end[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // Estimate duration (assume average 60 km/h)
  const durationSecs = (distanceKm / 60) * 3600;

  return {
    polyline: coordinates,
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationSecs: Math.round(durationSecs),
    coordinates,
  };
}

module.exports = {
  planRoute,
  getVehicleByIdOrFallback,
  getRouteFromORS,
  estimateStops,
  findStationsAlongRoute,
  estimateChargeTimeAndCost,
  getMockRouteData,
};

