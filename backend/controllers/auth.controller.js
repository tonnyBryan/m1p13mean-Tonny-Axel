const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const RefreshToken = require('../models/RefreshToken');
const crypto = require('crypto');
const { generateAccessToken } = require('../utils/auth.utils');
const Boutique = require('../models/Boutique');



exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return errorResponse(res, 400, 'Email, password are required.');
        }

        const user = await User.findOne({ email, role });
        if (!user || !user.isActive) {
            return errorResponse(res, 401, 'Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return errorResponse(res, 401, 'Invalid credentials');
        }

        const tokenPayload = {
            id: user._id,
            role: user.role
        };

        if (user.role === 'boutique') {
            const boutique = await Boutique.findOne({ owner: user._id }).select('_id');

            if (boutique) {
                tokenPayload.boutiqueId = boutique._id;
            } else {
                tokenPayload.boutiqueId = null;
            }
        }

        const accessToken = generateAccessToken(tokenPayload);

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

        return successResponse(res, 200, 'Connection successful', {
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        return errorResponse(res, 500, 'Error during login');
    }
};


exports.refreshToken = async (req, res) => {
    try {
        const tokenFromCookie = req.cookies.refreshToken;

        if (!tokenFromCookie) {
            return errorResponse(res, 450, 'Refresh token missing');
        }


        let decoded = jwt.verify(tokenFromCookie, process.env.JWT_REFRESH_SECRET);

        const tokenHash = crypto
            .createHash('sha256')
            .update(tokenFromCookie)
            .digest('hex');

        const storedToken = await RefreshToken.findOne({
            user: decoded.id,
            token: tokenHash
        });

        if (!storedToken) {
            return errorResponse(res, 450, 'Invalid refresh token');
        }

        // 3️⃣ Recharger l’utilisateur
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return errorResponse(res, 450, 'Invalid user');
        }

        const tokenPayload = {
            id: user._id,
            role: user.role
        };

        if (user.role === 'boutique') {
            const boutique = await Boutique.findOne({ owner: user._id }).select('_id');

            if (boutique) {
                tokenPayload.boutiqueId = boutique._id;
            } else {
                tokenPayload.boutiqueId = null;
            }
        }

        const accessToken = generateAccessToken(tokenPayload);

        return successResponse(res, 200, 'Refreshed token', {
            accessToken: newAccessToken
        });

    } catch (error) {
        return errorResponse(res, 450, 'Refresh token expired');
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

        return successResponse(res, 200, 'Logout successful');
    } catch (error) {
        return errorResponse(res, 500, 'Error during disconnection');
    }
};

exports.verifyToken = (req, res) => {
    const authHeader = req.headers['authorization']; // Bearer TOKEN
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return errorResponse(res, 401, 'Missing token');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return successResponse(res, 200, 'Valid token', { user: decoded });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 420, 'ACCESS_TOKEN_EXPIRED');
        }
        return errorResponse(res, 401, 'Invalid token');
    }
};

