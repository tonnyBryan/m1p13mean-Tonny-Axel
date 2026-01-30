const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const bcrypt = require('bcryptjs');



/**
 * GET /api/users
 * Lister tous les utilisateurs
 */
exports.getAllUsers = async (req, res, next) => {
    // res.status(200).json(res.advancedResults);
    return successResponse(res, 200, null, res.advancedResults);
};


/**
 * GET /api/users/:id
 * Récupérer un utilisateur par ID
 */
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return errorResponse(res, 404, 'Utilisateur non trouvé');
        }

        return successResponse(res, 200, null, user);
    } catch (error) {
        return errorResponse(res, 400, 'ID invalide');
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
            return errorResponse(res, 400, 'Champs obligatoires manquants');
        }

        // 2️⃣ Vérifier si email existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse(res, 400, 'Email déjà utilisé');
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
        return successResponse(res, 201, 'Utilisateur créé avec succès', {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });

    } catch (error) {
        return errorResponse(res, 400, 'Erreur lors de la création');
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
            return errorResponse(res, 404, 'Utilisateur non trouvé');
        }

        return successResponse(res, 200, 'Utilisateur mis à jour', user);

    } catch (error) {
        return errorResponse(res, 400, 'Erreur lors de la mise à jour');
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
            return errorResponse(res, 404, 'Utilisateur non trouvé');
        }

        return successResponse(res, 200, 'Utilisateur supprimé', null);

    } catch (error) {
        return errorResponse(res, 400, 'Erreur lors de la suppression');
    }
};
