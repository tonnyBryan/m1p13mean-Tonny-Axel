const {errorResponse, successResponse} = require("../utils/apiResponse");
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const resendDelay = parseInt(process.env.EMAIL_RESEND_DELAY, 10) || 60; // 60s par défaut
const codeExpiresMinutes = parseInt(process.env.EMAIL_CODE_EXPIRES_MIN, 10) || 15; // 15 min par défaut
const maxAttemptsBlockMinutes = parseInt(process.env.EMAIL_MAX_ATTEMPTS_BLOCK_MIN, 10) || 15; // 15 min par défaut


/**
 * Générer un code OTP à 6 chiffres
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.sendVerification = async (req, res) => {
    try {
        let email = req.query.email;
        if (!email) {
            if (!req.user || !req.user.email) {
                return errorResponse(res, 400, 'Email is required');
            }
            email = req.user.email;
        }

        if (req.user && email !== req.user.email) {
            const emailTaken = await User.findOne({ email });
            if (emailTaken) {
                return errorResponse(res, 409, 'This email is already used by another account');
            }
        }

        // Vérifier s'il existe un code non utilisé et non expiré
        let existing = await EmailVerification.findOne({
            email,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        const now = new Date();

        if (existing) {
            const now = new Date();

            // Bloqué si la réautorisation est définie
            if (existing.authorizedAt && now < existing.authorizedAt) {
                const waitSec = Math.ceil((existing.authorizedAt - now) / 1000);
                return errorResponse(res, 439, `Please wait ${waitSec} seconds before requesting a new code`);
            }

            const diff = (now - existing.updatedAt) / 1000;
            if (diff < resendDelay) {
                return errorResponse(res, 439, `Please wait ${Math.ceil(resendDelay - diff)} seconds before requesting a new code`);
            }

            // Marquer l'ancien code comme utilisé
            existing.isUsed = true;
            await existing.save();
        }


        // Créer un nouveau code
        const code = generateOTP();
        console.log(code);
        const expiresAt = new Date(Date.now() + codeExpiresMinutes * 60 * 1000); // durée configurable

        const verificationDoc = await EmailVerification.create({
            email,
            userId: req.user?._id || null,
            code,
            expiresAt
        });

        return successResponse(
            res,
            201,
            'New verification code created successfully',
            {
                id: verificationDoc._id,
                email: verificationDoc.email,
                attempts: verificationDoc.attempts,
                expiresAt: verificationDoc.expiresAt
            }
        );

    } catch (error) {
        console.error('Error creating email verification:', error);
        return errorResponse(res, 500, 'Internal server error');
    }
};


/**
 * Vérifier le code de l'email
 */
exports.verify = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return errorResponse(res, 400, 'Email and code are required');
        }

        const verificationDoc = await EmailVerification.findOne({
            email,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!verificationDoc) {
            return errorResponse(res, 404, 'Verification code not found or expired');
        }

        if (verificationDoc.attempts >= 5) {
            return errorResponse(res, 429, 'Maximum attempts reached. Please request a new code.');
        }

        if (verificationDoc.code !== code) {
            verificationDoc.attempts += 1;

            // Si max atteint, bloquer temporairement
            if (verificationDoc.attempts >= 5) {
                verificationDoc.authorizedAt = new Date(Date.now() + maxAttemptsBlockMinutes * 60 * 1000);
            }

            await verificationDoc.save();

            return errorResponse(
                res,
                400,
                `Invalid code. You have used ${verificationDoc.attempts} of 5 attempts.`
            );
        }


        verificationDoc.isUsed = true;
        await verificationDoc.save();

        if (req.user) {
            const updates = { isEmailVerified: true };
            if (req.user.email !== email) {
                updates.email = email;
            }
            await User.findByIdAndUpdate(req.user._id, updates, { new: true });
        }

        return successResponse(res, 200, 'Email verified successfully');
    } catch (error) {
        console.error('Error verifying email code:', error);
        return errorResponse(res, 500, 'Internal server error');
    }
};

/**
 * Retourne le code de vérification email actif pour l'utilisateur
 * Filtré par userId pour gérer le cas où l'utilisateur change son email
 * Renvoie null si aucun code actif
 */
exports.getActiveVerification = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return errorResponse(res, 400, 'User not authenticated');
        }

        const now = new Date();

        // Cherche le dernier code non utilisé et non expiré pour cet userId
        const activeCode = await EmailVerification.findOne({
            userId: req.user._id,
            isUsed: false,
            expiresAt: { $gt: now }
        }).sort({ createdAt: -1 });

        if (!activeCode) {
            return successResponse(res, 200, 'No active verification code', null);
        }

        // Retourner uniquement les infos utiles pour le frontend
        return successResponse(res, 200, 'Active verification code found', {
            id: activeCode._id,
            email: activeCode.email,
            attempts: activeCode.attempts,
            expiresAt: activeCode.expiresAt,
            authorizedAt: activeCode.authorizedAt || null
        });
    } catch (error) {
        console.error('Error fetching active verification:', error);
        return errorResponse(res, 500, 'Internal server error');
    }
};
