const { successResponse, errorResponse } = require('../utils/apiResponse');
const Notification = require('../models/Notification');

// GET /api/notifications
exports.getAllNotifications = async (req, res) => {
    try {
        const advanced = res.advancedResults || null;

        const userId = req.user && req.user._id ? req.user._id : null;
        let totalUnread = 0;
        if (userId) {
            totalUnread = await Notification.countDocuments({ recipient: userId, isRead: false });
        }

        const payload = {
            advanced,
            totalUnread
        };

        return successResponse(res, 200, null, payload);
    } catch (err) {
        console.error('getAllNotifications error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred while retrieving notifications. Please try again later.');
    }
};
