const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/index');
const User = require('../src/models/User');
const Station = require('../src/models/Station');

let mongoServer;
let authToken;
let userId;

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
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

  // Create test user and get token
  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'Passw0rd!',
  });
  userId = user._id;

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'Passw0rd!',
    });

  authToken = loginRes.body.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Station Endpoints', () => {
  describe('POST /api/stations', () => {
    it('should create a station with valid data', async () => {
      const res = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Station',
          address: '123 Test Street',
          location: {
            type: 'Point',
            coordinates: [73.8567, 18.5204],
          },
          connectors: [
            {
              type: 'CCS',
              powerKw: 50,
              count: 2,
            },
          ],
          availability: {
            totalSlots: 4,
            availableSlots: 2,
          },
          pricePerKwh: 8.5,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('station');
      expect(res.body.station.name).toBe('Test Station');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/stations')
        .send({
          name: 'Test Station',
          address: '123 Test Street',
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/stations', () => {
    it('should get all stations', async () => {
      // Create a test station first
      await Station.create({
        name: 'Public Station',
        address: '456 Public Ave',
        location: {
          type: 'Point',
          coordinates: [73.8567, 18.5204],
        },
        connectors: [{ type: 'Type2', powerKw: 22, count: 1 }],
        availability: { totalSlots: 2, availableSlots: 1 },
        pricePerKwh: 7.5,
        ownerId: userId,
      });

      const res = await request(app).get('/api/stations');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('stations');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should filter stations by location', async () => {
      const res = await request(app).get(
        '/api/stations?lat=18.5204&lng=73.8567&radius=10000'
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.stations).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/stations/:id', () => {
    it('should get a single station', async () => {
      const station = await Station.create({
        name: 'Single Station',
        address: '789 Single St',
        location: {
          type: 'Point',
          coordinates: [73.8567, 18.5204],
        },
        connectors: [{ type: 'CCS', powerKw: 50, count: 1 }],
        availability: { totalSlots: 2, availableSlots: 1 },
        pricePerKwh: 9.0,
        ownerId: userId,
      });

      const res = await request(app).get(`/api/stations/${station._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.station.name).toBe('Single Station');
    });

    it('should return 404 for non-existent station', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/stations/${fakeId}`);

      expect(res.statusCode).toBe(404);
    });
  });
});











