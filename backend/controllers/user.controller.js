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
