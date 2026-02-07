const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * GET /api/user-profiles
 * Get all user profiles with filtering/pagination (Admin only)
 */
exports.getAllProfiles = async (req, res) => {
    if (!res.advancedResults) {
        return errorResponse(res, 500, 'Advanced Results Middleware not running');
    }
    return successResponse(res, 200, 'User profiles retrieved successfully', res.advancedResults);
};

/**
 * GET /api/user-profiles/:id
 * Get a single profile by ID (Admin or the user itself)
 */
exports.getProfileById = async (req, res) => {
    try {
        const profile = await UserProfile.findById(req.params.id).populate('user', 'name email role isActive');

        if (!profile) {
            return errorResponse(res, 404, 'Profile not found');
        }

        // Security check: Only admin or the user owner can see the full profile details if requested via this endpoint
        // For simpler admin management, we usually allow admins to see everything.
        if (req.user.role !== 'admin' && profile.user._id.toString() !== req.user._id.toString()) {
            return errorResponse(res, 403, 'Not authorized to view this profile');
        }

        return successResponse(res, 200, 'Profile retrieved successfully', profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.kind === 'ObjectId') {
            return errorResponse(res, 400, 'Invalid profile ID format');
        }
        return errorResponse(res, 500, 'Server Error while fetching profile');
    }
};
