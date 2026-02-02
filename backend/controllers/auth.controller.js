const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const RefreshToken = require('../models/RefreshToken');
const crypto = require('crypto');

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return errorResponse(res, 400, 'Email, mot de passe et rôle sont obligatoires');
        }

        const user = await User.findOne({ email, role });
        if (!user || !user.isActive) {
            return errorResponse(res, 401, 'Identifiants invalides');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return errorResponse(res, 401, 'Identifiants invalides');
        }

        // 🔐 Access token
        const accessToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        // 🔄 Refresh token
        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRE }
        );

        // Hash refresh token
        const refreshTokenHash = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');

        await RefreshToken.create({
            user: user._id,
            token: refreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // Cookie HTTPOnly
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // true en prod (https)
            sameSite: 'strict'
        });

        return successResponse(res, 200, 'Connexion réussie', {
            accessToken,
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


exports.refreshToken = async (req, res) => {
    try {
        const tokenFromCookie = req.cookies.refreshToken;
        if (!tokenFromCookie) {
            return errorResponse(res, 401, 'Refresh token manquant');
        }

        // 1️⃣ Vérifier le refresh token
        const decoded = jwt.verify(
            tokenFromCookie,
            process.env.JWT_REFRESH_SECRET
        );

        // 2️⃣ Vérifier qu’il existe en DB
        const tokenHash = crypto
            .createHash('sha256')
            .update(tokenFromCookie)
            .digest('hex');

        const storedToken = await RefreshToken.findOne({
            user: decoded.id,
            token: tokenHash
        });

        if (!storedToken) {
            return errorResponse(res, 403, 'Refresh token invalide');
        }

        // 3️⃣ Recharger l’utilisateur
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            return errorResponse(res, 401, 'Utilisateur invalide');
        }

        // 4️⃣ Nouveau access token AVEC role
        const newAccessToken = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        return successResponse(res, 200, 'Token rafraîchi', {
            accessToken: newAccessToken
        });

    } catch (error) {
        return errorResponse(res, 401, 'Refresh token expiré');
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        if (token) {
            const hash = crypto.createHash('sha256').update(token).digest('hex');
            await RefreshToken.deleteOne({ token: hash });
        }

        res.clearCookie('refreshToken');

        return successResponse(res, 200, 'Déconnexion réussie');
    } catch (error) {
        return errorResponse(res, 500, 'Erreur lors de la déconnexion');
    }
};

exports.verifyToken = (req, res) => {
    const authHeader = req.headers['authorization']; // Bearer TOKEN
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return errorResponse(res, 401, 'Token manquant');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return successResponse(res, 200, 'Token valide', { user: decoded });
    } catch (err) {
        return errorResponse(res, 401, 'Token invalide ou expiré');
    }
};

