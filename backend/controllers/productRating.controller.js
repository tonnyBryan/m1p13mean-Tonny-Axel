const { successResponse, errorResponse } = require('../utils/apiResponse');
const Product = require('../models/Product');
const ProductRating = require('../models/ProductRating');
const Vente = require('../models/Vente');
const UserProfile = require('../models/UserProfile');

/**
 * POST /api/product-ratings/:productId
 * Add a rating for a product by the authenticated user
 */
exports.addRating = async (req, res) => {
    try {
        const user = req.user;
        const { productId } = req.params;
        const { rating, comment } = req.body;

        if (!rating && rating !== 0) {
            return errorResponse(res, 400, 'The rating value is required and must be between 1 and 5.');
        }
        const r = Number(rating);
        if (isNaN(r) || r < 1 || r > 5) {
            return errorResponse(res, 400, 'The rating value is invalid. Please provide an integer between 1 and 5.');
        }

        if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
            return errorResponse(res, 400, 'The comment is required and must contain at least 3 characters.');
        }

        // Check product exists
        const product = await Product.findById(productId).select('_id');
        if (!product) {
            return errorResponse(res, 404, 'The referenced product could not be found. Please verify the product identifier.');
        }

        // Ensure the user has purchased (and paid) this product before allowing a rating
        const purchase = await Vente.findOne({ 'client._id': user._id, status: 'paid', 'items.product': productId }).select('_id');
        if (!purchase) {
            return errorResponse(res, 403, 'You may only submit a rating for products you have purchased and paid for.');
        }

        // Check if user already rated this product
        const existing = await ProductRating.findOne({ product: productId, user: user._id }).select('_id');
        if (existing) {
            return errorResponse(res, 409, 'You have already submitted a rating for this product. A single rating per product is allowed.');
        }

        const newRating = await ProductRating.create({
            product: productId,
            user: user._id,
            rating: r,
            comment: comment.trim()
        });

        const prodStats = await Product.findById(productId).select('avgRating totalRatings').lean();
        const avg = prodStats && typeof prodStats.avgRating !== 'undefined' ? prodStats.avgRating : 0;
        const total = prodStats && typeof prodStats.totalRatings !== 'undefined' ? prodStats.totalRatings : 0;

        return successResponse(res, 201, 'Rating added successfully.', { rating: newRating, avgRating: avg, totalRatings: total });
    } catch (error) {
        console.error('Add rating error:', error);
        // Handle unique index violation more gracefully
        if (error && error.code === 11000) {
            return errorResponse(res, 409, 'A rating for this product by you already exists.');
        }

        return errorResponse(res, 500, 'An unexpected server error occurred while adding the rating. Please try again later.');
    }
};

/**
 * DELETE /api/product-ratings/:productId
 * Remove rating for the authenticated user on the given product
 */
exports.removeRating = async (req, res) => {
    try {
        const user = req.user;
        const { productId } = req.params;

        const deleted = await ProductRating.findOneAndDelete({ product: productId, user: user._id });
        if (!deleted) {
            return errorResponse(res, 404, 'No rating was found for this product by the current user.');
        }

        const prodStats = await Product.findById(productId).select('avgRating totalRatings').lean();
        const avg = prodStats && typeof prodStats.avgRating !== 'undefined' ? prodStats.avgRating : 0;
        const total = prodStats && typeof prodStats.totalRatings !== 'undefined' ? prodStats.totalRatings : 0;

        return successResponse(res, 200, 'Rating removed successfully.', { avgRating: avg, totalRatings: total });
    } catch (error) {
        console.error('Remove rating error:', error);
        return errorResponse(res, 500, 'An unexpected server error occurred while removing the rating. Please try again later.');
    }
};

/**
 * GET /api/product-ratings/product/:productId
 * Return results populated by advancedResults middleware (controller just returns the middleware payload)
 */
exports.getRatingsByProduct = async (req, res) => {
    try {
        const adv = res.advancedResults || { items: [] };

        if (adv.items && Array.isArray(adv.items) && adv.items.length > 0) {
            for (let i = 0; i < adv.items.length; i++) {
                const item = adv.items[i];

                let userId = item.user;
                if (!userId) {
                    console.error('Get ratings error: missing user reference on rating item', item);
                    return errorResponse(res, 500, 'A system error occurred: a rating item is missing its related user. Please contact support.');
                }

                const profile = await UserProfile.findOne({ user: userId }).select('firstName lastName photo').lean();
                if (!profile) {
                    console.error('Get ratings error: missing user profile for user', userId);
                    return errorResponse(res, 500, 'A system error occurred: a user profile was not found for a related user. Please contact support.');
                }

                let plain = item.toObject();

                plain.userInfo = {
                    firstName: profile.firstName || null,
                    lastName: profile.lastName || null,
                    photo: profile.photo || null
                };

                adv.items[i] = plain;
            }
        }

        return successResponse(res, 200, null, res.advancedResults);
    } catch (error) {
        console.error('Get ratings error:', error);
        return errorResponse(res, 500, 'An unexpected server error occurred while fetching ratings. Please try again later.');
    }
};
