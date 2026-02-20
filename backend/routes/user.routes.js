const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const advancedResults = require('../middlewares/advancedResults');
const User = require('../models/User');
const { protect, authorize } = require('../middlewares/auth.middleware');



/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID MongoDB
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, boutique, user]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - email
 *         - role
 */

// Search users by query (name, email, profile names)
router.get(
    '/search',
    protect,
    authorize('user', 'admin', 'boutique'),
    userController.searchUsers
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lister tous les utilisateurs avec pagination, filtres et tri
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de la page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'utilisateurs par page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: "name,-createdAt"
 *         description: "Champs pour trier (ex: name,-createdAt)"
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *           example: "name,email,role"
 *         description: Champs à inclure dans la réponse
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtre par nom (regex insensible)
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filtre par email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin,boutique,user]
 *         description: Filtre par rôle
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtre par statut actif
 *       - in: query
 *         name: createdAt[gte]
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de création minimum
 *       - in: query
 *         name: createdAt[lte]
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de création maximum
 *     responses:
 *       200:
 *         description: Liste paginée des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 totalDocs:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get(
    '/',
    protect,
    authorize('admin', 'boutique'),
    (req, res, next) => {
        req.query.role = 'user';
        next();
    },
    advancedResults(User, 'profile'),
    userController.getAllUsers
);

// Route to get current user's profile
router.get(
    '/me',
    protect,
    authorize('user', 'admin', 'boutique'),
    userController.getMyParentProfile
);

/**
 * @swagger
 * /api/users/profile/{id}:
 *   get:
 *     summary: Récupérer le profil détaillé d'un utilisateur (Admin)
 */
router.get(
    '/profile/:id',
    protect,
    authorize('admin'),
    userController.getUserProfileById
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get(
    '/:id',
    protect,
    authorize('admin', 'boutique', 'user'),
    userController.getUserById
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Créer un utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé
 */
router.post('/', userController.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 */
router.put(
    '/:id',
    protect,
    authorize('admin', 'user'),
    userController.updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 */
router.delete(
    '/:id',
    protect,
    authorize('admin'),
    userController.deleteUser
);

router.patch(
    '/:id/status',
    protect,
    authorize('admin'),
    userController.toggleUserStatus
);


// Route to get current user's profile
router.get(
    '/me/profile',
    protect,
    authorize('user', 'admin', 'boutique'),
    userController.getMyProfile
);

// Upsert profile
router.put(
    '/me/profile',
    protect,
    authorize('user', 'admin'),
    userController.upsertMyProfile
);

// Add address to profile
router.post(
    '/me/profile/addresses',
    protect,
    authorize('user', 'admin'),
    userController.addAddress
);

// Delete address from profile by address id
router.delete(
    '/me/profile/addresses/:addressId',
    protect,
    authorize('user', 'admin'),
    userController.deleteAddress
);


module.exports = router;
