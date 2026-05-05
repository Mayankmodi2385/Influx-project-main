const express = require('express');
const router = express.Router();
const {
  fetchStations,
  getProviders,
  getStationAvailability,
} = require('../controllers/chargerApiController');

router.get('/providers', getProviders);
router.get('/stations', fetchStations);
router.get('/stations/:stationId/availability', getStationAvailability);

module.exports = router;




