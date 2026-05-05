const express = require('express');
const router = express.Router();
const { getMe, updateMe } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validate, updateUserSchema } = require('../middleware/validator');

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/me', protect, validate(updateUserSchema), updateMe);

module.exports = router;











