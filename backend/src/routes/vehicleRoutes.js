// backend/src/routes/vehicleRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');

router.route('/')
  .get(protect, getVehicles)
  .post(protect, addVehicle);

router.route('/:id')
  .put(protect, updateVehicle)
  .delete(protect, deleteVehicle);

module.exports = router;
