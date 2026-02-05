const { successResponse, errorResponse } = require('../utils/apiResponse');
const Product = require("../models/Product");
const { uploadImage } = require('../utils/cloudinary');


/**
 * POST /api/products
 * Create product (store only)
 */
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            regularPrice,
            salePrice,
            minOrderQty,
            maxOrderQty,
            category,
            tags
        } = req.body;

        /* =========================
           1️⃣ Contrôles de base
        ========================= */
        if (!name || typeof name !== 'string' || name.trim().length < 3) {
            return errorResponse(res, 400, 'Invalid product name');
        }

        if (!category || typeof category !== 'string') {
            return errorResponse(res, 400, 'Invalid category');
        }

        /* =========================
           2️⃣ Contrôles des nombres
        ========================= */
        const regPrice = Number(regularPrice);
        if (isNaN(regPrice) || regPrice <= 0) {
            return errorResponse(res, 400, 'Invalid regular price');
        }

        let sale = null;
        if (salePrice !== undefined && salePrice !== '') {
            sale = Number(salePrice);
            if (isNaN(sale) || sale < 0 || sale >= regPrice) {
                return errorResponse(res, 400, 'Invalid sale price');
            }
        }

        const minQty = minOrderQty ? Number(minOrderQty) : 1;
        const maxQty = maxOrderQty ? Number(maxOrderQty) : null;

        if (isNaN(minQty) || minQty <= 0) {
            return errorResponse(res, 400, 'Invalid minimum order quantity');
        }

        if (maxQty !== null && (isNaN(maxQty) || maxQty < minQty)) {
            return errorResponse(res, 400, 'Invalid max order quantity');
        }

        /* =========================
           3️⃣ Description
        ========================= */
        if (description && typeof description !== 'string') {
            return errorResponse(res, 400, 'Invalid description');
        }

        /* =========================
           4️⃣ Tags
        ========================= */
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = JSON.parse(tags);
                if (!Array.isArray(parsedTags)) {
                    return errorResponse(res, 400, 'Tags must be an array');
                }
            } catch {
                return errorResponse(res, 400, 'Invalid tags format');
            }
        }

        /* =========================
           5️⃣ Images
        ========================= */
        if (!req.files || req.files.length === 0) {
            return errorResponse(res, 400, 'At least one image is required');
        }

        // const uploadedImages = await Promise.all(
        //     req.files.map(file => uploadImage(file.buffer, 'products'))
        // );
        //
        // const imageUrls = uploadedImages.map(img => img.secure_url);
        // console.log(imageUrls)

        const storeId = req.user.boutiqueId;

        /* =========================
           6️⃣ Création produit
        ========================= */
        const product = await Product.create({
            boutique: storeId,
            name: name.trim(),
            description: description?.trim() || '',
            regularPrice: regPrice,
            salePrice: sale,
            minOrderQty: minQty,
            maxOrderQty: maxQty,
            category,
            tags: parsedTags,
            image: [],
            isActive: true
        });

        return successResponse(res, 201, 'Product successfully created', product);

    } catch (error) {
        console.error(error);
        return errorResponse(res, 500, 'Error while creating product');
    }
};



/**
 * GET /api/products/:id
 * Récupérer un produit par ID
 */
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select();

        if (!product) {
            return errorResponse(res, 404, 'Product not found');
        }

        return successResponse(res, 200, null, product);
    } catch (error) {
        return errorResponse(res, 400, 'Invalid ID');
    }
};