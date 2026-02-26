const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfile.controller');
const advancedResults = require('../middlewares/advancedResults');
const UserProfile = require('../models/UserProfile');
const { protect, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: UserProfiles
 *   description: Gestion des profils utilisateurs
 */

/**
 * @swagger
 * /api/user-profiles:
 *   get:
 *     summary: Récupérer tous les profils (Admin uniquement)
 *     tags: [UserProfiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de profils
 */
router.get(
    '/',
    protect,
    authorize('admin'),
    advancedResults(UserProfile, { path: 'user', select: 'name email role isActive' }),
    userProfileController.getAllProfiles
);

/**
 * @swagger
 * /api/user-profiles/{id}:
 *   get:
 *     summary: Récupérer un profil par ID
 *     tags: [UserProfiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profil trouvé
 *       404:
 *         description: Profil non trouvé
 */
router.get(
    '/:id',
    protect,
    userProfileController.getProfileById
);

module.exports = router;
