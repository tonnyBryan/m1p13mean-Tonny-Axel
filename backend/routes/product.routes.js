const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const advancedResults = require("../middlewares/advancedResults");
const Product = require("../models/Product");
const injectBoutiqueFilter = require('../middlewares/boutiqueFilter.middleware');
const priceFilter = require('../middlewares/priceFilter.middleware');


/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID MongoDB
 *         boutique:
 *           type: string
 *           description: ID de la boutique propriétaire du produit
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         sku:
 *           type: string
 *         category:
 *           type: string
 *         stock:
 *           type: integer
 *         minOrderQty:
 *           type: integer
 *         maxOrderQty:
 *           type: integer
 *         regularPrice:
 *           type: number
 *         salePrice:
 *           type: number
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des tags associés au produit
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: url
 *           description: URLs des images du produit
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - boutique
 *         - name
 *         - sku
 *         - category
 *         - stock
 *         - minOrderQty
 *         - maxOrderQty
 *         - regularPrice
 */


/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a product (store)
 *     tags: [Products]
 *     description: Create a new product for a store (images ignored for now)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - regularPrice
 *             properties:
 *               name:
 *                 type: string
 *                 example: iPhone 15
 *               description:
 *                 type: string
 *                 example: Latest Apple smartphone
 *               regularPrice:
 *                 type: number
 *                 example: 1200
 *               salePrice:
 *                 type: number
 *                 example: 999
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [apple, phone]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Product payload received
 *       400:
 *         description: Validation error
 */
router.post(
    '/',
    protect,
    authorize('boutique'),
    upload.array('images', 5),
    productController.createProduct
);



/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Récupérer un produit par ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produit trouvé
 *       404:
 *         description: Produit non trouvé
 */
router.get(
    '/:id',
    protect,
    authorize('admin', 'boutique', 'user'),
    productController.getProductById
);



/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Récupère tous les produits
 *     description: Retourne la liste de tous les produits.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des produits récupérée avec succès
 *       401:
 *         description: Non authentifié / token invalide
 *       403:
 *         description: Accès interdit (pas le rôle approprié)
 */
router.get(
    '/',
    protect,
    authorize('user', 'boutique'),
    injectBoutiqueFilter,
    priceFilter,
    advancedResults(Product),
    productController.getAllProducts
);


/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Mettre à jour un produit
 *     tags: [Products]
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
 *         description: Produit mis à jour
 */
router.put(
    '/:id',
    protect,
    authorize('admin', 'boutique'),
    productController.updateProduct
);

/**
 * @swagger
 * /api/products/share:
 *   post:
 *     summary: Partager un produit
 *     tags: [Products]
 *     description: Partager un produit via un lien
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: Produit partagé avec succès
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Produit non trouvé
 */
router.post(
    '/share',
    protect,
    authorize('admin', 'boutique', 'user'),
    productController.shareProduct
);

module.exports = router;
