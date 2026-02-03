const { successResponse, errorResponse } = require('../utils/apiResponse');
const Product = require("../models/Product");

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
            tags,
            images
        } = req.body;

        // 🔎 Basic validation
        if (!name || !regularPrice) {
            return errorResponse(res, 400, 'Missing required fields');
        }

        const product = await Product.create({
            boutique: "haha",
            name,
            description,
            regularPrice,
            salePrice,
            tags
        });

        return successResponse(res, 201, 'Product payload received', {
            id: product._id,
            name: product.name,
        });

    } catch (error) {
        console.error(error);
        return errorResponse(res, 400, 'Error while creating product');
    }
};
