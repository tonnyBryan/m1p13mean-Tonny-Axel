const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const advancedResults = require('../middlewares/advancedResults');
const Subscription = require('../models/Subscription');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Public route to subscribe
router.post('/subscribe', subscriptionController.subscribe);

// Admin route to list subscriptions
router.get('/', protect, authorize('admin'), advancedResults(Subscription), subscriptionController.getAllSubscriptions);

module.exports = router;
