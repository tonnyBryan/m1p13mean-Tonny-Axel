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
        return errorResponse(res, 401, 'Unauthorized access, missing token');
    }

    try {
        // 3️⃣ Vérification du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4️⃣ Charger l'utilisateur
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return errorResponse(res, 401, 'Invalid user');
        }

        if (!user.isActive) {
            return errorResponse(res, 403, 'Account disabled');
        }

        // 5️⃣ Injecter l'utilisateur dans la requête
        req.user = user;

        next();
    } catch (error) {
        console.log("error = " + error.name)
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, 420, 'ACCESS_TOKEN_EXPIRED');
        }

        return errorResponse(res, 401, 'Invalid or expired token');
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return errorResponse(
                res,
                403,
                'Access denied: insufficient permissions'
            );
        }
        next();
    };
};
