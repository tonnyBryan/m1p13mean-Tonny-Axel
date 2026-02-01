const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

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

module.exports = router;
