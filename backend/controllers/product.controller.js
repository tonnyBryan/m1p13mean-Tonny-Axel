const { successResponse, errorResponse } = require('../utils/apiResponse');
const Product = require("../models/Product");
const { uploadImage } = require('../utils/cloudinary');
const Boutique = require('../models/Boutique');
const { generateSku } = require('../utils/product.util');



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

        const boutique = await Boutique
            .findOne({ owner: req.user._id })
            .select('_id');

        if (!boutique) {
            return errorResponse(res, 403, 'Store not found for this user');
        }

        /* =========================
           6️⃣ Création produit
        ========================= */
        const product = await Product.create({
            boutique: boutique._id,
            name: name.trim(),
            description: description?.trim() || '',
            regularPrice: regPrice,
            salePrice: sale,
            minOrderQty: minQty,
            maxOrderQty: maxQty,
            sku: generateSku(name),
            category,
            tags: parsedTags,
            images: ['https://e7.pngegg.com/pngimages/199/143/png-clipart-black-controller-art-emoji-video-game-sms-game-game-multimedia-messaging-service-thumbnail.png'],
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
        const user = req.user;
        if (user.role === 'boutique') {
            const boutique = await Boutique.findOne({ owner: user._id }).select('_id');
            if (!boutique) {
                return errorResponse(res, 403, 'Store not found for this user');
            }

            const product = await Product.findOne({ _id: req.params.id, boutique: boutique._id }).select();

            if (!product) {
                return errorResponse(res, 404, 'Product not found in your store');
            }

            return successResponse(res, 200, null, product);
        }


        const product = await Product.findById(req.params.id).select();

        if (!product) {
            return errorResponse(res, 404, 'Product not found');
        }

        return successResponse(res, 200, null, product);
    } catch (error) {
        return errorResponse(res, 400, 'Invalid ID');
    }
};




/**
 * GET /api/products
 * Lister tous les produits
 */
exports.getAllProducts = async (req, res, next) => {
    return successResponse(res, 200, null, res.advancedResults);
};
/**
 * PUT /api/products/:id
 * Mettre à jour un produit
 */
exports.updateProduct = async (req, res) => {
    try {
        // Validate only provided fields similar to create
        const payload = {};
        const {
            name,
            description,
            regularPrice,
            salePrice,
            minOrderQty,
            maxOrderQty,
            sku,
            tags,
            images,
            category,
            isActive,
            isSale
        } = req.body;

        // Name
        if (name !== undefined) {
            if (!name || typeof name !== 'string' || name.trim().length < 3) {
                return errorResponse(res, 400, 'Invalid product name');
            }
            payload.name = name.trim();
        }

        // Category
        if (category !== undefined) {
            if (!category || typeof category !== 'string') {
                return errorResponse(res, 400, 'Invalid category');
            }
            payload.category = category;
        }

        // Regular Price
        if (regularPrice !== undefined) {
            const regPrice = Number(regularPrice);
            if (isNaN(regPrice) || regPrice <= 0) {
                return errorResponse(res, 400, 'Invalid regular price');
            }
            payload.regularPrice = regPrice;

            // If salePrice provided, validate it against regPrice or existing product regularPrice
            if (salePrice !== undefined && salePrice !== '') {
                const sale = Number(salePrice);
                if (isNaN(sale) || sale < 0 || sale >= regPrice) {
                    return errorResponse(res, 400, 'Invalid sale price');
                }
                payload.salePrice = sale;
            }
        } else if (salePrice !== undefined) {
            // regularPrice not provided, need to check against existing product
            const existing = await Product.findById(req.params.id).select('regularPrice');
            if (!existing) return errorResponse(res, 404, 'Product not found');
            const baseReg = existing.regularPrice;
            const sale = Number(salePrice);
            if (isNaN(sale) || sale < 0 || sale >= baseReg) {
                return errorResponse(res, 400, 'Invalid sale price');
            }
            payload.salePrice = sale;
        }

        // min/max qty
        if (minOrderQty !== undefined) {
            const minQty = Number(minOrderQty);
            if (isNaN(minQty) || minQty <= 0) return errorResponse(res, 400, 'Invalid minimum order quantity');
            payload.minOrderQty = minQty;
        }

        if (maxOrderQty !== undefined) {
            const maxQty = Number(maxOrderQty);
            if (isNaN(maxQty) || maxQty < (payload.minOrderQty ?? 1)) return errorResponse(res, 400, 'Invalid max order quantity');
            payload.maxOrderQty = maxQty;
        }

        // description
        if (description !== undefined) {
            if (description && typeof description !== 'string') return errorResponse(res, 400, 'Invalid description');
            payload.description = description ? description.trim() : '';
        }

        // tags
        if (tags !== undefined) {
            let parsedTags = [];
            if (tags) {
                try {
                    parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
                    if (!Array.isArray(parsedTags)) return errorResponse(res, 400, 'Tags must be an array');
                } catch {
                    return errorResponse(res, 400, 'Invalid tags format');
                }
            }
            payload.tags = parsedTags;
        }

        // images
        if (images !== undefined) {
            if (!images || !Array.isArray(images) || images.length === 0) return errorResponse(res, 400, 'At least one image is required');
            payload.images = images;
        }

        // sku: if missing/null, generate from name or existing name
        if (!sku) {
            const baseName = payload.name || (await Product.findById(req.params.id).select('name')).name;
            payload.sku = generateSku(baseName);
        } else if (sku !== undefined) {
            payload.sku = sku;
        }

        // isActive
        if (isActive !== undefined) {
            payload.isActive = isActive;
        }

        // isActive
        if (isSale !== undefined) {
            payload.isSale = isSale;
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            payload,
            { new: true, runValidators: true }
        ).select();

        if (!product) {
            return errorResponse(res, 404, 'Product not found');
        }

        return successResponse(res, 200, 'Product updated', product);

    } catch (error) {
        console.error(error);
        return errorResponse(res, 400, 'Error during update');
    }
};