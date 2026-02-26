const express = require('express');
const router = express.Router();
const productRatingController = require('../controllers/productRating.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const advancedResults = require('../middlewares/advancedResults');
const ProductRating = require('../models/ProductRating');

/**
 * @swagger
 * /api/product-ratings/{productId}:
 *   post:
 *     summary: Add a rating and comment for a product (one rating per user)
 *     tags:
 *       - ProductRatings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product to rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *             required:
 *               - rating
 *               - comment
 *     responses:
 *       '200':
 *         description: Rating added successfully
 *       '400':
 *         description: Validation error or missing data
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Product not found
 */
// Add a rating for a product (user only)
router.post('/:productId', protect, authorize('user'), productRatingController.addRating);

// Remove rating for a product by current user (user only)
router.delete('/:productId', protect, authorize('user'), productRatingController.removeRating);

// Example: GET ?page=1&limit=10&sort=-createdAt&product=60d21b4667d0d8992e610c85
router.get('/', advancedResults(ProductRating), productRatingController.getRatingsByProduct);

module.exports = router;
