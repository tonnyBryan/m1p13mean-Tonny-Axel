const {errorResponse, successResponse} = require("../utils/apiResponse");
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const mailService = require("../mail/mail.service");
const SupportRequest = require('../models/SupportRequest');
const sanitizeHtml = require('sanitize-html');
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
                return errorResponse(res, 400, 'An email address is required. Please provide one or authenticate.');
            }
            email = req.user.email;
        }

        if (req.user && email !== req.user.email) {
            const emailTaken = await User.findOne({ email });
            if (emailTaken) {
                return errorResponse(res, 409, 'The provided email is already associated with another account. Please use a different email.');
            }
        }

        // Vérifier s'il existe un code non utilisé et non expiré
        let existing = await EmailVerification.findOne({
            email,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        // current timestamp used for timing checks

        if (existing) {
            const now = new Date();

            // Bloqué si la réautorisation est définie
            if (existing.authorizedAt && now < existing.authorizedAt) {
                const waitSec = Math.ceil((existing.authorizedAt - now) / 1000);
                return errorResponse(res, 439, `Please wait ${waitSec} seconds before requesting a new verification code.`);
            }

            const diff = (now - existing.updatedAt) / 1000;
            if (diff < resendDelay) {
                return errorResponse(res, 439, `Please wait ${Math.ceil(resendDelay - diff)} seconds before requesting a new verification code.`);
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

        (async () => {
            try {
                await mailService.sendVerificationEmail({
                    to: email,
                    name: req.user?.name || 'there',
                    code,
                    expiresIn: codeExpiresMinutes
                });
                console.log(`Verification email sent to ${email}`);
            } catch (err) {
                console.error(`Failed to send verification email to ${email}:`, err);
            }
        })();

        return successResponse(
            res,
            201,
            'A new verification code has been created and sent if the email is reachable.',
            {
                id: verificationDoc._id,
                email: verificationDoc.email,
                attempts: verificationDoc.attempts,
                expiresAt: verificationDoc.expiresAt
            }
        );

    } catch (error) {
        console.error('Error creating email verification:', error);
        return errorResponse(res, 500, 'An unexpected server error occurred while creating the verification code. Please try again later.');
    }
};


/**
 * Vérifier le code de l'email
 */
exports.verify = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return errorResponse(res, 400, 'Both email and verification code are required. Please provide both fields.');
        }

        const verificationDoc = await EmailVerification.findOne({
            email,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!verificationDoc) {
            return errorResponse(res, 404, 'No active verification code was found for the provided email, or the code has expired. Please request a new code.');
        }

        if (verificationDoc.attempts >= 5) {
            return errorResponse(res, 429, 'You have reached the maximum number of verification attempts. Please request a new code and try again later.');
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
                `The provided code is invalid. You have used ${verificationDoc.attempts} of 5 attempts.`
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

        return successResponse(res, 200, 'Email address verified successfully.');
    } catch (error) {
        console.error('Error verifying email code:', error);
        return errorResponse(res, 500, 'An unexpected server error occurred while verifying the code. Please try again later.');
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
            return errorResponse(res, 400, 'User must be authenticated to retrieve active verification code.');
        }

        const now = new Date();

        // Cherche le dernier code non utilisé et non expiré pour cet userId
        const activeCode = await EmailVerification.findOne({
            userId: req.user._id,
            isUsed: false,
            expiresAt: { $gt: now }
        }).sort({ createdAt: -1 });

        if (!activeCode) {
            return successResponse(res, 200, 'No active verification code was found for the authenticated user.', null);
        }

        // Retourner uniquement les infos utiles pour le frontend
        return successResponse(res, 200, 'Active verification code retrieved successfully.', {
            id: activeCode._id,
            email: activeCode.email,
            attempts: activeCode.attempts,
            expiresAt: activeCode.expiresAt,
            authorizedAt: activeCode.authorizedAt || null
        });
    } catch (error) {
        console.error('Error fetching active verification:', error);
        return errorResponse(res, 500, 'An unexpected server error occurred while fetching the active verification code. Please try again later.');
    }
};


// ----------------- New function: replySupportRequest -----------------
exports.replySupportRequest = async (req, res) => {
    try {
        const { idSupportRequest, to, subject, text } = req.body;

        if (!idSupportRequest || !to || !subject || !text) {
            return errorResponse(res, 400, 'idSupportRequest, to, subject and text are required in the request body.');
        }

        // Récupérer la demande de support
        const support = await SupportRequest.findById(idSupportRequest);
        if (!support) {
            return errorResponse(res, 404, 'Support request not found.');
        }

        // Vérifier que le destinataire correspond à l'email du ticket
        if (support.email !== to) {
            return errorResponse(res, 400, 'The provided recipient email does not match the support request email.');
        }

        // Détecter si `text` contient déjà du HTML
        const isHtml = /<[^>]+>/.test(text);

        let contentHtml;
        let plainText;

        if (isHtml) {
            // Sanitiser le HTML en autorisant certains tags simples (p, br, strong, em, a, ul, ol, li, img)
            contentHtml = sanitizeHtml(text, {
                allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'img', 'blockquote'],
                allowedAttributes: {
                    'a': ['href', 'name', 'target', 'rel'],
                    'img': ['src', 'alt', 'title', 'width', 'height']
                },
                allowedSchemes: ['http', 'https', 'mailto', 'data']
            });

            // Générer plain text depuis le HTML (simple strip)
            plainText = contentHtml.replace(/<[^>]*>/g, '');
        } else {
            // Échapper et convertir les sauts de ligne
            contentHtml = `<p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>`;
            plainText = text;
        }

        // Envoyer l'email via le service mail (on envoie html et text)
        await mailService.sendSupportEmail({ to, subject, contentHtml, text: plainText });

        support.isAnswered = true;
        support.replies.push({
            subject,
            text: contentHtml,
            sentAt: new Date(),
            sentBy: req.user._id
        });
        await support.save();

        return successResponse(res, 200, 'Support reply sent and support request marked as answered.');
    } catch (error) {
        console.error('Error replying to support request:', error);
        return errorResponse(res, 500, 'An unexpected server error occurred while replying to the support request.');
    }
};
