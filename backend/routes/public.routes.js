const express = require('express');
const router = express.Router();
const { getStoresPreview, getHeroProducts } = require('../controllers/public.controller');

router.get('/hero-products', getHeroProducts);
router.get('/preview', getStoresPreview);

module.exports = router;