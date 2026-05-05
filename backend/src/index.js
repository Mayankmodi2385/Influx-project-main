// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const os = require('os');

const connectDB = require('./utils/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const stationRoutes = require('./routes/stationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const chargerApiRoutes = require('./routes/chargerApiRoutes');
const routePlannerRoutes = require('./routes/routePlannerRoutes');

const app = express();

// Connect to database (skip in test mode, tests handle their own connection)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InFlux API',
      version: '1.0.0',
      description: 'EV Charging Station Locator API',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Build allowedOrigins from env + common local hosts
const allowedOrigins = new Set();

// Add origins from CLIENT_URL env (comma-separated)
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach(url => {
    const trimmed = url.trim();
    if (trimmed) allowedOrigins.add(trimmed);
  });
}

// Always allow common local dev origins
allowedOrigins.add('http://localhost:5173');
allowedOrigins.add('http://127.0.0.1:5173');
allowedOrigins.add('http://localhost:3000');
allowedOrigins.add('http://127.0.0.1:3000');

// Add detected local network addresses (same port used by Vite)
const networkInterfaces = os.networkInterfaces();
for (const ifaceName in networkInterfaces) {
  const list = networkInterfaces[ifaceName];
  for (const iface of list) {
    if (iface && iface.family === 'IPv4' && !iface.internal) {
      // allow the IP with default frontend ports
      allowedOrigins.add(`http://${iface.address}:5173`);
      allowedOrigins.add(`http://${iface.address}:3000`);
    }
  }
}

// CORS: allow localhost, 127.0.0.1, and local LAN ranges (192.168.x.x, 10.x.x.x)
// Still reject unknown external origins in dev/production.
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Direct match with allowedOrigins set
    if (allowedOrigins.has(origin)) return callback(null, true);

    // Accept local network IP origins like http://192.168.x.x:PORT or http://10.x.x.x:PORT
    const localNetRegex1 = /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/;
    const localNetRegex2 = /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/;
    if (localNetRegex1.test(origin) || localNetRegex2.test(origin)) {
      return callback(null, true);
    }

    // If not allowed, block
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Serve uploaded files (if you have uploads folder at project root)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/stations', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/charger-api', chargerApiRoutes);
app.use('/api/routes', routePlannerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'InFlux API is running' });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Helper to get first non-internal IPv4
function getLocalIPv4() {
  const ifaces = os.networkInterfaces();
  for (const name in ifaces) {
    for (const iface of ifaces[name]) {
      if (iface && iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

// Only start the server when not in test mode and when file is run directly
if (process.env.NODE_ENV !== 'test' && !module.parent) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIPv4() || '127.0.0.1';
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://${localIP}:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
  });

  // Export both app and server for test frameworks that may need to close the server
  module.exports = { app, server };
} else {
  // Export app for testing (supertest, etc.)
  module.exports = app;
}

const vehicleRoutes = require('./routes/vehicleRoutes');
app.use('/api/vehicles', vehicleRoutes);
