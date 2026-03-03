const express = require('express');
const router = express.Router();
const paiementAbonnementController = require('../controllers/paiementAbonnement.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const advancedResults = require('../middlewares/advancedResults');
const PaiementAbonnement = require('../models/PaiementAbonnement');

router.use(protect);

// Admin: list payments for a boutique
router.get(
    '/boutique/:boutiqueId',
    authorize('admin'),
    (req, res, next) => {
        req.query.boutique = req.params.boutiqueId;
        next();
    },
    advancedResults(PaiementAbonnement),
    paiementAbonnementController.getPaymentsByBoutique
);

// Admin: register a subscription payment
router.post('/pay', authorize('admin'), paiementAbonnementController.paySubscription);

module.exports = router;
