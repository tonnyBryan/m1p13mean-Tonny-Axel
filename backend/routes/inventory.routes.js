const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const advancedResults = require('../middlewares/advancedResults');
const InventoryCount = require('../models/InventoryCount');
const injectBoutiqueFilter = require('../middlewares/boutiqueFilter.middleware');

router.use(protect);

router.post('/', authorize('boutique'), inventoryController.createInventoryCount);

router.get('/',
    authorize('boutique'),
    injectBoutiqueFilter,
    advancedResults(InventoryCount, [
        { path: 'createdBy', select: 'name' }
    ]),
    inventoryController.getInventoryCounts
);

router.get('/:id', authorize('boutique'), inventoryController.getInventoryCountById);

module.exports = router;
