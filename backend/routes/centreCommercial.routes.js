const express = require('express');
const router = express.Router();
const centreController = require('../controllers/centreCommercial.controller');

// GET /api/centre-commercial
router.get('/', centreController.getCentreCommercial);

module.exports = router;
