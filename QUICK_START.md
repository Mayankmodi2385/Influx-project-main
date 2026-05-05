# Quick Start Guide

## Commands to Run Locally

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env file with MongoDB Atlas connection string (see README.md)
npm run seed
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Run Tests

#### Backend Tests
```bash
cd backend
npm test
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api/docs
- **Swagger UI**: http://localhost:5000/docs

### 5. Test Accounts

All passwords: `Passw0rd!`

- **Admin**: admin@influx.com
- **Owner**: owner1@influx.com, owner2@influx.com
- **Users**: user1@influx.com through user7@influx.com

## Optional Features for Future Enhancement

1. **Real-time Updates**: WebSocket integration for live availability updates
2. **Payment Integration**: Stripe/PayPal for station reservations
3. **Advanced Search Filters**: Filter by amenities, ratings, connector speed
4. **Route Planning**: Integrate with mapping APIs for route optimization
5. **Mobile App**: React Native mobile application
6. **Email Notifications**: Send booking confirmations and updates
7. **Push Notifications**: Browser push notifications for favorite stations
8. **Analytics Dashboard**: Detailed analytics for station owners
9. **Multi-language Support**: i18n for multiple languages
10. **Social Features**: Share stations, follow other users











