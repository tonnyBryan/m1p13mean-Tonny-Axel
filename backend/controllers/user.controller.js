const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Boutique = require('../models/Boutique');



/**
 * GET /api/users
 * Lister tous les utilisateurs
 */
exports.getAllUsers = async (req, res, next) => {
    return successResponse(res, 200, null, res.advancedResults);
};


exports.getMyParentProfile = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        // Start from the already authenticated user injected by auth middleware
        const currentUser = req.user || {};

        let avatar = null;
        let isValidated = null;
        if (currentUser.role === 'boutique') {
            const boutique = await Boutique.findOne({ owner: userId }).select('logo isValidated');
            avatar = boutique?.logo ?? null;
            isValidated = boutique?.isValidated ?? null;
        } else if (currentUser.role === 'user') {
            const profile = await UserProfile.findOne({ user: userId }).select('photo');
            avatar = profile?.photo ?? null;
        }

        // Return the user object enriched with avatar (keeps existing user fields)
        const payload = { ...currentUser, avatar, isValidated };
        return successResponse(res, 200, null, payload);
    } catch (error) {
        console.error(error);
        return errorResponse(res, 400, 'An error occurred while fetching the profile. Please try again.');
    }
};


/**
 * GET /api/users/me/info
 * Récupérer les infos de base de l'utilisateur connecté (name, email, role, avatar)
 */
exports.getMe = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const role = req.user.role;

        const user = await User.findById(userId).select('name email role createdAt');
        if (!user) return errorResponse(res, 404, 'User not found');

        let avatar = null;
        let displayName = user.name;

        if (role === 'user') {
            const profile = await UserProfile.findOne({ user: userId }).select('photo firstName lastName');
            avatar = profile?.photo ?? null;
            displayName = profile ? `${profile.firstName} ${profile.lastName}` : user.name;
        }

        if (role === 'boutique') {
            const boutique = await Boutique.findOne({ owner: userId }).select('logo');
            avatar = boutique?.logo ?? null;
        }

        return successResponse(res, 200, null, {
            name: displayName,
            email: user.email,
            role: user.role,
            avatar,
            createdAt: user.createdAt
        });

    } catch (error) {
        return errorResponse(res, 400, 'Failed to fetch user info');
    }
};


/**
 * GET /api/users/me/profile
 * Récupérer le profil de l'utilisateur connecté
 */
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const profile = await UserProfile.findOne({ user: userId });

        if (!profile) {
            return successResponse(res, 200, 'Profile not found', null);
        }

        return successResponse(res, 200, null, profile);
    } catch (error) {
        console.error(error);
        return errorResponse(res, 400, 'An error occurred while fetching the profile. Please try again.');
    }
};

/**
 * GET /api/users/:id
 * Récupérer un utilisateur par ID
 */
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return errorResponse(res, 404, 'The requested user was not found. Please verify the identifier and try again.');
        }

        return successResponse(res, 200, null, user);
    } catch (error) {
        return errorResponse(res, 400, 'The provided user identifier is invalid. Please check and try again.');
    }
};

/**
 * POST /api/users
 * Créer un utilisateur
 */
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // 1️⃣ Vérification basique
        if (!name || !email || !password) {
            return errorResponse(res, 400, 'Name, email and password are required. Please provide all required fields.');
        }

        // 2️⃣ Vérifier si email existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse(res, 400, 'The provided email address is already in use. Please use a different email.');
        }

        // 3️⃣ Hash du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4️⃣ Création utilisateur
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        // 5️⃣ Réponse uniforme
        return successResponse(res, 201, 'User account created successfully', {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });

    } catch (error) {
        return errorResponse(res, 400, 'An error occurred while creating the user. Please check your input and try again.');
    }
};


/**
 * PUT /api/users/:id
 * Mettre à jour un utilisateur
 */
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return errorResponse(res, 404, 'The requested user was not found. Please verify the identifier and try again.');
        }

        return successResponse(res, 200, 'User updated successfully', user);

    } catch (error) {
        return errorResponse(res, 400, 'An error occurred while updating the user. Please check your input and try again.');
    }
};


/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur
 */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return errorResponse(res, 404, 'The requested user was not found.');
        }

        return successResponse(res, 200, 'User deleted successfully', null);

    } catch (error) {
        return errorResponse(res, 400, 'An error occurred while deleting the user. Please try again.');
    }
};


/**
 * PUT /api/users/me/profile
 * Create or update the profile of the logged user
 */
exports.upsertMyProfile = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const payload = req.body || {};

        // Ensure the user field is set and cannot be changed by payload
        payload.user = userId;

        const profile = await UserProfile.findOneAndUpdate(
            { user: userId },
            { $set: payload },
            { new: true, upsert: true, runValidators: true }
        );

        return successResponse(res, 200, 'Profile saved successfully', profile);
    } catch (error) {
        console.error(error);
        return errorResponse(res, 400, 'An error occurred while saving the profile. Please check your input and try again.');
    }
};

/**
 * POST /api/users/me/profile/addresses
 * Add a new address to the user's profile
 */
exports.addAddress = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const newAddress = req.body;

        if (!newAddress) {
            return errorResponse(res, 400, 'Address data is required. Please provide address details.');
        }

        if (newAddress.isDefault === true) {
            await UserProfile.updateOne(
                { user: userId },
                { $set: { "addresses.$[].isDefault": false } }
            );
        }

        const profile = await UserProfile.findOneAndUpdate(
            { user: userId },
            { $push: { addresses: newAddress } },
            { new: true, upsert: true }
        );

        return successResponse(res, 200, 'Address added successfully', profile);
    } catch (error) {
        console.error("Error :", error);
        return errorResponse(res, 500, 'An unexpected server error occurred while adding the address. Please try again later.');
    }
};

/**
 * DELETE /api/users/me/profile/addresses/:addressId
 * Remove an address from the user's profile by address _id
 */
exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { addressId } = req.params;

        if (!addressId) {
            return errorResponse(res, 400, 'Address id is required.');
        }

        const profile = await UserProfile.findOneAndUpdate(
            { user: userId },
            { $pull: { addresses: { _id: addressId } } },
            { new: true }
        );

        if (!profile) {
            return errorResponse(res, 404, 'User profile not found.');
        }

        const hasDefault = profile.addresses.some(addr => addr.isDefault === true);

        if (profile.addresses.length > 0 && !hasDefault) {
            profile.addresses[0].isDefault = true;
            await profile.save();
        }

        return successResponse(res, 200, 'Address removed successfully', profile);
    } catch (error) {
        console.error(error);
        return errorResponse(res, 500, 'An unexpected server error occurred while removing the address. Please try again later.');
    }
};

/**
 * GET /api/users/profile/:id
 * Récupérer le profil d'un utilisateur par ID de l'utilisateur (Admin)
 */
exports.getUserProfileById = async (req, res) => {
    try {
        // The ID in params is the User ID, not the Profile ID
        let profile = await UserProfile.findOne({ user: req.params.id }).populate('user', 'name email role isActive');

        if (!profile) {
            // Check if the user exists at all
            const user = await User.findById(req.params.id).select('name email role isActive');
            if (user) {
                return successResponse(res, 200, 'User found (no profile skeleton)', {
                    user,
                    firstName: user.name.split(' ')[0] || '',
                    lastName: user.name.split(' ').slice(1).join(' ') || '',
                    addresses: [],
                    description: ''
                });
            }
            return errorResponse(res, 404, 'Profile or User not found');
        }

        return successResponse(res, 200, 'Profile retrieved successfully', profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.kind === 'ObjectId') {
            return errorResponse(res, 400, 'The provided identifier is invalid. Please check and try again.');
        }
        return errorResponse(res, 500, 'An unexpected server error occurred while fetching the profile. Please try again later.');
    }
};
/**
 * PATCH /api/users/:id/status
 * Toggle or set user isActive status (Admin)
 */
exports.toggleUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return errorResponse(res, 404, 'The requested user was not found.');
        }

        user.isActive = isActive !== undefined ? isActive : !user.isActive;
        await user.save();

        return successResponse(res, 200, `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`, {
            id: user._id,
            isActive: user.isActive
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        return errorResponse(res, 500, 'An unexpected server error occurred while updating the user status. Please try again later.');
    }
};

/**
 * GET /api/users/search
 * Search users by name, email, firstName or lastName (limit 10)
 */
exports.searchUsers = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) {
            return errorResponse(
                res,
                400,
                'Search query is required. Please provide a name, email or other keyword to search.'
            );
        }

        const currentUserId = new mongoose.Types.ObjectId(req.user._id);
        const regex = { $regex: q, $options: 'i' };

        const pipeline = [
            // Exclure l'utilisateur connecté + filtrer role=user
            {
                $match: {
                    _id: { $ne: currentUserId },
                    role: 'user',
                    isActive: true
                }
            },
            {
                $lookup: {
                    from: 'userprofiles',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'profile'
                }
            },
            {
                $unwind: {
                    path: '$profile',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    $or: [
                        { name: regex },
                        { email: regex },
                        { 'profile.firstName': regex },
                        { 'profile.lastName': regex }
                    ]
                }
            },
            {
                $project: {
                    password: 0
                }
            },
            { $limit: 11 } // on récupère 11 pour savoir s'il y a plus que 10
        ];

        const results = await User.aggregate(pipeline);

        const tooMany = results.length > 10;
        const items = results.slice(0, 10).map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            profile: u.profile
                ? {
                    firstName: u.profile.firstName,
                    lastName: u.profile.lastName,
                    photo: u.profile.photo || null
                }
                : null
        }));

        const message =
            items.length === 0
                ? 'No users were found matching your search. Please refine your query and try again.'
                : null;

        return successResponse(res, 200, message, { items, tooMany });
    } catch (error) {
        console.error('User search error:', error);
        return errorResponse(
            res,
            500,
            'An unexpected server error occurred while searching users. Please try again later.'
        );
    }
};
