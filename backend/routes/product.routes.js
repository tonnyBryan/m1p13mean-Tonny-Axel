const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a product (store)
 *     tags: [Products]
 *     description: Create a new product for a store (images ignored for now)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - regularPrice
 *             properties:
 *               name:
 *                 type: string
 *                 example: iPhone 15
 *               description:
 *                 type: string
 *                 example: Latest Apple smartphone
 *               regularPrice:
 *                 type: number
 *                 example: 1200
 *               salePrice:
 *                 type: number
 *                 example: 999
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [apple, phone]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Product payload received
 *       400:
 *         description: Validation error
 */
router.post(
    '/',
    protect,
    authorize('boutique'),
    upload.array('images', 5),
    productController.createProduct
);

module.exports = router;
