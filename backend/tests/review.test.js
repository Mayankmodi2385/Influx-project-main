const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/index');
const User = require('../src/models/User');
const Station = require('../src/models/Station');

let mongoServer;
let authToken;
let userId;
let stationId;

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

  // Create test station
  const station = await Station.create({
    name: 'Review Station',
    address: '123 Review St',
    location: {
      type: 'Point',
      coordinates: [73.8567, 18.5204],
    },
    connectors: [{ type: 'CCS', powerKw: 50, count: 1 }],
    availability: { totalSlots: 2, availableSlots: 1 },
    pricePerKwh: 8.0,
    ownerId: userId,
  });
  stationId = station._id;

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

describe('Review Endpoints', () => {
  describe('POST /api/stations/:id/reviews', () => {
    it('should create a review', async () => {
      const res = await request(app)
        .post(`/api/stations/${stationId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          comment: 'Great station!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('review');
      expect(res.body.review.rating).toBe(5);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post(`/api/stations/${stationId}/reviews`)
        .send({
          rating: 5,
          comment: 'Great station!',
        });

      expect(res.statusCode).toBe(401);
    });

    it('should not allow duplicate reviews', async () => {
      await request(app)
        .post(`/api/stations/${stationId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          comment: 'Another review',
        });

      const res = await request(app)
        .post(`/api/stations/${stationId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 3,
          comment: 'Duplicate review',
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/stations/:id/reviews', () => {
    it('should get reviews for a station', async () => {
      const res = await request(app).get(`/api/stations/${stationId}/reviews`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('reviews');
      expect(res.body).toHaveProperty('pagination');
    });
  });
});











