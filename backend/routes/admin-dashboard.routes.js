const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/admin-dashboard.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/realtime', protect, authorize('admin'), dashboardController.getRealtime);
router.get('/analytics', protect, authorize('admin'), dashboardController.getAnalytics);

module.exports = router;
