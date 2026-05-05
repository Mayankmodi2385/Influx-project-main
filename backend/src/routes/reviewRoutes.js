const express = require('express');
const router = express.Router();
const { createReview, getReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { validate, reviewSchema } = require('../middleware/validator');

/**
 * @swagger
 * /api/stations/{id}/reviews:
 *   post:
 *     summary: Create review for station
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 */
router.post('/:id/reviews', protect, validate(reviewSchema), createReview);

/**
 * @swagger
 * /api/stations/{id}/reviews:
 *   get:
 *     summary: Get reviews for station
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *         description: List of reviews
 */
router.get('/:id/reviews', getReviews);

module.exports = router;











