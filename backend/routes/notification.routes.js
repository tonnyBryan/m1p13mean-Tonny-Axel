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

// PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, authorize('user', 'boutique'), notificationController.markAsRead);

// PATCH /api/notifications/read-all
router.patch('/read-all', protect, authorize('user', 'boutique'), notificationController.markAllAsRead);

module.exports = router;
