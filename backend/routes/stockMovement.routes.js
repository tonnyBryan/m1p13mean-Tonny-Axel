const express = require('express');
const router = express.Router();
const stockMovementController = require('../controllers/stockMovement.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const advancedResults = require('../middlewares/advancedResults');
const StockMovement = require('../models/StockMovement');
const injectBoutiqueFilter = require('../middlewares/boutiqueFilter.middleware');

router.use(protect);

router.post('/', authorize('boutique'), stockMovementController.createStockMovements);

router.get('/',
    authorize('boutique'),
    injectBoutiqueFilter,
    advancedResults(StockMovement, [
        { path: 'product', select: 'name sku images' },
        { path: 'createdBy', select: 'name' }
    ]),
    stockMovementController.getStockMovements
);

module.exports = router;
