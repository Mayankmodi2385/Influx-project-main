require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Station = require('../src/models/Station');
const Review = require('../src/models/Review');
const Vehicle = require('../src/models/Vehicle');

// Indian cities with coordinates [lng, lat]
const cities = [
  { name: 'Pune', lng: 73.8567, lat: 18.5204 },
  { name: 'Mumbai', lng: 72.8777, lat: 19.0760 },
  { name: 'Delhi', lng: 77.1025, lat: 28.7041 },
  { name: 'Bengaluru', lng: 77.5946, lat: 12.9716 },
  { name: 'Kota', lng: 75.8649, lat: 25.2138 },
];

const connectorTypes = ['Type2', 'CCS', 'CHAdeMO', 'Tesla', 'Bharat AC', 'Bharat DC'];
const powerKwOptions = [3.3, 7.4, 11, 22, 50, 150];

const stationNames = [
  'EV Power Hub',
  'GreenCharge Station',
  'ElectroCharge Point',
  'QuickCharge Station',
  'EcoCharge Hub',
  'FastCharge Point',
  'PowerCharge Station',
  'SmartCharge Hub',
  'MegaCharge Point',
  'UltraCharge Station',
  'SuperCharge Hub',
  'TurboCharge Point',
  'MaxCharge Station',
  'ProCharge Hub',
  'EliteCharge Point',
  'PrimeCharge Station',
  'PremierCharge Hub',
  'LuxuryCharge Point',
  'PremiumCharge Station',
  'DeluxeCharge Hub',
];

const addresses = [
  'Main Street, Near Metro Station',
  'Highway Road, Opposite Mall',
  'Commercial Complex, Ground Floor',
  'Shopping Plaza, Parking Level 2',
  'Business Park, Building A',
  'Retail Center, Entrance Gate',
  'City Center, Parking Area',
  'Downtown Plaza, Basement',
  'Market Square, North Wing',
  'Business District, Tower 1',
];

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables. Please create a .env file with MONGO_URI.');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data
    await User.deleteMany({});
    await Station.deleteMany({});
    await Review.deleteMany({});
    await Vehicle.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = [];
    const password = 'Passw0rd!';

    // Owner users
    const owner1 = await User.create({
      name: 'Station Owner 1',
      email: 'owner1@influx.com',
      passwordHash: password,
      role: 'owner',
    });
    users.push(owner1);

    const owner2 = await User.create({
      name: 'Station Owner 2',
      email: 'owner2@influx.com',
      passwordHash: password,
      role: 'owner',
    });
    users.push(owner2);

    // Regular users
    for (let i = 1; i <= 7; i++) {
      const user = await User.create({
        name: `User ${i}`,
        email: `user${i}@influx.com`,
        passwordHash: password,
        role: 'user',
        preferredProviders: i <= 3 ? ['Tata Power', 'ChargePoint'] : [],
      });
      users.push(user);
    }

    console.log(`Created ${users.length} users`);

    // Create sample vehicles for users
    const regularUsers = users.filter((u) => u.role === 'user');
    const vehicles = [];
    const vehicleData = [
      { name: 'Tata Nexon EV', range: 312, batteryCapacity: 30.2, chargeTime: 60, currentChargePercent: 80 },
      { name: 'MG ZS EV', range: 419, batteryCapacity: 50.3, chargeTime: 50, currentChargePercent: 65 },
      { name: 'Tata Tiago EV', range: 250, batteryCapacity: 24, chargeTime: 90, currentChargePercent: 90 },
      { name: 'Hyundai Kona Electric', range: 452, batteryCapacity: 39.2, chargeTime: 57, currentChargePercent: 75 },
      { name: 'Mahindra XUV400', range: 375, batteryCapacity: 39.4, chargeTime: 50, currentChargePercent: 85 },
    ];

    for (let i = 0; i < Math.min(regularUsers.length, vehicleData.length); i++) {
      const vehicle = await Vehicle.create({
        userId: regularUsers[i]._id,
        ...vehicleData[i],
      });
      vehicles.push(vehicle);
    }

    console.log(`Created ${vehicles.length} vehicles`);

    // Create stations
    const stations = [];
    let stationIndex = 0;

    for (const city of cities) {
      const stationsPerCity = Math.ceil(20 / cities.length);
      for (let i = 0; i < stationsPerCity && stationIndex < 20; i++) {
        const stationName = stationNames[stationIndex];
        const address = `${addresses[stationIndex % addresses.length]}, ${city.name}`;

        // Random coordinates within city (small offset)
        const lng = city.lng + (Math.random() - 0.5) * 0.1;
        const lat = city.lat + (Math.random() - 0.5) * 0.1;

        // Random connectors (1-3 types)
        const numConnectors = Math.floor(Math.random() * 3) + 1;
        const connectors = [];
        const usedTypes = new Set();
        for (let j = 0; j < numConnectors; j++) {
          let type;
          do {
            type = connectorTypes[Math.floor(Math.random() * connectorTypes.length)];
          } while (usedTypes.has(type));
          usedTypes.add(type);

          connectors.push({
            type,
            powerKw: powerKwOptions[Math.floor(Math.random() * powerKwOptions.length)],
            count: Math.floor(Math.random() * 4) + 1,
          });
        }

        const totalSlots = Math.floor(Math.random() * 10) + 5;
        const availableSlots = Math.floor(Math.random() * totalSlots);

        const owner = stationIndex < 10 ? owner1 : owner2;

        // Providers for route planner
        const providers = ['Tata Power', 'ChargePoint', 'Ather Grid', 'Zeon Charging', 'EVRE', 'Unknown'];
        const provider = providers[Math.floor(Math.random() * providers.length)];

        // Amenities
        const allAmenities = ['Restroom', 'Cafe', 'Parking', 'WiFi', 'ATM', 'Restaurant', 'Shopping'];
        const numAmenities = Math.floor(Math.random() * 4) + 2;
        const amenities = [];
        for (let j = 0; j < numAmenities; j++) {
          const amenity = allAmenities[Math.floor(Math.random() * allAmenities.length)];
          if (!amenities.includes(amenity)) {
            amenities.push(amenity);
          }
        }

        const station = await Station.create({
          name: stationName,
          address,
          location: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          connectors,
          availability: {
            totalSlots,
            availableSlots,
            lastUpdated: new Date(),
          },
          pricePerKwh: Math.round((Math.random() * 8 + 4) * 10) / 10, // 4-12 INR/kWh
          provider,
          amenities,
          images: [
            'https://images.unsplash.com/photo-1593941707882-a5bac6861eed?w=800',
            'https://images.unsplash.com/photo-1593941707882-a5bac6861eed?w=800',
          ],
          ownerId: owner._id,
          tags: ['24/7', 'Fast Charging', 'Parking Available'],
        });

        stations.push(station);
        stationIndex++;
      }
    }

    console.log(`Created ${stations.length} stations`);

    // Create reviews
    const reviews = [];
    //const regularUsers = users.filter((u) => u.role === 'user');
    const reviewComments = [
      'Great charging speed!',
      'Good location, easy to find.',
      'Parking is a bit tight.',
      'Excellent service, highly recommended.',
      'Fast charging, no issues.',
      'Could use more connectors.',
      'Clean and well-maintained.',
      'Price is reasonable.',
      'Very convenient location.',
      'Had to wait for a slot.',
      'Perfect for quick charging.',
      'Staff was helpful.',
      'Modern equipment, works great.',
      'Good value for money.',
      'Easy payment process.',
    ];

    for (let i = 0; i < 50; i++) {
      const station = stations[Math.floor(Math.random() * stations.length)];
      const user = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      const rating = Math.floor(Math.random() * 5) + 1;
      const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];

      // Check if user already reviewed this station
      const existingReview = await Review.findOne({
        stationId: station._id,
        userId: user._id,
      });

      if (!existingReview) {
        const review = await Review.create({
          stationId: station._id,
          userId: user._id,
          rating,
          comment,
        });
        reviews.push(review);
      }
    }

    console.log(`Created ${reviews.length} reviews`);

    // Add favorites
    for (let i = 0; i < 5; i++) {
      const user = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      const station = stations[Math.floor(Math.random() * stations.length)];

      if (!user.favorites.includes(station._id)) {
        user.favorites.push(station._id);
        await user.save();
      }
    }

    console.log('Added favorites');

    console.log('\n=== Seed Data Summary ===');
    console.log(`Users: ${users.length}`);
    console.log(`  - Owners: 2 (owner1@influx.com, owner2@influx.com)`);
    console.log(`  - Regular: 7 (user1@influx.com - user7@influx.com)`);
    console.log(`Stations: ${stations.length}`);
    console.log(`Vehicles: ${vehicles.length}`);
    console.log(`Reviews: ${reviews.length}`);
    console.log('\nAll passwords: Passw0rd!');
    console.log('\nSeed completed successfully!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();








