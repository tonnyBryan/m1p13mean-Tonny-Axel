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
            tags
        } = req.body;

        if (!name || !regularPrice) {
            return errorResponse(res, 400, 'Missing required fields');
        }

        if (!req.files || req.files.length === 0) {
            return errorResponse(res, 400, 'At least one image is required');
        }

        const parsedTags = tags ? JSON.parse(tags) : [];

        const uploadedImages = await Promise.all(
            req.files.map(file => uploadImage(file.buffer, 'products'))
        );

        const imageUrls = uploadedImages.map(img => img.secure_url);
        console.log(imageUrls)

        const product = await Product.create({
            boutique: "haha",
            name,
            description,
            regularPrice: Number(regularPrice),
            salePrice: salePrice ? Number(salePrice) : null,
            tags: parsedTags,
            image: imageUrls,
            isActive: true
        });

        return successResponse(res, 201, 'Product successfully created', product);

    } catch (error) {
        console.error(error);
        return errorResponse(res, 500, 'Error while creating product');
    }
};