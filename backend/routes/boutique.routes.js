const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutique.controller');
const upload = require('../middlewares/upload.middleware');
const advancedResults = require('../middlewares/advancedResults');
const Boutique = require('../models/Boutique');

// POST /api/boutiques - Create a new boutique
router.post(
    '/',
    upload.single('file'),
    boutiqueController.createBoutiqueFull
);

// GET /api/boutiques - Get all boutiques with filtering/pagination
router.get(
    '/',
    advancedResults(Boutique),
    boutiqueController.getBoutiques
);

module.exports = router;
