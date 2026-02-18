const { successResponse, errorResponse } = require('../utils/apiResponse');

// GET /api/notifications
exports.getAllNotifications = async (req, res) => {
    try {
        const advanced = res.advancedResults || null;

        return successResponse(res, 200, null, advanced);
    } catch (err) {
        console.error('getAllNotifications error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred while retrieving notifications. Please try again later.');
    }
};
