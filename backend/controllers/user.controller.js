const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const bcrypt = require('bcryptjs');



/**
 * GET /api/users
 * Lister tous les utilisateurs
 */
exports.getAllUsers = async (req, res, next) => {
    return successResponse(res, 200, null, res.advancedResults);
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
        return errorResponse(res, 400, 'Error fetching profile');
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
            return errorResponse(res, 404, 'User not found');
        }

        return successResponse(res, 200, null, user);
    } catch (error) {
        return errorResponse(res, 400, 'Invalid ID');
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
            return errorResponse(res, 400, 'Missing required fields');
        }

        // 2️⃣ Vérifier si email existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse(res, 400, 'Email already used');
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
        return successResponse(res, 201, 'User successfully created', {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });

    } catch (error) {
        return errorResponse(res, 400, 'Error during creation');
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
            return errorResponse(res, 404, 'User not found');
        }

        return successResponse(res, 200, 'User updated', user);

    } catch (error) {
        return errorResponse(res, 400, 'Error during update');
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
            return errorResponse(res, 404, 'User not found');
        }

        return successResponse(res, 200, 'User deleted', null);

    } catch (error) {
        return errorResponse(res, 400, 'Error during deletion');
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

        return successResponse(res, 200, 'Profile saved', profile);
    } catch (error) {
        console.error(error);
        return errorResponse(res, 400, 'Error saving profile');
    }
};

/**
 * POST /api/users/me/profile/addresses
 * Add a new address to the user's profile
 */
exports.addAddress = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const address = req.body;

        if (!address) {
            return errorResponse(res, 400, 'Address data required');
        }

        const profile = await UserProfile.findOneAndUpdate(
            { user: userId },
            { $push: { addresses: address } },
            { new: true, upsert: true }
        );

        return successResponse(res, 200, 'Address added', profile);
    } catch (error) {
        console.error(error);
        return errorResponse(res, 400, 'Error adding address');
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

        console.log("id add = " + addressId)

        if (!addressId) {
            return errorResponse(res, 400, 'Address id required');
        }

        // Pull the subdocument by its _id
        const profile = await UserProfile.findOneAndUpdate(
            { user: userId },
            { $pull: { addresses: { _id: addressId } } },
            { new: true }
        );

        console.log(profile);

        if (!profile) {
            return errorResponse(res, 404, 'Profile not found');
        }

        return successResponse(res, 200, 'Address removed', profile);
    } catch (error) {
        console.error(error);
        return errorResponse(res, 400, 'Error removing address');
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
            return errorResponse(res, 400, 'Invalid ID format');
        }
        return errorResponse(res, 500, 'Server Error while fetching profile');
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
            return errorResponse(res, 404, 'User not found');
        }

        user.isActive = isActive !== undefined ? isActive : !user.isActive;
        await user.save();

        return successResponse(res, 200, `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`, {
            id: user._id,
            isActive: user.isActive
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        return errorResponse(res, 500, 'Server Error while updating user status');
    }
};
