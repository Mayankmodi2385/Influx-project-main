const express = require('express');
const router = express.Router();
const { searchRoute, getMockRoute } = require('../controllers/routePlannerController');

/**
 * @swagger
 * /api/routes/search:
 *   post:
 *     summary: Search for route and charging stations along route
 *     tags: [Route Planner]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start
 *               - end
 *               - vehicleId
 *             properties:
 *               start:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Start coordinates [longitude, latitude]
 *                 example: [73.8567, 18.5204]
 *               end:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: End coordinates [longitude, latitude]
 *                 example: [72.8777, 19.0760]
 *               vehicleId:
 *                 type: string
 *                 description: Vehicle ID
 *                 example: "507f1f77bcf86cd799439011"
 *               filters:
 *                 type: object
 *                 properties:
 *                   minPowerKw:
 *                     type: number
 *                     description: Minimum charger power in kW
 *                     example: 50
 *                   amenities:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Required amenities
 *                     example: ["Restroom", "Cafe"]
 *                   providers:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Preferred providers
 *                     example: ["Tata Power", "ChargePoint"]
 *     responses:
 *       200:
 *         description: Route plan with stations and estimates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     route:
 *                       type: object
 *                     stops:
 *                       type: array
 *                     summary:
 *                       type: object
 *       400:
 *         description: Invalid request
 */
router.post('/search', searchRoute);

/**
 * @swagger
 * /api/routes/mock:
 *   get:
 *     summary: Get mock route data for development
 *     tags: [Route Planner]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *         description: Start coordinates as "lng,lat"
 *         example: "73.8567,18.5204"
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *         description: End coordinates as "lng,lat"
 *         example: "72.8777,19.0760"
 *     responses:
 *       200:
 *         description: Mock route data
 */
router.get('/mock', getMockRoute);

module.exports = router;






