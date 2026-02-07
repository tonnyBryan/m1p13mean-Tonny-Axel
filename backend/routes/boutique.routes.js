const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutique.controller');
const upload = require('../middlewares/upload.middleware');
const advancedResults = require('../middlewares/advancedResults');
const Boutique = require('../models/Boutique');
const { protect, authorize } = require("../middlewares/auth.middleware");

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

/**
 * @swagger
 * /api/boutiques/stats:
 *   get:
 *     summary: Récupérer les statistiques des boutiques
 *     tags: [Boutiques]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées
 *       401:
 *         description: Non autorisé
 */

// GET /api/boutiques/stats - Get boutique statistics
router.get(
    '/stats',
    protect,
    authorize('user', 'admin'),
    boutiqueController.getBoutiqueStats
);

/**
 * @swagger
 * /api/boutiques/{id}/full:
 *   get:
 *     summary: Récupérer une boutique complet avec config par son ID
 *     tags: [Boutiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la boutique
 *     responses:
 *       200:
 *         description: Détails de la boutique
 *       404:
 *         description: Boutique non trouvée
 *       401:
 *         description: Non autorisé
 */
router.get(
    '/:id/full',
    protect,
    authorize('user', 'boutique', 'admin'),
    boutiqueController.getBoutiqueFull
);

/**
 * @swagger
 * /api/boutiques/{id}:
 *   get:
 *     summary: Récupérer une boutique par son ID
 *     tags: [Boutiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la boutique
 *     responses:
 *       200:
 *         description: Détails de la boutique
 *       404:
 *         description: Boutique non trouvée
 *       401:
 *         description: Non autorisé
 */router.get(
    '/:id',
    protect,
    authorize('user', 'boutique', 'admin'),
    boutiqueController.getBoutiqueById
);

/**
 * @swagger
 * /api/boutiques/{id}/status:
 *   patch:
 *     summary: Mettre à jour le statut actif d'une boutique
 *     tags: [Boutiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la boutique
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Nouveau statut actif
 *             required:
 *               - isActive
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: Boutique non trouvée
 *       401:
 *         description: Non autorisé
 */

// PATCH /api/boutiques/:id/status - Update boutique active status (Admin only)
router.patch(
    '/:id/status',
    protect,
    authorize('admin'),
    boutiqueController.updateBoutiqueStatus
);

// PATCH /api/boutiques/:id - Update boutique general info
router.patch(
    '/:id',
    protect,
    authorize('boutique', 'admin'),
    boutiqueController.updateBoutique
);

// PATCH /api/boutiques/:id/delivery - Update or create delivery config
router.patch(
    '/:id/delivery',
    protect,
    authorize('boutique', 'admin'),
    boutiqueController.updateDeliveryConfig
);


module.exports = router;
