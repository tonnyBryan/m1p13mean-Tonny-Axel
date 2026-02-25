const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const advancedResults = require("../middlewares/advancedResults");
const RefreshToken = require('../models/RefreshToken');

const injectUserFilter = (req, res, next) => {
    try {
        req.query.user = req.user._id.toString();
    } catch (e) {}
    next();
};


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, boutique, user]
 *     responses:
 *       200:
 *         description: Connexion réussie
 */
router.post('/login', authController.login);

router.post('/signup', authController.signupUser);


/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Rafraîchir l'access token
 *     tags: [Auth]
 *     description: Utilise le refresh token stocké dans le cookie HTTPOnly
 *     responses:
 *       200:
 *         description: Nouveau access token généré
 *       401:
 *         description: Refresh token manquant ou expiré
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion utilisateur
 *     tags: [Auth]
 *     description: Supprime le refresh token (cookie + DB)
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/verify-token:
 *   get:
 *     summary: Vérifie si le token est valide
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token valide
 *       401:
 *         description: Token manquant ou invalide
 */
router.get('/verify-token', authController.verifyToken);


router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Changer le mot de passe
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *       401:
 *         description: Non autorisé, token manquant ou invalide
 */
router.post('/change-password', protect, authorize('user', 'boutique'), authController.changePassword);

// Toggle new device alert preference (authenticated users only)
router.post('/toggle-new-device-alert', protect, authorize('user', 'boutique'), authController.toggleNewDeviceAlert);

router.get(
    '/login-history',
    protect,
    injectUserFilter,
    advancedResults(RefreshToken),
    authController.getLoginHistory
);

router.delete('/login-history/:id', protect, authController.revokeSession);

module.exports = router;
