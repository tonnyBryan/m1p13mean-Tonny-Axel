const express = require('express');
const router = express.Router();
const venteController = require('../controllers/vente.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const advancedResults = require('../middlewares/advancedResults');
const Vente = require('../models/Vente');
const injectBoutiqueFilter = require('../middlewares/boutiqueFilter.middleware');

// All vente routes require authentication
router.use(protect);

router.post('/add', authorize('boutique'),  venteController.createVente);
router.get('/boutique/all',
    authorize('boutique'),
    injectBoutiqueFilter,
    advancedResults(Vente),
    venteController.getAllVentes
);
router.get('/:id', authorize('boutique'), venteController.getVenteById);
router.put('/:id', authorize('boutique'), venteController.updateVente);
router.patch('/:id/status', authorize('boutique'), venteController.updateStatus);
router.get('/:id/invoice', authorize('boutique'), venteController.getInvoice);

module.exports = router;
