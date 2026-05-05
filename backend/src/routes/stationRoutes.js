const express = require('express');
const router = express.Router();
const {
  getStations,
  getStation,
  createStation,
  updateStation,
  deleteStation,
} = require('../controllers/stationController');
const { protect, authorize } = require('../middleware/auth');
const { validate, stationSchema } = require('../middleware/validator');
const { upload } = require('../utils/upload');

/**
 * @swagger
 * /api/stations:
 *   get:
 *     summary: Get all stations with filters
 *     tags: [Stations]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of stations
 */
router.get('/', getStations);

/**
 * @swagger
 * /api/stations/{id}:
 *   get:
 *     summary: Get station by ID
 *     tags: [Stations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Station details
 */
router.get('/:id', getStation);

/**
 * @swagger
 * /api/stations:
 *   post:
 *     summary: Create new station
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               location:
 *                 type: object
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Station created
 */
router.post(
  '/',
  protect,
  upload.array('images', 10),
  validate(stationSchema),
  createStation
);

/**
 * @swagger
 * /api/stations/{id}:
 *   put:
 *     summary: Update station
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Station updated
 */
router.put(
  '/:id',
  protect,
  upload.array('images', 10),
  validate(stationSchema),
  updateStation
);

/**
 * @swagger
 * /api/stations/{id}:
 *   delete:
 *     summary: Delete station
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Station deleted
 */
router.delete('/:id', protect, deleteStation);

module.exports = router;











