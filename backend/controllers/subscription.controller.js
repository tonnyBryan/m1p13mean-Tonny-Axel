const Subscription = require('../models/Subscription');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * POST /api/subscriptions/subscribe
 * Body: { email }
 */
exports.subscribe = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return errorResponse(res, 400, 'An email address is required. Please provide a valid email.');
        }

        // Check if already subscribed
        const existing = await Subscription.findOne({ email: email.toLowerCase() });
        if (existing) {
            return errorResponse(res, 400, 'This email address is already subscribed to our mailing list.');
        }

        const sub = await Subscription.create({ email });

        return successResponse(res, 201, 'Thank you — your email address has been successfully added to our mailing list.', sub);
    } catch (error) {
        console.error('Subscription error:', error);
        // Handle duplicate key error more gracefully
        if (error.code === 11000) {
            return errorResponse(res, 400, 'This email address is already subscribed to our mailing list.');
        }
        return errorResponse(res, 500, 'We were unable to complete your subscription at this time. Please try again later.');
    }
};

/**
 * GET /api/subscriptions
 * Protected, admin only
 * NOTE: This controller now uses res.advancedResults provided by the advancedResults middleware
 */
exports.getAllSubscriptions = async (req, res) => {
    return successResponse(res, 200, 'Subscriptions list retrieved successfully.', res.advancedResults);
};
