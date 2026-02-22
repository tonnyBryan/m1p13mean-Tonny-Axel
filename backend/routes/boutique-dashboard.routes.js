const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/boutique-dashboard.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/realtime', protect, authorize('boutique'), dashboardController.getRealtime);
router.get('/analytics', protect, authorize('boutique'), dashboardController.getAnalytics);

module.exports = router;