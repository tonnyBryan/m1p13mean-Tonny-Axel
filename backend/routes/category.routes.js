const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const advancedResults = require('../middlewares/advancedResults');
const Category = require('../models/Category');
const { protect, authorize } = require('../middlewares/auth.middleware');
const injectBoutiqueFilter = require('../middlewares/boutiqueFilter.middleware');

// GET /api/categories - use boutique filter and advancedResults
router.get('/', protect, authorize('user', 'boutique', 'admin'), injectBoutiqueFilter, advancedResults(Category), categoryController.getAllCategory);

// POST /api/categories - create category for the current user's boutique
router.post('/', protect, authorize('boutique'), categoryController.addCategory);

module.exports = router;
