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
            return errorResponse(res, 400, 'Email, password and role are required. Please provide all required fields.');
        }

        const user = await User.findOne({ email, role });
        if (!user) {
            return errorResponse(res, 401, 'Authentication failed. Please check your email, password and role and try again.');
        }

        if (!user.isActive) {
            return errorResponse(res, 401, 'Your account has been deactivated. Please contact support for assistance.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return errorResponse(res, 401, 'Authentication failed. Please check your email, password and role and try again.');
        }

        const tokenPayload = {
            id: user._id,
            role: user.role,
            email: user.email,
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
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return successResponse(res, 200, 'Authentication successful', {
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        return errorResponse(res, 500, 'An unexpected error occurred during login. Please try again later.');
    }
};

exports.signupUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return errorResponse(res, 400, 'Username, email, password are required. Please provide all required fields.');
        }

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return errorResponse(
                res,
                400,
                'Name is required and must contain at least 2 characters.'
            );
        }

        if (!email || typeof email !== 'string') {
            return errorResponse(
                res,
                400,
                'A valid email address is required.'
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim().toLowerCase())) {
            return errorResponse(
                res,
                400,
                'Please provide a valid email address.'
            );
        }

        if (!password || typeof password !== 'string') {
            return errorResponse(
                res,
                400,
                'Password is required.'
            );
        }

        if (password.length < 8) {
            return errorResponse(
                res,
                400,
                'Password must be at least 8 characters long.'
            );
        }

        const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

        if (!strongPasswordRegex.test(password)) {
            return errorResponse(
                res,
                400,
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
            );
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse(res, 409, 'An account with this email address already exists.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        const tokenPayload = {
            id: user._id,
            role: user.role,
            email: user.email,
        };

        const accessToken = generateAccessToken(tokenPayload);

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRE }
        );

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
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return successResponse(res, 201, 'Authentication successful', {
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        return errorResponse(res, 500, 'An unexpected error occurred during registration. Please try again later.');
    }
};



exports.refreshToken = async (req, res) => {
    try {
        const tokenFromCookie = req.cookies.refreshToken;

        if (!tokenFromCookie) {
            return errorResponse(res, 450, 'Refresh token is missing from cookies. Please login again to obtain a new token.');
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
            return errorResponse(res, 450, 'The provided refresh token is invalid. Please login again.');
        }

        // 3️⃣ Recharger l’utilisateur
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return errorResponse(res, 450, 'The user associated with the refresh token is invalid or inactive. Please login again or contact support.');
        }

        const tokenPayload = {
            id: user._id,
            role: user.role,
            email: user.email
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

        return successResponse(res, 200, 'Access token refreshed successfully', {
            accessToken: accessToken
        });

    } catch (error) {
        return errorResponse(res, 450, 'The refresh token has expired. Please login again to continue.');
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

        return successResponse(res, 200, 'You have been logged out successfully');
    } catch (error) {
        return errorResponse(res, 500, 'An error occurred during logout. Please try again.');
    }
};

exports.verifyToken = (req, res) => {
    const authHeader = req.headers['authorization']; // Bearer TOKEN
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return errorResponse(res, 401, 'Authorization token is missing from the request. Please provide a valid token.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return successResponse(res, 200, 'The access token is valid', { user: decoded });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 420, 'The access token has expired. Please refresh your token or login again.');
        }
        return errorResponse(res, 401, 'The provided authorization token is invalid. Please check and try again.');
    }
};
