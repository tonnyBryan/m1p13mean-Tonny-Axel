const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Protected routes
router.post('/add/:productId', protect, wishlistController.addToWishlist);
router.post('/remove/:productId', protect, wishlistController.removeToWishlist);
router.get('/me', protect, wishlistController.getMyWishlist);

// GET /api/wishlist - paginated list for current user (single wishlist document)
router.get('/', protect, authorize('user'), wishlistController.getAllWishList);

module.exports = router;
