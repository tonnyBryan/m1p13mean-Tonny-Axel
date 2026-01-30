const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

exports.protect = async (req, res, next) => {
    let token;

    // 1️⃣ Récupération du token depuis le header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2️⃣ Token absent
    if (!token) {
        return errorResponse(res, 401, 'Accès non autorisé, token manquant');
    }

    try {
        // 3️⃣ Vérification du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4️⃣ Charger l'utilisateur
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return errorResponse(res, 401, 'Utilisateur non valide');
        }

        if (!user.isActive) {
            return errorResponse(res, 403, 'Compte désactivé');
        }

        // 5️⃣ Injecter l'utilisateur dans la requête
        req.user = user;

        next();
    } catch (error) {
        return errorResponse(res, 401, 'Token invalide ou expiré');
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return errorResponse(
                res,
                403,
                'Accès refusé : permissions insuffisantes'
            );
        }
        next();
    };
};

