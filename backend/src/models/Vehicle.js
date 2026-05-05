const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
    },
    range: {
      type: Number,
      required: [true, 'Vehicle range (km) is required'],
      min: 0,
    },
    batteryCapacity: {
      type: Number,
      required: [true, 'Battery capacity (kWh) is required'],
      min: 0,
    },
    chargeTime: {
      type: Number,
      required: [true, 'Charge time (minutes for 0→100%) is required'],
      min: 0,
      default: 480, // 8 hours default
    },
    currentChargePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },
    legacyId: {
      type: Number,
      sparse: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user vehicle queries
vehicleSchema.index({ userId: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);


