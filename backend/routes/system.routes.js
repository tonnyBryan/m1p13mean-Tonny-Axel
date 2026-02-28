const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /api/system/reset-data:
 *   post:
 *     summary: Reset all system data except CentreCommercial and admin users
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data reset completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post('/reset-data',  systemController.resetData);

module.exports = router;
