# InFlux — EV Charging Station Locator

A full-stack web application for finding and managing EV charging stations across India. Built with React (Vite), Node.js/Express, MongoDB, and Leaflet maps.

## 🚀 Features

- **Interactive Map**: Search and browse EV charging stations on an interactive map
- **Station Details**: View connector types, pricing, availability, photos, and reviews
- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Station Management**: Add new stations (owners/admin), manage your stations
- **Reviews & Ratings**: Leave reviews and ratings for stations
- **Favorites**: Save favorite stations for quick access
- **Admin Dashboard**: View statistics and manage content
- **Geo Search**: Find stations by location with radius-based search
- **Responsive Design**: Works seamlessly on mobile and desktop

## 📋 Tech Stack

### Frontend
- React 18 (Vite)
- Tailwind CSS
- React Router
- React Leaflet (Leaflet maps)
- Axios for API calls

### Backend
- Node.js + Express
- MongoDB Atlas (Cloud Database)
- JWT authentication
- Cloudinary (with local fallback) for image uploads
- Swagger/OpenAPI documentation

### DevOps
- GitHub Actions CI/CD
- ESLint + Prettier

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier available)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd INFLUX
   ```

2. **Set up Backend**
   ```bash
   cd backend
   npm install
   # Create .env file (see Environment Variables section)
   npm run seed  # Seed the database
   npm run dev   # Start backend server
   ```

3. **Set up Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev   # Start frontend dev server
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Docs: http://localhost:5000/api/docs

### Local Development Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** with MongoDB Atlas connection string
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://mathurjayesh703_db_user:Jayesh%40123@cluster0.tcvl3ho.mongodb.net/influx_dev?retryWrites=true&w=majority
   JWT_SECRET=dev_jwt_secret
   JWT_ACCESS_EXPIRES=15m
   JWT_REFRESH_EXPIRES=7d
   CLIENT_URL=http://localhost:5173
   COOKIE_SECRET=somecookiekey
   ```

   **Note:** The project uses MongoDB Atlas (cloud database). No local MongoDB installation required.

4. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   npm run dev
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** (optional)
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb+srv://mathurjayesh703_db_user:Jayesh%40123@cluster0.tcvl3ho.mongodb.net/influx_dev?retryWrites=true&w=majority
JWT_SECRET=dev_jwt_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLOUDINARY_URL=  # Optional: cloudinary://api_key:api_secret@cloud_name
CLIENT_URL=http://localhost:5173
COOKIE_SECRET=somecookiekey
```

**Note:** This project uses MongoDB Atlas instead of a local Docker MongoDB instance. Ensure your IP is whitelisted in MongoDB Atlas Network Access settings.

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📚 API Documentation

### Swagger UI
Once the backend is running, visit:
- http://localhost:5000/api/docs
- http://localhost:5000/docs

### Postman Collection
Import the Postman collection from `postman/InFlux_API.postman_collection.json`

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

#### Stations
- `GET /api/stations` - Get all stations (with filters)
- `GET /api/stations/:id` - Get station details
- `POST /api/stations` - Create station (protected)
- `PUT /api/stations/:id` - Update station (protected, owner/admin)
- `DELETE /api/stations/:id` - Delete station (protected, owner/admin)

#### Reviews
- `GET /api/stations/:id/reviews` - Get reviews for station
- `POST /api/stations/:id/reviews` - Create review (protected)

#### Favorites
- `GET /api/favorites` - Get user favorites (protected)
- `POST /api/favorites/:stationId` - Toggle favorite (protected)

#### Upload
- `POST /api/upload` - Upload image (protected)

#### Admin
- `GET /api/admin/stats` - Get admin statistics (protected, admin only)

## 🗄️ Database Schema

### User
- `_id`: ObjectId
- `name`: String
- `email`: String (unique)
- `passwordHash`: String
- `role`: Enum ['user', 'admin', 'owner']
- `favorites`: [ObjectId] (station IDs)
- `createdAt`: Date

### Station
- `_id`: ObjectId
- `name`: String
- `address`: String
- `location`: GeoJSON Point (2dsphere index)
- `connectors`: Array of {type, powerKw, count}
- `availability`: {totalSlots, availableSlots, lastUpdated}
- `pricePerKwh`: Number
- `images`: [String]
- `ownerId`: ObjectId (ref: User)
- `tags`: [String]
- `createdAt`: Date

### Review
- `_id`: ObjectId
- `stationId`: ObjectId (ref: Station)
- `userId`: ObjectId (ref: User)
- `rating`: Number (1-5)
- `comment`: String
- `createdAt`: Date

## 🧑‍💻 Seed Data

The seed script creates:
- 10 users (1 admin, 2 owners, 7 regular users)
- 20 stations across 5 Indian cities (Pune, Mumbai, Delhi, Bengaluru, Kota)
- 50 reviews distributed across stations
- Sample favorites

**Test Accounts:**
- Admin: `admin@influx.com` / `Passw0rd!`
- Owner: `owner1@influx.com` / `Passw0rd!`
- User: `user1@influx.com` / `Passw0rd!`

## 🚀 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variable: `VITE_API_URL`
4. Deploy

### Backend (Render/Heroku)
1. Set environment variables (especially MONGO_URI pointing to MongoDB Atlas)
2. Deploy using Node.js buildpack
3. Ensure MongoDB Atlas network access allows the deployment platform's IP

### Sample Deploy Commands
```bash
# Render
render deploy

# Heroku
heroku create influx-api
git push heroku main
```

## 📁 Project Structure

```
INFLUX/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   ├── scripts/
│   │   └── seed.js
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

ISC

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Leaflet for map functionality
- Cloudinary for image hosting











