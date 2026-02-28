const mongoose = require('mongoose');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * POST /api/system/reset-data
 * Reset system data (admin only)
 */
exports.resetData = async (req, res) => {
    try {
        const collections = mongoose.connection.collections;
        const deleteOps = [];

        for (const [name, collection] of Object.entries(collections)) {
            if (name === 'centrecommercials') continue;

            if (name === 'users') {
                deleteOps.push(collection.deleteMany({ role: { $ne: 'admin' } }));
            } else {
                deleteOps.push(collection.deleteMany({}));
            }
        }

        await Promise.all(deleteOps);
        return successResponse(res, 200, 'System data reset completed successfully.');
    } catch (error) {
        console.error('Error resetting system data:', error);
        return errorResponse(res, 500, 'An unexpected error occurred while resetting system data.');
    }
};
