const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const RefreshToken = require('../models/RefreshToken');
const crypto = require('crypto');
const { generateAccessToken } = require('../utils/auth.utils');
const Boutique = require('../models/Boutique');
const PasswordResetToken = require('../models/PasswordResetToken');
const {sendPasswordResetEmail} = require("../mail/mail.service");
const {sendNewDeviceEmail} = require('../mail/mail.service');
const {buildSessionInfo} = require("../utils/session.utils");
const axios = require('axios');


function parseExpireEnv(expireStr) {
    const unit = expireStr.slice(-1);
    const value = parseInt(expireStr.slice(0, -1));
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * (multipliers[unit] || 86400000);
}

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

        if (user.authProvider && user.authProvider !== 'local') {
            return errorResponse(res, 401, 'This account uses Google sign-in. Please continue with Google.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return errorResponse(res, 401, 'Authentication failed. Please check your email, password and role and try again.');
        }

        if (user.isAlertedToNewDevice) {
            try {
                const sessionInfo = await buildSessionInfo(req);

                const lastToken = await RefreshToken.findOne({ user: user._id, isRevoked: false }).sort({ createdAt: -1 }).lean();

                if (lastToken) {
                    const sameIp = (lastToken.ipAddress || null) === (sessionInfo.ipAddress || null);
                    const sameUA = (lastToken.userAgent || null) === (req.headers['user-agent'] || null);

                    if (!sameIp || !sameUA) {
                        sendNewDeviceEmail({
                            to: user.email,
                            name: user.name,
                            device: sessionInfo.device,
                            browser: sessionInfo.browser,
                            os: sessionInfo.os,
                            ip: sessionInfo.ipAddress,
                            location: sessionInfo.location,
                            loginAt: new Date().toISOString()
                        }).catch(err => console.error('New device email failed:', err));
                    }
                }
            } catch (err) {
                console.error('Device detection failed:', err);
            }
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

        const sessionInfo = await buildSessionInfo(req);

        await RefreshToken.deleteMany({
            user: user._id,
            expiresAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // Révoquer l'ancienne session du même appareil si elle existe
        await RefreshToken.findOneAndUpdate(
            {
                user: user._id,
                ipAddress: sessionInfo.ipAddress,
                userAgent: sessionInfo.userAgent,
                isRevoked: false,
                expiresAt: { $gt: new Date() }
            },
            { isRevoked: true }
        );

        await RefreshToken.create({
            user: user._id,
            token: refreshTokenHash,
            expiresAt: new Date(Date.now() + parseExpireEnv(process.env.JWT_REFRESH_EXPIRE)),
            ...sessionInfo
        });

        // Cookie HTTPOnly
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
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

const buildGoogleAuthUrl = (state) => {
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'online',
        prompt: 'select_account',
        state
    });
    return `${baseUrl}?${params.toString()}`;
};

exports.googleAuthRedirect = (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
            return errorResponse(res, 500, 'Google OAuth is not configured.');
        }

        const state = crypto.randomBytes(16).toString('hex');
        res.cookie('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 10 * 60 * 1000
        });

        return res.redirect(buildGoogleAuthUrl(state));
    } catch (error) {
        return errorResponse(res, 500, 'An unexpected error occurred during Google OAuth redirect.');
    }
};

exports.googleAuthCallback = async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL;
    const redirectWithError = (message, status = 400) => {
        if (frontendUrl) {
            const encoded = encodeURIComponent(message || 'Google sign-in failed.');
            return res.redirect(`${frontendUrl}/oauth/callback?error=${encoded}`);
        }
        return errorResponse(res, status, message);
    };

    try {
        const { code, state } = req.query;
        const stateCookie = req.cookies?.oauth_state;

        if (!code) {
            return redirectWithError('Authorization code is missing.');
        }

        if (!state || !stateCookie || state !== stateCookie) {
            return redirectWithError('Invalid OAuth state. Please try again.');
        }

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
            return redirectWithError('Google OAuth is not configured.', 500);
        }

        res.clearCookie('oauth_state');

        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        const { id_token } = tokenRes.data || {};
        if (!id_token) {
            return redirectWithError('Google token is missing.');
        }

        const tokenInfoRes = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
            params: { id_token }
        });

        const {
            sub: googleId,
            email,
            email_verified: emailVerified,
            name
        } = tokenInfoRes.data || {};

        if (!googleId || !email) {
            return redirectWithError('Google account information is incomplete.');
        }

        if (String(emailVerified).toLowerCase() !== 'true') {
            return redirectWithError('Google email is not verified.');
        }

        // Only allow role 'user' for Google auth
        const role = 'user';

        let user = await User.findOne({ email });

        if (user) {
            if (user.authProvider === 'google' && user.googleId === googleId && user.role === role) {
                // proceed
            } else {
                return redirectWithError('An account with this email already exists.', 409);
            }
        } else {
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                role,
                authProvider: 'google',
                googleId,
                isEmailVerified: true
            });
        }

        if (!user.isActive) {
            return redirectWithError('Your account has been deactivated. Please contact support for assistance.', 401);
        }

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRE }
        );

        const refreshTokenHash = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');

        const sessionInfo = await buildSessionInfo(req);

        await RefreshToken.deleteMany({
            user: user._id,
            expiresAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        await RefreshToken.findOneAndUpdate(
            {
                user: user._id,
                ipAddress: sessionInfo.ipAddress,
                userAgent: sessionInfo.userAgent,
                isRevoked: false,
                expiresAt: { $gt: new Date() }
            },
            { isRevoked: true }
        );

        await RefreshToken.create({
            user: user._id,
            token: refreshTokenHash,
            expiresAt: new Date(Date.now() + parseExpireEnv(process.env.JWT_REFRESH_EXPIRE)),
            ...sessionInfo
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        });

        if (frontendUrl) {
            return res.redirect(`${frontendUrl}/oauth/callback`);
        }

        return successResponse(res, 200, 'Authentication successful', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return redirectWithError('An unexpected error occurred during Google authentication.', 500);
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

        const sessionInfo = await buildSessionInfo(req);

        await RefreshToken.create({
            user: user._id,
            token: refreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ...sessionInfo
        });

        // Cookie HTTPOnly
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
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

        if (!storedToken || storedToken.isRevoked) {
            return errorResponse(res, 450, 'The provided refresh token is invalid bro. Please login again.', tokenHash);
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
            await RefreshToken.findOneAndUpdate(
                { token: hash },
                { isRevoked: true }
            );
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


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return errorResponse(res, 400, 'Email is required.');
        }

        // Toujours répondre la même chose pour ne pas leak les emails
        const successMsg = 'If this email exists, you will receive a reset link shortly.';

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return successResponse(res, 200, successMsg);
        }

        // Invalider les anciens tokens non utilisés
        await PasswordResetToken.updateMany(
            { user: user._id, used: false },
            { used: true }
        );

        // Générer un token sécurisé
        const rawToken = crypto.randomBytes(32).toString('hex');

        await PasswordResetToken.create({
            user: user._id,
            email: user.email,
            token: rawToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1h
        });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

        await sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetLink
        });

        return successResponse(res, 200, successMsg);

    } catch (error) {
        console.error('forgotPassword error:', error);
        return errorResponse(res, 500, 'An unexpected error occurred. Please try again later.', error);
    }
};

exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return errorResponse(res, 400, 'Token is required.');
        }

        const resetToken = await PasswordResetToken.findOne({
            token,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!resetToken) {
            return errorResponse(res, 400, 'This reset link is invalid or has expired.');
        }

        return successResponse(res, 200, 'Token is valid.', { email: resetToken.email });

    } catch (error) {
        console.error('verifyResetToken error:', error);
        return errorResponse(res, 500, 'An unexpected error occurred. Please try again later.');
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return errorResponse(res, 400, 'Token and new password are required.');
        }

        if (password.length < 8) {
            return errorResponse(res, 400, 'Password must be at least 8 characters long.');
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
        if (!strongPasswordRegex.test(password)) {
            return errorResponse(res, 400, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
        }

        const resetToken = await PasswordResetToken.findOne({
            token,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!resetToken) {
            return errorResponse(res, 400, 'This reset link is invalid or has expired.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.findByIdAndUpdate(
            resetToken.user,
            {
                password: hashedPassword,
                isEmailVerified: true
            },
            { new: true }
        ).select('role');

        resetToken.used = true;
        await resetToken.save();

        return successResponse(res, 200, 'Password reset successfully. You can now sign in.', {
            role: user.role
        });

    } catch (error) {
        console.error('resetPassword error:', error);
        return errorResponse(res, 500, 'An unexpected error occurred. Please try again later.');
    }
};

// Change password for authenticated users (currentPassword + newPassword)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, revokeOtherSessions } = req.body;

        if (!currentPassword || !newPassword) {
            return errorResponse(res, 400, 'Both currentPassword and newPassword are required.');
        }

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return errorResponse(res, 400, 'The new password must be at least 8 characters long.');
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
        if (!strongPasswordRegex.test(newPassword)) {
            return errorResponse(res, 400, 'The new password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
        }

        // Reload user from DB to get the hashed password
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return errorResponse(res, 404, 'Authenticated user not found.');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return errorResponse(res, 401, 'Current password is incorrect. Please verify your current password and try again.');
        }

        // Prevent reusing the same password (optional but helpful)
        const isSameAsNew = await bcrypt.compare(newPassword, user.password);
        if (isSameAsNew) {
            return errorResponse(res, 400, 'The new password must be different from your current password.');
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        if (revokeOtherSessions) {
            const currentToken = req.cookies?.refreshToken;
            if (currentToken) {
                const currentHash = crypto.createHash('sha256').update(currentToken).digest('hex');
                await RefreshToken.deleteMany({
                    user: user._id,
                    token: { $ne: currentHash }
                });
            } else {
                await RefreshToken.deleteMany({ user: user._id });
            }
        }

        return successResponse(res, 200, 'Your password has been updated successfully. For security reasons, please sign in again with your new password.');

    } catch (error) {
        console.error('changePassword error:', error);
        return errorResponse(res, 500, 'An unexpected error occurred while changing the password. Please try again later.');
    }
};

exports.getLoginHistory = async (req, res) => {
    const currentToken = req.cookies?.refreshToken;
    let currentTokenHash = null;

    if (currentToken) {
        currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');
    }

    const items = res.advancedResults.items.map(session => ({
        ...session.toObject(),
        isCurrent: currentTokenHash ? session.token === currentTokenHash : false
    }));

    return successResponse(res, 200, 'Login history retrieved successfully.', {
        ...res.advancedResults,
        items
    });
};


exports.revokeSession = async (req, res) => {
    try {
        const session = await RefreshToken.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!session) {
            return errorResponse(res, 404, 'Session not found.');
        }

        session.isRevoked = true;
        await session.save();

        return successResponse(res, 200, 'Session revoked successfully.');
    } catch (error) {
        console.error('revokeSession error:', error);
        return errorResponse(res, 500, 'An unexpected error occurred.');
    }
};

// Toggle new device alert preference for authenticated user
exports.toggleNewDeviceAlert = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) {
            return errorResponse(res, 401, 'Authentication required.');
        }

        const user = await User.findById(userId);
        if (!user) {
            return errorResponse(res, 404, 'Authenticated user not found.');
        }

        user.isAlertedToNewDevice = !user.isAlertedToNewDevice;
        await user.save();

        const statusMessage = user.isAlertedToNewDevice
            ? 'New device alerting has been enabled. You will receive an email when a sign-in from an unrecognized device is detected.'
            : 'New device alerting has been disabled. You will no longer receive emails for sign-ins from unrecognized devices.';

        return successResponse(res, 200, statusMessage, { isAlertedToNewDevice: user.isAlertedToNewDevice });
    } catch (error) {
        console.error('toggleNewDeviceAlert error:', error);
        return errorResponse(res, 500, 'An unexpected error occurred while updating your notification preferences. Please try again later.');
    }
};
