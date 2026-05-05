const express = require('express');
const router = express.Router();
const { toggleFavorite, getFavorites } = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/favorites/{stationId}:
 *   post:
 *     summary: Toggle favorite station
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorite toggled
 */
router.post('/:stationId', protect, toggleFavorite);

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get user favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite stations
 */
router.get('/', protect, getFavorites);

module.exports = router;











