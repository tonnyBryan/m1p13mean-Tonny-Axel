const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return errorResponse(res, 400, 'Email, mot de passe et rôle sont obligatoires');
        }

        const user = await User.findOne({ email, role });

        if (!user) {
            return errorResponse(res, 401, 'Identifiants invalides');
        }

        if (!user.isActive) {
            return errorResponse(res, 403, 'Compte désactivé');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return errorResponse(res, 401, 'Identifiants invalides');
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        return successResponse(res, 200, 'Connexion réussie', {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        return errorResponse(res, 500, 'Erreur lors du login');
    }
};