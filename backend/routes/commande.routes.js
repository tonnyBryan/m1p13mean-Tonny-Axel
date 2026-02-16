const express = require('express');
const router = express.Router();
const { protect, authorize} = require('../middlewares/auth.middleware');
const commandeController = require('../controllers/commande.controller');
const advancedResults = require('../middlewares/advancedResults');
const Commande = require('../models/Commande');
const injectBoutiqueFilter = require('../middlewares/boutiqueFilter.middleware');

// Add product to cart (draft)
router.post('/add', protect, authorize('user'), commandeController.addToCart);

// Get current draft for user
router.get('/draft', protect, authorize('user', 'boutique'), commandeController.getDraft);

// Get full draft (populated)
router.get('/draft/full', protect, authorize('user', 'boutique'), commandeController.getDraftFull);

// Get a commande by id (boutique OR user)
router.get('/:id', protect, authorize('user', 'boutique'), commandeController.getCommandById);

// Get all commandes (boutique only) - inject boutique filter then advancedResults
router.get('/', protect, authorize('boutique'), injectBoutiqueFilter, advancedResults(Commande), commandeController.getAllCommands);

// Update quantity for a product in draft (increment/decrement/set)
router.patch('/products/:productId/quantity', protect, authorize('user'), commandeController.updateItemQuantity);

// Remove a product from draft
router.delete('/products/:productId', protect, authorize('user'), commandeController.removeItemFromCart);

// Pay the current draft
router.post('/pay', protect, authorize('user'), commandeController.payCommand);

module.exports = router;
