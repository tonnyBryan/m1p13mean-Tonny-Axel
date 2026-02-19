const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protected routes
router.post('/add/:productId', protect, wishlistController.addToWishlist);
router.post('/remove/:productId', protect, wishlistController.removeToWishlist);
router.get('/me', protect, wishlistController.getMyWishlist);

module.exports = router;
