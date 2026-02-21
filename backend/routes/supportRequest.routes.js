const express = require('express');
const router = express.Router();
const supportRequestController = require('../controllers/supportRequest.controller');
const advancedResults = require('../middlewares/advancedResults');
const SupportRequest = require('../models/SupportRequest');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Public route to submit a support request
router.post('/submit', supportRequestController.submit);

// Admin route to list support requests
router.get('/', protect, authorize('admin'), advancedResults(SupportRequest), supportRequestController.getAllSupportRequests);

module.exports = router;
