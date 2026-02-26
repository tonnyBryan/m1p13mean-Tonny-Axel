const express = require('express');
const router = express.Router();
const { protect, authorize} = require('../middlewares/auth.middleware');
const commandeController = require('../controllers/commande.controller');
const advancedResults = require('../middlewares/advancedResults');
const Commande = require('../models/Commande');
const injectBoutiqueFilter = require('../middlewares/boutiqueFilter.middleware');

// small middleware to inject user filter for users so they only see their orders
const injectUserFilter = (req, res, next) => {
    try {
        if (req.user && req.user.role === 'user') {
            req.query.user = req.user._id.toString();
        }
    } catch (e) {
        // ignore
    }
    next();
};

// Add product to cart (draft)
router.post('/add', protect, authorize('user'), commandeController.addToCart);
router.post('/buy', protect, authorize('user'), commandeController.buy);


// Get current draft for user
router.get('/draft', protect, authorize('user', 'boutique'), commandeController.getDraft);

// Get full draft (populated)
router.get('/draft/full', protect, authorize('user', 'boutique'), commandeController.getDraftFull);

// Get a commande by id (boutique OR user)
router.get('/:id', protect, authorize('user', 'boutique'), commandeController.getCommandById);

// New: status change endpoints (boutique only)
router.patch('/:id/accept', protect, authorize('boutique'), commandeController.acceptOrder);
router.patch('/:id/cancel', protect, authorize('boutique'), commandeController.cancelOrder);
router.patch('/:id/start-delivery', protect, authorize('boutique'), commandeController.startDelivery);
router.patch('/:id/pickup', protect, authorize('boutique'), commandeController.markAsPickedUp);
router.patch('/:id/deliver', protect, authorize('boutique'), commandeController.markAsDelivered);

// Get all commandes (boutique OR user) - inject boutique filter then inject user filter then advancedResults
router.get('/', protect, authorize('user', 'boutique'), injectBoutiqueFilter, injectUserFilter, advancedResults(Commande), commandeController.getAllCommands);

// Update quantity for a product in draft (increment/decrement/set)
router.patch('/products/:productId/quantity', protect, authorize('user'), commandeController.updateItemQuantity);

// Remove a product from draft
router.delete('/products/:productId', protect, authorize('user'), commandeController.removeItemFromCart);

// Pay the current draft
router.post('/pay', protect, authorize('user'), commandeController.payCommand);

module.exports = router;
