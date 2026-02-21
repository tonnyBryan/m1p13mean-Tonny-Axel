const SupportRequest = require('../models/SupportRequest');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * POST /api/support-requests/submit
 * Body: { fullName, subject, email, message }
 */
exports.submit = async (req, res) => {
    try {
        const { fullName, subject, email, message } = req.body;

        if (!fullName || !subject || !email || !message) {
            return errorResponse(res, 400, 'All fields are required: fullName, subject, email and message.');
        }

        const request = await SupportRequest.create({ fullName, subject, email, message });

        return successResponse(res, 201, 'Your support request has been received. Our team will contact you shortly.', request);
    } catch (error) {
        console.error('Support request error:', error);
        return errorResponse(res, 500, 'Unable to submit your request at this time. Please try again later.');
    }
};

/**
 * GET /api/support-requests
 * Protected, admin only
 */
exports.getAllSupportRequests = async (req, res) => {
    return successResponse(res, 200, 'Support requests retrieved successfully.', res.advancedResults);
};

/**
 * GET /api/support-requests/:id
 * Protected, admin only
 */
exports.getSupportRequestById = async (req, res) => {
    try {
        const id = req.params.id;
        const request = await SupportRequest.findById(id).lean();
        if (!request) {
            return errorResponse(res, 404, 'Support request not found.');
        }
        return successResponse(res, 200, 'Support request retrieved successfully.', request);
    } catch (error) {
        console.error('getSupportRequestById error:', error);
        return errorResponse(res, 500, 'Unable to fetch the support request at this time. Please try again later.');
    }
};
