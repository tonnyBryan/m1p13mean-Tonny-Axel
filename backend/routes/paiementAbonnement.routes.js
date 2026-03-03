const express = require('express');
const router = express.Router();
const paiementAbonnementController = require('../controllers/paiementAbonnement.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const advancedResults = require('../middlewares/advancedResults');
const PaiementAbonnement = require('../models/PaiementAbonnement');
const injectBoutiqueFilter = require('../middlewares/boutiqueFilter.middleware');

router.use(protect);

// Admin: list payments with filters (populate boutique)
router.get(
    '/',
    authorize('admin'),
    advancedResults(PaiementAbonnement, { path: 'boutique', select: 'name logo owner isActive isValidated plan' }),
    paiementAbonnementController.getAllPayments
);

// Admin: list payments for a boutique
router.get(
    '/boutique/:boutiqueId',
    authorize('admin', 'boutique'),
    injectBoutiqueFilter,
    (req, res, next) => {
        if (req.user?.role === 'admin') {
            req.query.boutique = req.params.boutiqueId;
        }
        next();
    },
    advancedResults(PaiementAbonnement),
    paiementAbonnementController.getPaymentsByBoutique
);

// Admin: register a subscription payment
router.post('/pay', authorize('admin'), paiementAbonnementController.paySubscription);

module.exports = router;
