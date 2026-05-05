const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/index');
const User = require('../src/models/User');
const Station = require('../src/models/Station');
const Vehicle = require('../src/models/Vehicle');

let mongoServer;
let userId;
let vehicleId;

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.ORS_API_KEY = ''; // No ORS key for tests, will use mock
  
  // Disconnect any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  process.env.JWT_SECRET = 'test_secret';
  process.env.JWT_ACCESS_EXPIRES = '15m';
  process.env.JWT_REFRESH_EXPIRES = '7d';
  process.env.CLIENT_URL = 'http://localhost:5173';
  await mongoose.connect(mongoUri);

  // Create test user
  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'Passw0rd!',
  });
  userId = user._id;

  // Create test vehicle
  const vehicle = await Vehicle.create({
    userId: user._id,
    name: 'Tata Nexon EV',
    range: 312,
    batteryCapacity: 30.2,
    chargeTime: 60,
    currentChargePercent: 80,
  });
  vehicleId = vehicle._id;

  // Create test stations along a route (Pune to Mumbai)
  const routeStations = [
    {
      name: 'Station 1',
      address: 'Pune Highway',
      location: { type: 'Point', coordinates: [73.9, 18.6] },
      connectors: [{ type: 'CCS', powerKw: 50, count: 2 }],
      availability: { totalSlots: 4, availableSlots: 2 },
      pricePerKwh: 8.5,
      provider: 'Tata Power',
      amenities: ['Restroom', 'Cafe'],
      ownerId: user._id,
    },
    {
      name: 'Station 2',
      address: 'Mumbai Highway',
      location: { type: 'Point', coordinates: [73.0, 18.9] },
      connectors: [{ type: 'CCS', powerKw: 150, count: 1 }],
      availability: { totalSlots: 2, availableSlots: 1 },
      pricePerKwh: 9.0,
      provider: 'ChargePoint',
      amenities: ['Parking', 'WiFi'],
      ownerId: user._id,
    },
  ];

  for (const stationData of routeStations) {
    await Station.create(stationData);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Route Planner Endpoints', () => {
  describe('POST /api/routes/search', () => {
    it('should return route plan with stations and estimates', async () => {
      const res = await request(app)
        .post('/api/routes/search')
        .send({
          start: [73.8567, 18.5204], // Pune
          end: [72.8777, 19.0760], // Mumbai
          vehicleId: vehicleId.toString(),
          filters: {},
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('route');
      expect(res.body.data).toHaveProperty('vehicle');
      expect(res.body.data).toHaveProperty('stops');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('allStations');
      expect(res.body.data).toHaveProperty('useMock');

      // Verify route structure
      expect(res.body.data.route).toHaveProperty('start');
      expect(res.body.data.route).toHaveProperty('end');
      expect(res.body.data.route).toHaveProperty('coordinates');
      expect(res.body.data.route).toHaveProperty('distanceKm');
      expect(res.body.data.route).toHaveProperty('durationSecs');

      // Verify summary structure
      expect(res.body.data.summary).toHaveProperty('totalStops');
      expect(res.body.data.summary).toHaveProperty('totalDistanceKm');
      expect(res.body.data.summary).toHaveProperty('driveTimeMinutes');
      expect(res.body.data.summary).toHaveProperty('totalChargeTimeMinutes');
      expect(res.body.data.summary).toHaveProperty('totalEstimatedTimeMinutes');
      expect(res.body.data.summary).toHaveProperty('totalCostRupees');
    });

    it('should require start, end, and vehicleId', async () => {
      const res = await request(app)
        .post('/api/routes/search')
        .send({
          start: [73.8567, 18.5204],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should validate coordinate format', async () => {
      const res = await request(app)
        .post('/api/routes/search')
        .send({
          start: [73.8567],
          end: [72.8777, 19.0760],
          vehicleId: vehicleId.toString(),
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should apply filters correctly', async () => {
      const res = await request(app)
        .post('/api/routes/search')
        .send({
          start: [73.8567, 18.5204],
          end: [72.8777, 19.0760],
          vehicleId: vehicleId.toString(),
          filters: {
            minPowerKw: 100,
            providers: ['ChargePoint'],
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // All stations should meet filter criteria
      if (res.body.data.allStations.length > 0) {
        res.body.data.allStations.forEach((station) => {
          if (station.powerRating) {
            expect(station.powerRating).toBeGreaterThanOrEqual(100);
          }
        });
      }
    });

    it('should handle numeric vehicleId string with fallback lookup', async () => {
      // Create a vehicle with legacyId = 2
      const legacyVehicle = await Vehicle.create({
        userId: userId,
        name: 'Legacy Vehicle',
        range: 300,
        batteryCapacity: 40,
        chargeTime: 60,
        currentChargePercent: 75,
        legacyId: 2,
      });

      const res = await request(app)
        .post('/api/routes/search')
        .send({
          start: [73.8567, 18.5204],
          end: [72.8777, 19.0760],
          vehicleId: '2', // Numeric string
          filters: {},
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vehicle.name).toBe('Legacy Vehicle');
    });

    it('should return 400 with helpful message for invalid vehicleId', async () => {
      const res = await request(app)
        .post('/api/routes/search')
        .send({
          start: [73.8567, 18.5204],
          end: [72.8777, 19.0760],
          vehicleId: '999', // Invalid numeric ID with no matching vehicle
          filters: {},
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Vehicle not found');
    });
  });

  describe('GET /api/routes/mock', () => {
    it('should return mock route data', async () => {
      const res = await request(app)
        .get('/api/routes/mock?start=73.8567,18.5204&end=72.8777,19.0760');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('route');
      expect(res.body.data).toHaveProperty('useMock');
      expect(res.body.data.useMock).toBe(true);
      expect(res.body.data.route).toHaveProperty('coordinates');
      expect(res.body.data.route).toHaveProperty('distanceKm');
    });

    it('should use default coordinates if not provided', async () => {
      const res = await request(app).get('/api/routes/mock');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.route).toHaveProperty('start');
      expect(res.body.data.route).toHaveProperty('end');
    });
  });
});


