// routes/search.routes.js

const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/search.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Recherche globale produits et boutiques
 *     description: Recherche produits et boutiques par mot-clé
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Mot-clé de recherche
 *     responses:
 *       200:
 *         description: Succès
 *       400:
 *         description: Paramètre q manquant
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/', protect, authorize('user', 'admin'), globalSearch);


module.exports = router;
