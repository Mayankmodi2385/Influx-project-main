// backend/src/controllers/vehicleController.js
const asyncHandler = require('express-async-handler');
const Vehicle = require('../models/Vehicle');

// GET /api/vehicles
const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: vehicles });
});

// POST /api/vehicles
const addVehicle = asyncHandler(async (req, res) => {
  const { name, range, batteryCapacity, chargeTime, currentChargePercent, legacyId } = req.body;

  if (!name || range == null || batteryCapacity == null) {
    res.status(400);
    throw new Error('Missing required fields: name, range, batteryCapacity');
  }

  const newVehicle = await Vehicle.create({
    userId: req.user._id,
    name: name.trim(),
    range: Number(range),
    batteryCapacity: Number(batteryCapacity),
    chargeTime: chargeTime != null ? Number(chargeTime) : undefined,
    currentChargePercent: currentChargePercent != null ? Number(currentChargePercent) : undefined,
    legacyId: legacyId != null ? Number(legacyId) : undefined,
  });

  res.status(201).json({ success: true, data: newVehicle });
});

// PUT /api/vehicles/:id
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }
  if (vehicle.userId.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this vehicle');
  }

  const fields = ['name', 'range', 'batteryCapacity', 'chargeTime', 'currentChargePercent', 'legacyId'];
  fields.forEach(f => {
    if (req.body[f] != null) vehicle[f] = req.body[f];
  });

  const updated = await vehicle.save();
  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/vehicles/:id
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }
  if (vehicle.userId.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this vehicle');
  }
  await vehicle.deleteOne();
  res.status(200).json({ success: true, message: 'Vehicle deleted' });
});

module.exports = {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
};
