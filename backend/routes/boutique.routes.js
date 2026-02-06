const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutique.controller');
const upload = require('../middlewares/upload.middleware');
const advancedResults = require('../middlewares/advancedResults');
const Boutique = require('../models/Boutique');
const {protect, authorize} = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Boutiques
 *   description: Gestion des boutiques
 */

/**
 * @swagger
 * /api/boutiques:
 *   post:
 *     summary: Créer une nouvelle boutique
 *     tags: [Boutiques]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Données libre pour créer la boutique
 *     responses:
 *       201:
 *         description: Boutique créée avec succès
 *       400:
 *         description: Requête invalide
 */
// POST /api/boutiques - Create a new boutique
router.post(
    '/',
    protect,
    authorize('admin'),
    upload.single('file'),
    boutiqueController.createBoutiqueFull
);

/**
 * @swagger
 * /api/boutiques:
 *   get:
 *     summary: Récupérer toutes les boutiques
 *     tags: [Boutiques]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de toutes les boutiques
 *       401:
 *         description: Non autorisé
 */

// GET /api/boutiques - Get all boutiques with filtering/pagination
router.get(
    '/',
    protect,
    authorize('user', 'admin'),
    advancedResults(Boutique),
    boutiqueController.getBoutiques
);

module.exports = router;
