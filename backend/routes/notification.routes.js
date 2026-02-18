const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const notificationController = require('../controllers/notification.controller');
const advancedResults = require('../middlewares/advancedResults');
const Notification = require('../models/Notification');

// inject user filter so users see only their notifications
const injectUserFilter = (req, res, next) => {
    try {
        req.query.recipient = req.user._id.toString();
    } catch (e) {}
    next();
};

// GET /api/notifications
router.get('/', protect, authorize('user', 'boutique'), injectUserFilter, advancedResults(Notification), notificationController.getAllNotifications);

module.exports = router;
