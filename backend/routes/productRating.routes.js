const express = require('express');
const router = express.Router();
const productRatingController = require('../controllers/productRating.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const advancedResults = require('../middlewares/advancedResults');
const ProductRating = require('../models/ProductRating');

// Add a rating for a product (user only)
router.post('/:productId', protect, authorize('user'), productRatingController.addRating);

// Remove rating for a product by current user (user only)
router.delete('/:productId', protect, authorize('user'), productRatingController.removeRating);

// Example: GET /product/:productId?page=1&limit=10&sort=-createdAt
router.get('/product/:productId', advancedResults(ProductRating), productRatingController.getRatingsByProduct);

module.exports = router;
