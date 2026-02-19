const { successResponse, errorResponse } = require('../utils/apiResponse');
const Product = require("../models/Product");
const Boutique = require('../models/Boutique');
const Wishlist = require('../models/Wishlist');
const { generateSku } = require('../utils/product.util');
const { sendNotification } = require('../services/notification.service');
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');


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
            return errorResponse(res, 400, 'The product name is invalid. It must be a string with at least 3 characters.');
        }

        if (!category || typeof category !== 'string') {
            return errorResponse(res, 400, 'The category is invalid. Please provide a valid category identifier.');
        }

        /* =========================
           2️⃣ Contrôles des nombres
        ========================= */
        const regPrice = Number(regularPrice);
        if (isNaN(regPrice) || regPrice <= 0) {
            return errorResponse(res, 400, 'The regular price is invalid. Please provide a positive number.');
        }

        let sale = null;
        if (salePrice !== undefined && salePrice !== '') {
            sale = Number(salePrice);
            if (isNaN(sale) || sale < 0 || sale >= regPrice) {
                return errorResponse(res, 400, 'The sale price is invalid. It must be a non-negative number strictly less than the regular price.');
            }
        }

        const minQty = minOrderQty ? Number(minOrderQty) : 1;
        const maxQty = maxOrderQty ? Number(maxOrderQty) : null;

        if (isNaN(minQty) || minQty <= 0) {
            return errorResponse(res, 400, 'The minimum order quantity is invalid. Please provide a positive integer.');
        }

        if (maxQty !== null && (isNaN(maxQty) || maxQty < minQty)) {
            return errorResponse(res, 400, 'The maximum order quantity is invalid. It must be greater than or equal to the minimum order quantity.');
        }

        /* =========================
           3️⃣ Description
        ========================= */
        if (description && typeof description !== 'string') {
            return errorResponse(res, 400, 'The product description is invalid. Please provide a textual description.');
        }

        /* =========================
           4️⃣ Tags
        ========================= */
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = JSON.parse(tags);
                if (!Array.isArray(parsedTags)) {
                    return errorResponse(res, 400, 'Tags must be an array of strings.');
                }
            } catch {
                return errorResponse(res, 400, 'Tags format is invalid. Please provide a JSON array of strings.');
            }
        }

        /* =========================
           5️⃣ Images
        ========================= */
        if (!req.files || req.files.length === 0) {
            return errorResponse(res, 400, 'At least one product image is required. Please upload or provide an image.');
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
            return errorResponse(res, 403, 'No store was found for the authenticated user. Ensure your account is linked to a boutique.');
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

        return successResponse(res, 201, 'Product created successfully', product);

    } catch (error) {
        console.error(error);
        return errorResponse(res, 500, 'An unexpected server error occurred while creating the product. Please try again later.');
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
                return errorResponse(res, 403, 'No store was found for the authenticated user.');
            }

            const product = await Product.findOne({ _id: req.params.id, boutique: boutique._id }).select();

            if (!product) {
                return errorResponse(res, 404, 'The requested product was not found in your store. Please verify the identifier.');
            }

            return successResponse(res, 200, null, product);
        }


        const product = await Product.findById(req.params.id).select();

        if (!product) {
            return errorResponse(res, 404, 'The requested product was not found. Please verify the identifier.');
        }

        if (user && user.role === 'user') {
            try {
                const wishlistExists = await Wishlist.findOne({ user: user._id, 'products.product': product._id }).select('_id');
                const productObj = product.toObject();
                productObj.isMyWishlist = !!wishlistExists;
                return successResponse(res, 200, null, productObj);
            } catch (err) {
                console.error('Wishlist lookup failed:', err);
                return successResponse(res, 200, null, product);
            }
        }

        return successResponse(res, 200, null, product);
    } catch (error) {
        return errorResponse(res, 400, 'The provided product identifier is invalid. Please check and try again.');
    }
};





/**
 * GET /api/products
 * Lister tous les produits
 */
exports.getAllProducts = async (req, res) => {
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
                return errorResponse(res, 400, 'The product name is invalid. It must be a string with at least 3 characters.');
            }
            payload.name = name.trim();
        }

        // Category
        if (category !== undefined) {
            if (!category || typeof category !== 'string') {
                return errorResponse(res, 400, 'The category is invalid. Please provide a valid category identifier.');
            }
            payload.category = category;
        }

        // Regular Price
        if (regularPrice !== undefined) {
            const regPrice = Number(regularPrice);
            if (isNaN(regPrice) || regPrice <= 0) {
                return errorResponse(res, 400, 'The regular price is invalid. Please provide a positive number.');
            }
            payload.regularPrice = regPrice;

            // If salePrice provided, validate it against regPrice or existing product regularPrice
            if (salePrice !== undefined && salePrice !== '') {
                const sale = Number(salePrice);
                if (isNaN(sale) || sale < 0 || sale >= regPrice) {
                    return errorResponse(res, 400, 'The sale price is invalid. It must be a non-negative number strictly less than the regular price.');
                }
                payload.salePrice = sale;
            }
        } else if (salePrice !== undefined) {
            // regularPrice not provided, need to check against existing product
            const existing = await Product.findById(req.params.id).select('regularPrice');
            if (!existing) return errorResponse(res, 404, 'The requested product was not found. Please verify the identifier.');
            const baseReg = existing.regularPrice;
            const sale = Number(salePrice);
            if (isNaN(sale) || sale < 0 || sale >= baseReg) {
                return errorResponse(res, 400, 'The sale price is invalid. It must be a non-negative number strictly less than the regular price.');
            }
            payload.salePrice = sale;
        }

        // min/max qty
        if (minOrderQty !== undefined) {
            const minQty = Number(minOrderQty);
            if (isNaN(minQty) || minQty <= 0) return errorResponse(res, 400, 'The minimum order quantity is invalid. Please provide a positive integer.');
            payload.minOrderQty = minQty;
        }

        if (maxOrderQty !== undefined) {
            const maxQty = Number(maxOrderQty);
            if (isNaN(maxQty) || maxQty < (payload.minOrderQty ?? 1)) return errorResponse(res, 400, 'The maximum order quantity is invalid. It must be greater than or equal to the minimum order quantity.');
            payload.maxOrderQty = maxQty;
        }

        // description
        if (description !== undefined) {
            if (description && typeof description !== 'string') return errorResponse(res, 400, 'The product description is invalid. Please provide a textual description.');
            payload.description = description ? description.trim() : '';
        }

        // tags
        if (tags !== undefined) {
            let parsedTags = [];
            if (tags) {
                try {
                    parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
                    if (!Array.isArray(parsedTags)) return errorResponse(res, 400, 'Tags must be an array of strings.');
                } catch {
                    return errorResponse(res, 400, 'Tags format is invalid. Please provide a JSON array of strings.');
                }
            }
            payload.tags = parsedTags;
        }

        // images
        if (images !== undefined) {
            if (!images || !Array.isArray(images) || images.length === 0) return errorResponse(res, 400, 'At least one product image is required. Please upload or provide an image.');
            payload.images = images;
        }

        // sku: if not provided (undefined or null), generate from name or existing name
        if (sku === undefined || sku === null) {
            const baseName = payload.name || (await Product.findById(req.params.id).select('name')).name;
            payload.sku = generateSku(baseName);
        } else {
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
            return errorResponse(res, 404, 'The requested product was not found. Please verify the identifier.');
        }

        return successResponse(res, 200, 'Product updated successfully', product);

    } catch (error) {
        console.error(error);
        return errorResponse(res, 400, 'An error occurred while updating the product. Please check your input and try again.');
    }
};


/**
 * POST /api/products/share
 * Share a product to another user by creating a notification
 * Body: { productId, userId, additionalMessage }
 */
exports.shareProduct = async (req, res) => {
    try {
        const sender = req.user;
        const { productId, userId, additionalMessage } = req.body;

        // Basic validation
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return errorResponse(res, 400, 'The provided product identifier is invalid. Please check and try again.');
        }
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return errorResponse(res, 400, 'The provided recipient identifier is invalid. Please check and try again.');
        }

        // Load product and boutique info
        const product = await Product.findById(productId).select('name boutique');
        if (!product) {
            return errorResponse(res, 404, 'The referenced product could not be found. Please verify the product identifier.');
        }

        const boutique = await Boutique.findById(product.boutique).select('name');

        let senderName = sender?.email || 'A user';
        try {
            const profile = await UserProfile.findOne({ user: sender._id }).select('firstName lastName');
            if (profile && (profile.firstName || profile.lastName)) {
                senderName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
            }
        } catch (e) {
            // ignore and fallback to sender.email
        }

        // Compose message (HTML allowed)
        let message = `${senderName} wants you to view this product <strong>${product.name}</strong>`;
        if (boutique && boutique.name) {
            message += ` from store <strong>${boutique.name}</strong>.`;
        } else {
            message += '.';
        }

        if (additionalMessage && typeof additionalMessage === 'string' && additionalMessage.trim().length > 0) {
            message += `<br/><br/>${additionalMessage.trim()}`;
        }

        // Send notification (fire-and-forget style, service logs errors)
        sendNotification({
            recipient: userId,
            channel: 'message',
            type: 'product_shared',
            title: 'A product has been shared with you',
            message,
            payload: { productId: product._id, boutiqueId: product.boutique },
            url: boutique ? `/v1/stores/${boutique._id}/products/${product._id}` : `/v1/products/${product._id}`,
            severity: 'info'
        }).catch(err => console.error('Notification failed', err));

        return successResponse(res, 200, 'Product share notification sent successfully.');
    } catch (error) {
        console.error('Share product error:', error);
        return errorResponse(res, 500, 'An unexpected error occurred while sharing the product. Please try again later.');
    }
};
