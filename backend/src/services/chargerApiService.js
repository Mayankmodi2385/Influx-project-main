const axios = require('axios');

/**
 * Charger Company API Integration Service
 * 
 * This service provides a flexible adapter layer for integrating with
 * different charger company APIs. It normalizes data from various
 * API formats into a consistent format for the InFlux application.
 */

class ChargerApiService {
  constructor() {
    // Configuration for different charger company APIs
    // Add new charger companies here
    this.providers = {
      // Example: ChargePoint API
      chargepoint: {
        baseUrl: process.env.CHARGEPOINT_API_URL || '',
        apiKey: process.env.CHARGEPOINT_API_KEY || '',
        format: 'chargepoint', // API format identifier
      },
      // Example: EVgo API
      evgo: {
        baseUrl: process.env.EVGO_API_URL || '',
        apiKey: process.env.EVGO_API_KEY || '',
        format: 'evgo',
      },
      // Example: Tesla Supercharger API
      tesla: {
        baseUrl: process.env.TESLA_API_URL || '',
        apiKey: process.env.TESLA_API_KEY || '',
        format: 'tesla',
      },
      // Add more charger companies as needed
    };
  }

  /**
   * Fetch stations from a charger company API
   * @param {string} provider - Provider name (chargepoint, evgo, tesla, etc.)
   * @param {Object} params - Query parameters (lat, lng, radius, etc.)
   * @returns {Promise<Array>} Normalized station data
   */
  async fetchStations(provider, params = {}) {
    const config = this.providers[provider.toLowerCase()];
    
    if (!config || !config.baseUrl) {
      throw new Error(`Provider ${provider} not configured`);
    }

    try {
      // Make API request to charger company
      const response = await axios.get(`${config.baseUrl}/stations`, {
        params: this.buildQueryParams(provider, params),
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      // Normalize the response based on provider format
      return this.normalizeStations(response.data, config.format);
    } catch (error) {
      console.error(`Error fetching stations from ${provider}:`, error.message);
      throw new Error(`Failed to fetch stations from ${provider}: ${error.message}`);
    }
  }

  /**
   * Build query parameters based on provider format
   */
  buildQueryParams(provider, params) {
    const format = this.providers[provider.toLowerCase()]?.format;
    
    // Different APIs use different parameter names
    switch (format) {
      case 'chargepoint':
        return {
          latitude: params.lat,
          longitude: params.lng,
          radius: params.radius || 50000,
          limit: params.limit || 50,
        };
      case 'evgo':
        return {
          lat: params.lat,
          lon: params.lng,
          distance: params.radius || 50000,
          max_results: params.limit || 50,
        };
      case 'tesla':
        return {
          lat: params.lat,
          lng: params.lng,
          radius_km: (params.radius || 50000) / 1000,
          limit: params.limit || 50,
        };
      default:
        // Generic format
        return {
          lat: params.lat,
          lng: params.lng,
          radius: params.radius || 50000,
          limit: params.limit || 50,
        };
    }
  }

  /**
   * Normalize station data from different API formats to InFlux format
   */
  normalizeStations(data, format) {
    let stations = [];

    // Extract stations array based on provider format
    switch (format) {
      case 'chargepoint':
        stations = data.stations || data.data || [];
        break;
      case 'evgo':
        stations = data.locations || data.stations || [];
        break;
      case 'tesla':
        stations = data.superchargers || data.stations || [];
        break;
      default:
        stations = Array.isArray(data) ? data : (data.stations || data.data || []);
    }

    // Normalize each station to InFlux format
    return stations.map(station => this.normalizeStation(station, format));
  }

  /**
   * Normalize a single station to InFlux format
   */
  normalizeStation(station, format) {
    const normalized = {
      externalId: station.id || station.station_id || station._id,
      name: station.name || station.station_name || station.title || 'Unknown Station',
      address: station.address || station.location?.address || station.full_address || '',
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(station.longitude || station.lng || station.location?.lng || station.coordinates?.lng || 0),
          parseFloat(station.latitude || station.lat || station.location?.lat || station.coordinates?.lat || 0),
        ],
      },
      connectors: this.normalizeConnectors(station, format),
      availability: this.normalizeAvailability(station, format),
      pricePerKwh: parseFloat(station.price || station.pricePerKwh || station.rate || 0),
      images: this.normalizeImages(station, format),
      tags: station.tags || station.amenities || [],
      provider: format,
      externalData: station, // Keep original data for reference
    };

    return normalized;
  }

  /**
   * Normalize connector information
   */
  normalizeConnectors(station, format) {
    let connectors = [];

    switch (format) {
      case 'chargepoint':
        connectors = station.connectors || station.ports || [];
        break;
      case 'evgo':
        connectors = station.connector_types || station.connectors || [];
        break;
      case 'tesla':
        connectors = station.connectors || [{ type: 'Tesla', powerKw: 150, count: station.stall_count || 1 }];
        break;
      default:
        connectors = station.connectors || [];
    }

    return connectors.map(conn => ({
      type: conn.type || conn.connector_type || conn.standard || 'Unknown',
      powerKw: parseFloat(conn.power || conn.powerKw || conn.kw || 0),
      count: parseInt(conn.count || conn.quantity || 1),
    }));
  }

  /**
   * Normalize availability information
   */
  normalizeAvailability(station, format) {
    return {
      totalSlots: parseInt(station.total_slots || station.total_ports || station.stall_count || 0),
      availableSlots: parseInt(station.available_slots || station.available_ports || station.available || 0),
      lastUpdated: station.last_updated || station.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Normalize images array
   */
  normalizeImages(station, format) {
    if (station.images && Array.isArray(station.images)) {
      return station.images;
    }
    if (station.image) {
      return [station.image];
    }
    if (station.photo) {
      return [station.photo];
    }
    return [];
  }

  /**
   * Fetch real-time availability for a station
   */
  async fetchStationAvailability(provider, stationId) {
    const config = this.providers[provider.toLowerCase()];
    
    if (!config || !config.baseUrl) {
      throw new Error(`Provider ${provider} not configured`);
    }

    try {
      const response = await axios.get(`${config.baseUrl}/stations/${stationId}/availability`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        timeout: 5000,
      });

      return this.normalizeAvailability(response.data, config.format);
    } catch (error) {
      console.error(`Error fetching availability for station ${stationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Register a new charger company provider
   */
  registerProvider(name, config) {
    this.providers[name.toLowerCase()] = {
      ...config,
      format: config.format || 'generic',
    };
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders() {
    return Object.keys(this.providers).filter(
      name => this.providers[name].baseUrl && this.providers[name].apiKey
    );
  }
}

// Export singleton instance
module.exports = new ChargerApiService();
