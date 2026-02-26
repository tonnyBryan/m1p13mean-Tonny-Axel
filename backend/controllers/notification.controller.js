const { successResponse, errorResponse } = require('../utils/apiResponse');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

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

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
    const notifId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(notifId)) {
        return errorResponse(res, 400, 'The provided identifier is invalid. Please check and try again.');
    }

    try {
        const notification = await Notification.findById(notifId);
        if (!notification) {
            return errorResponse(res, 404, 'Notification not found. It may have been removed.');
        }

        // Ensure only recipient or authorized roles can mark as read
        if (String(notification.recipient) !== String(req.user._id)) {
            return errorResponse(res, 403, 'You do not have permission to modify this notification.');
        }

        notification.isRead = true;
        await notification.save();

        return successResponse(res, 200, 'Notification marked as read successfully.', notification);
    } catch (err) {
        console.error('markAsRead error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred while marking the notification as read. Please try again later.');
    }
};

// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user && req.user._id ? req.user._id : null;
        if (!userId) {
            return errorResponse(res, 400, 'Unable to identify the current user. Please re-authenticate and try again.');
        }

        const result = await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });

        return successResponse(res, 200, `All notifications marked as read. ${result.modifiedCount} item(s) updated.`, { modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error('markAllAsRead error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred while marking all notifications as read. Please try again later.');
    }
};
