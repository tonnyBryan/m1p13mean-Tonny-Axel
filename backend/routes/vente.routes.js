const express = require('express');
const router = express.Router();
const venteController = require('../controllers/vente.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const advancedResults = require('../middlewares/advancedResults');
const Vente = require('../models/Vente');
const injectBoutiqueFilter = require('../middlewares/boutiqueFilter.middleware');

// All vente routes require authentication
router.use(protect);

router.post('/add', venteController.createVente);
router.get('/boutique/all',
    authorize('boutique'),
    injectBoutiqueFilter,
    advancedResults(Vente),
    venteController.getAllVentes
);
router.get('/:id', venteController.getVenteById);
router.put('/:id', venteController.updateVente);
router.patch('/:id/status', venteController.updateStatus);
router.get('/:id/invoice', venteController.getInvoice);

module.exports = router;
