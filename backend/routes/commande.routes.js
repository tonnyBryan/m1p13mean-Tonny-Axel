const express = require('express');
const router = express.Router();
const { protect, authorize} = require('../middlewares/auth.middleware');
const commandeController = require('../controllers/commande.controller');

// Add product to cart (draft)
router.post('/add', protect, authorize('user'), commandeController.addToCart);

// Get current draft for user
router.get('/draft', protect, authorize('user', 'boutique'), commandeController.getDraft);

module.exports = router;
