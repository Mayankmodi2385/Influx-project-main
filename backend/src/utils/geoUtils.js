const turf = require('@turf/turf');

/**
 * Create a buffer polygon around a line (route) in kilometers
 * @param {Array} lineCoords - Array of [lng, lat] coordinate pairs
 * @param {number} km - Buffer distance in kilometers
 * @returns {Object} GeoJSON Polygon
 */
function lineBuffer(lineCoords, km) {
  if (!lineCoords || lineCoords.length < 2) {
    throw new Error('Line coordinates must have at least 2 points');
  }

  // Convert to GeoJSON LineString format
  const lineString = turf.lineString(lineCoords);
  
  // Create buffer (turf.buffer expects meters, so convert km to meters)
  const bufferMeters = km * 1000;
  const buffered = turf.buffer(lineString, bufferMeters, { units: 'meters' });
  
  return buffered;
}

/**
 * Calculate distance between two points in kilometers
 * @param {Array} pt1 - [lng, lat] of first point
 * @param {Array} pt2 - [lng, lat] of second point
 * @returns {number} Distance in kilometers
 */
function pointDistanceKm(pt1, pt2) {
  const from = turf.point(pt1);
  const to = turf.point(pt2);
  const distance = turf.distance(from, to, { units: 'kilometers' });
  return distance;
}

/**
 * Simplify a line if it has too many points (for performance)
 * @param {Array} lineCoords - Array of [lng, lat] coordinate pairs
 * @param {number} tolerance - Simplification tolerance (default: 0.0001)
 * @returns {Array} Simplified array of [lng, lat] coordinate pairs
 */
function simplifyLineIfNeeded(lineCoords, tolerance = 0.0001) {
  if (!lineCoords || lineCoords.length < 2) {
    return lineCoords;
  }

  // Only simplify if line has more than 100 points
  if (lineCoords.length <= 100) {
    return lineCoords;
  }

  const lineString = turf.lineString(lineCoords);
  const simplified = turf.simplify(lineString, { tolerance, highQuality: true });
  
  return simplified.geometry.coordinates;
}

/**
 * Check if a point is within a polygon
 * @param {Array} point - [lng, lat] coordinates
 * @param {Object} polygon - GeoJSON Polygon
 * @returns {boolean}
 */
function pointInPolygon(point, polygon) {
  const pt = turf.point(point);
  return turf.booleanPointInPolygon(pt, polygon);
}

module.exports = {
  lineBuffer,
  pointDistanceKm,
  simplifyLineIfNeeded,
  pointInPolygon,
};






