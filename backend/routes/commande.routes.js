const express = require('express');
const router = express.Router();
const { protect, authorize} = require('../middlewares/auth.middleware');
const commandeController = require('../controllers/commande.controller');

// Add product to cart (draft)
router.post('/add', protect, authorize('user'), commandeController.addToCart);

// Get current draft for user
router.get('/draft', protect, authorize('user', 'boutique'), commandeController.getDraft);

// Get full draft (populated)
router.get('/draft/full', protect, authorize('user', 'boutique'), commandeController.getDraftFull);

// Update quantity for a product in draft (increment/decrement/set)
router.patch('/products/:productId/quantity', protect, authorize('user'), commandeController.updateItemQuantity);

// Remove a product from draft
router.delete('/products/:productId', protect, authorize('user'), commandeController.removeItemFromCart);

module.exports = router;
