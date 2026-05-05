# Environment Setup for Route Planner

## Required Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/influx?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL (comma-separated for multiple origins)
CLIENT_URL=http://localhost:5173,http://localhost:3000

# OpenRouteService API Key (for route planning)
# Get your free API key from: https://openrouteservice.org/dev/#/signup
# Leave empty to use mock route data
ORS_API_KEY=

# Route Provider (ORS or GOOGLE)
# Use 'ORS' for OpenRouteService (free tier available)
# Use 'GOOGLE' for Google Directions API (requires billing, better traffic data)
ROUTE_PROVIDER=ORS

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Getting ORS API Key

1. Visit: https://openrouteservice.org/dev/#/signup
2. Sign up for a free account
3. Copy your API key
4. Add to `.env`: `ORS_API_KEY=your_key_here`

## Mock Mode

If `ORS_API_KEY` is empty or not set, the system will automatically use mock route data. This is perfect for development and testing without an API key.

## Switching to Google Directions API

1. Set `ROUTE_PROVIDER=GOOGLE` in `.env`
2. Add `GOOGLE_MAPS_API_KEY=your_key_here`
3. Update `backend/src/services/routeService.js` to handle Google API format
4. Note: Google Directions API requires billing setup






