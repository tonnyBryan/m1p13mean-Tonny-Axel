const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Boutique = require('../models/Boutique');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create or get wishlist for a user
exports.addToWishlist = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'You must be authenticated to perform this action.');

        // product id comes from URL param now
        const productId = req.params && req.params.productId;
        if (!productId) return errorResponse(res, 400, 'Product identifier is required as a URL parameter.');

        // ensure product exists and get its boutique
        const product = await Product.findById(productId);
        if (!product) return errorResponse(res, 404, 'The requested product could not be found.');

        const boutiqueId = product.boutique;
        if (!boutiqueId) return errorResponse(res, 500, 'Unable to determine the boutique associated with the product.');

        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = await Wishlist.create({ user: userId, products: [] });
        }

        // if product already in wishlist for same boutique, do not duplicate
        const exists = wishlist.products.find(p => p.product.toString() === productId && p.boutique.toString() === boutiqueId.toString());
        if (exists) return successResponse(res, 200, 'This product is already in your wishlist.', wishlist);

        wishlist.products.push({ product: productId, boutique: boutiqueId });
        await wishlist.save();

        return successResponse(res, 201, 'Product has been successfully added to your wishlist.', wishlist);
    } catch (err) {
        console.error(err);
        return errorResponse(res, 500, 'An error occurred while adding the product to your wishlist. Please try again later.');
    }
};

// Remove product from wishlist
exports.removeToWishlist = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'You must be authenticated to perform this action.');

        // product id comes from URL param now
        const productId = req.params && req.params.productId;
        if (!productId) return errorResponse(res, 400, 'Product identifier is required as a URL parameter.');

        const product = await Product.findById(productId);
        if (!product) return errorResponse(res, 404, 'The requested product could not be found.');

        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) return errorResponse(res, 404, 'No wishlist found for this user.');

        const initialLen = wishlist.products.length;
        // remove any wishlist entries that match the product id regardless of boutique
        wishlist.products = wishlist.products.filter(p => p.product.toString() !== productId);

        if (wishlist.products.length === initialLen) return errorResponse(res, 404, 'The product is not present in your wishlist.');

        await wishlist.save();
        return successResponse(res, 200, 'Product has been removed from your wishlist.', wishlist);
    } catch (err) {
        console.error(err);
        return errorResponse(res, 500, 'An error occurred while removing the product from your wishlist. Please try again later.');
    }
};

// Get current user's wishlist and populate product and boutique
exports.getMyWishlist = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'You must be authenticated to perform this action.');

        const wishlist = await Wishlist.findOne({ user: userId })
            .populate({ path: 'products.product', model: 'Product' })
            .populate({ path: 'products.boutique', model: 'Boutique' });

        if (!wishlist) return successResponse(res, 200, 'Your wishlist is empty.', { products: [] });

        return successResponse(res, 200, 'Wishlist retrieved successfully.', wishlist);
    } catch (err) {
        console.error(err);
        return errorResponse(res, 500, 'An error occurred while retrieving your wishlist. Please try again later.');
    }
};
