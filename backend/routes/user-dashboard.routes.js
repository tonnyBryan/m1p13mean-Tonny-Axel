const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/user-dashboard.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/kpi', protect, authorize('user'), dashboardController.getKpiResume);
router.get('/orders', protect, authorize('user'), dashboardController.getOrderTab);

module.exports = router;
