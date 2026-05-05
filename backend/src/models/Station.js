const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Station name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (v) {
            return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
          },
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    connectors: [
      {
        type: {
          type: String,
          required: true,
          enum: ['Type2', 'CCS', 'CHAdeMO', 'Tesla', 'Bharat AC', 'Bharat DC'],
        },
        powerKw: {
          type: Number,
          required: true,
          min: 0,
        },
        count: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    availability: {
      totalSlots: {
        type: Number,
        required: true,
        min: 1,
      },
      availableSlots: {
        type: Number,
        required: true,
        min: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    pricePerKwh: {
      type: Number,
      required: true,
      min: 0,
    },
    // Additional fields for route planner
    provider: {
      type: String,
      trim: true,
      default: 'Unknown',
    },
    powerRating: {
      type: Number,
      min: 0,
      // Maximum power rating in kW (from connectors)
    },
    availableChargers: {
      type: Number,
      min: 0,
      // Number of available chargers (derived from availability.availableSlots)
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    costPerKWh: {
      type: Number,
      min: 0,
      // Alias for pricePerKwh, kept for consistency with route planner
    },
    images: [
      {
        type: String,
      },
    ],
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to compute derived fields
stationSchema.pre('save', function (next) {
  // Calculate powerRating as max power from connectors
  if (this.connectors && this.connectors.length > 0) {
    this.powerRating = Math.max(...this.connectors.map((c) => c.powerKw || 0));
  }
  
  // Set availableChargers from availability
  if (this.availability && this.availability.availableSlots !== undefined) {
    this.availableChargers = this.availability.availableSlots;
  }
  
  // Set costPerKWh to match pricePerKwh for consistency
  if (this.pricePerKwh !== undefined) {
    this.costPerKWh = this.pricePerKwh;
  }
  
  next();
});

// Create 2dsphere index for geospatial queries
stationSchema.index({ location: '2dsphere' });
stationSchema.index({ name: 'text', address: 'text' });

module.exports = mongoose.model('Station', stationSchema);











