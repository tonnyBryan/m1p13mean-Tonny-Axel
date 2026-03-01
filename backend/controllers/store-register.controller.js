const { errorResponse, successResponse } = require('../utils/apiResponse');
const EmailVerification = require('../models/EmailVerification');
const User = require('../models/User');
const mailService = require('../mail/mail.service');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Boutique = require('../models/Boutique');
const LivraisonConfig = require('../models/LivraisonConfig');
const Box = require('../models/Box');
const CentreCommercial = require('../models/CentreCommercial');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const codeExpiresMinutes = parseInt(process.env.EMAIL_CODE_EXPIRES_MIN, 10) || 10;
const resendDelay = parseInt(process.env.EMAIL_RESEND_DELAY, 10) || 60;

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// ─────────────────────────────────────────────
// POST /store/register/check-email
// Vérifie si l'email est déjà utilisé par une boutique
// ─────────────────────────────────────────────
exports.checkEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return errorResponse(res, 400, 'Email is required.');
        }

        const existing = await User.findOne({ email });

        if (existing) {
            return errorResponse(res, 409, 'This email is already associated with a registered store.');
        }

        return successResponse(res, 200, 'Email is available.', { available: true });
    } catch (error) {
        console.error('Error checking email:', error);
        return errorResponse(res, 500, 'An unexpected error occurred while checking the email.');
    }
};

// ─────────────────────────────────────────────
// POST /store/register/send-otp
// Envoie un code OTP à l'email fourni
// ─────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return errorResponse(res, 400, 'Email is required.');
        }

        // Vérifier s'il existe un code actif
        const existing = await EmailVerification.findOne({
            email,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (existing) {
            const now = new Date();

            // Bloqué temporairement (trop de tentatives)
            if (existing.authorizedAt && now < existing.authorizedAt) {
                const waitSec = Math.ceil((existing.authorizedAt - now) / 1000);
                return errorResponse(res, 439, `Please wait ${waitSec} seconds before requesting a new code.`);
            }

            // Cooldown entre envois
            const diff = (now - existing.updatedAt) / 1000;
            if (diff < resendDelay) {
                return errorResponse(res, 439, `Please wait ${Math.ceil(resendDelay - diff)} seconds before requesting a new code.`);
            }

            // Invalider l'ancien code
            existing.isUsed = true;
            await existing.save();
        }

        const code = generateOTP();
        console.log(`[store-register] OTP for ${email}: ${code}`);

        const expiresAt = new Date(Date.now() + codeExpiresMinutes * 60 * 1000);

        const verificationDoc = await EmailVerification.create({
            email,
            userId: null,
            code,
            expiresAt
        });

        // Envoi async — ne bloque pas la réponse
        (async () => {
            try {
                await mailService.sendVerificationEmail({
                    to: email,
                    name: name || 'there',
                    code,
                    expiresIn: codeExpiresMinutes,
                    hbsTemplate : "code-verification-public"
                });
                console.log(`[store-register] Verification email sent to ${email}`);
            } catch (err) {
                console.error(`[store-register] Failed to send email to ${email}:`, err);
            }
        })();

        return successResponse(res, 201, 'Verification code sent successfully.', {
            id: verificationDoc._id,
            email: verificationDoc.email,
            expiresAt: verificationDoc.expiresAt
        });

    } catch (error) {
        console.error('Error sending OTP:', error);
        return errorResponse(res, 500, 'An unexpected error occurred while sending the verification code.');
    }
};

// ─────────────────────────────────────────────
// POST /store/register/submit
// Vérifie le code OTP + enregistre la boutique de manière transactionnelle
// ─────────────────────────────────────────────
exports.submitRegister = async (req, res) => {
    try {
        let code = req.body.code;
        let manager;
        let boutique;
        let plan;
        let livraison;
        let uploadedPublicId = null;

        try {
            manager = typeof req.body.manager === 'string' ? JSON.parse(req.body.manager) : req.body.manager;
            boutique = typeof req.body.boutique === 'string' ? JSON.parse(req.body.boutique) : req.body.boutique;
            plan = typeof req.body.plan === 'string' ? JSON.parse(req.body.plan) : req.body.plan;
            livraison = typeof req.body.livraison === 'string' ? JSON.parse(req.body.livraison) : req.body.livraison;
        } catch (e) {
            return errorResponse(res, 400, 'The submitted form data contains malformed JSON. Please correct the input and try again.');
        }

        // Basic validation
        if (!code || !manager?.email) {
            return errorResponse(res, 400, 'Verification code and manager email are required.');
        }

        // Verify OTP
        const verificationDoc = await EmailVerification.findOne({
            email: manager.email,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!verificationDoc) {
            return errorResponse(res, 404, 'No active verification code found for this email. Please request a new code.');
        }

        if (verificationDoc.attempts >= 5) {
            return errorResponse(res, 429, 'Too many failed attempts. Please request a new code.');
        }

        if (verificationDoc.code !== code) {
            verificationDoc.attempts += 1;

            if (verificationDoc.attempts >= 5) {
                const blockMinutes = parseInt(process.env.EMAIL_MAX_ATTEMPTS_BLOCK_MIN, 10) || 15;
                verificationDoc.authorizedAt = new Date(Date.now() + blockMinutes * 60 * 1000);
            }

            await verificationDoc.save();

            return errorResponse(res, 400, `Invalid verification code. ${5 - verificationDoc.attempts} attempt(s) remaining.`);
        }

        // Invalidate code
        verificationDoc.isUsed = true;
        await verificationDoc.save();

        // Check if user with this email already exists
        const existingUser = await User.findOne({ email: manager.email });
        if (existingUser) {
            return errorResponse(res, 409, 'An account with this email address already exists. If this is your email, please sign in or use a different email.');
        }

        // Handle logo upload (required)
        let logoUrl = '';
        if (req.file) {
            const uploaded = await uploadImage(req.file.buffer, 'boutiques');
            logoUrl = uploaded.secure_url;
            uploadedPublicId = uploaded.public_id || null;
        }

        if (!logoUrl) {
            return errorResponse(res, 400, 'A boutique logo is required. Please upload a file.');
        }

        // Transactional creation of User, Boutique and LivraisonConfig
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Load centre commercial prices (single doc expected)
            const centre = await CentreCommercial.findOne().session(session);
            if (!centre) {
                throw new Error('Centre commercial not found.');
            }

            // Create user (role boutique)
            const displayName = `${manager.firstName}_${manager.lastName}`;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(manager.password, salt);

            const [createdUser] = await User.create([
                {
                    name: displayName,
                    email: (manager.email || '').trim().toLowerCase(),
                    password: hashedPassword,
                    role: 'boutique',
                    isActive: true,
                    isEmailVerified: true
                }
            ], { session });

            // Determine boutique fields
            const isLocal = (plan && plan.type === 'B');
            const centreCoordinates = centre?.location?.coordinates || null;
            if (isLocal && (!centreCoordinates || centreCoordinates.latitude == null || centreCoordinates.longitude == null)) {
                throw new Error('Centre commercial address coordinates are missing.');
            }
            const address = isLocal
                ? { latitude: centreCoordinates.latitude, longitude: centreCoordinates.longitude }
                : { latitude: plan?.lat ?? null, longitude: plan?.lng ?? null };

            // Plan pricing
            let priceToPayPerMonth = 0;
            let selectedBox = null;
            if (plan?.type === 'A') {
                priceToPayPerMonth = centre.planAPrice ?? 0;
            } else if (plan?.type === 'B') {
                if (!plan.box || !mongoose.Types.ObjectId.isValid(plan.box)) {
                    throw new Error('A valid box is required for Plan B.');
                }

                selectedBox = await Box.findById(plan.box).session(session);
                if (!selectedBox) {
                    throw new Error('Selected box not found.');
                }
                if (selectedBox.isOccupied || selectedBox.boutiqueId) {
                    throw new Error('Selected box is already occupied.');
                }

                priceToPayPerMonth = (centre.planBPrice ?? 0) + (selectedBox.pricePerMonth || 0);
            } else {
                throw new Error('Invalid plan type.');
            }

            const [createdBoutique] = await Boutique.create([
                {
                    owner: createdUser._id,
                    name: boutique.name,
                    logo: logoUrl,
                    description: boutique.description,
                    isActive: true,
                    isValidated: false,
                    isLocal: isLocal,
                    address: address,
                    boxId: selectedBox ? selectedBox._id : null,
                    plan: {
                        type: plan.type,
                        priceToPayPerMonth,
                        startDate: null
                    },
                    payment: plan?.payment || null
                }
            ], { session });

            // Update selected box if any (Plan B)
            if (selectedBox) {
                selectedBox.isOccupied = true;
                selectedBox.boutiqueId = createdBoutique._id;
                await selectedBox.save({ session });
            }

            // Create livraison config
            const livraisonPayload = {
                boutique: createdBoutique._id,
                isDeliveryAvailable: livraison?.isDeliveryAvailable ?? true,
                deliveryRules: {
                    minPrice: livraison?.minPrice ?? 0,
                    baseDistanceKm: livraison?.baseDistanceKm ?? 0,
                    extraPricePerKm: livraison?.extraPricePerKm ?? 0
                },
                deliveryDays: Array.isArray(livraison?.deliveryDays) ? livraison.deliveryDays : [],
                orderCutoffTime: livraison?.orderCutoffTime || '18:00',
                isActive: true
            };

            await LivraisonConfig.create([livraisonPayload], { session });

            await session.commitTransaction();
            session.endSession();

            // After successful registration, notify admins asynchronously (silent)
            try {
                // require here to avoid circular deps at module load time
                const User = require('../models/User');
                const { sendNotification } = require('../services/notification.service');

                (async () => {
                    try {
                        const admins = await User.find({ role: 'admin' }).select('_id').lean();
                        if (Array.isArray(admins) && admins.length) {
                            for (const a of admins) {
                                sendNotification({
                                    recipient: a._id,
                                    channel: 'system',
                                    type: 'boutique_created',
                                    title: 'New Store Registration',
                                    message: `A new store (${createdBoutique.name}) has been registered and awaits review.`,
                                    payload: { boutiqueId: createdBoutique._id },
                                    url: `/admin/app/boutiques/${createdBoutique._id}`,
                                    severity: 'info'
                                }).catch(err => console.error('Notification failed', err));
                            }
                        }
                    } catch (notifErr) {
                        console.error('Failed to send admin notifications for new store:', notifErr);
                    }
                })();
            } catch (e) {
                // keep silent — do not affect the response
                console.error('Notification scheduling failed:', e);
            }

            return successResponse(res, 201, 'Your store registration was submitted successfully and is pending review.', {
                user: { id: createdUser._id, email: createdUser.email },
                boutique: { id: createdBoutique._id, name: createdBoutique.name }
            });

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            console.error('Transaction error while creating store registration:', err);
            let status = 500;
            let message = 'An error occurred while creating your store. Please try again later.';
            if (err && err.message) {
                if (err.message === 'A valid box is required for Plan B.') {
                    status = 400;
                    message = err.message;
                } else if (err.message === 'Selected box not found.') {
                    status = 404;
                    message = err.message;
                } else if (err.message === 'Selected box is already occupied.') {
                    status = 400;
                    message = err.message;
                } else if (err.message === 'Invalid plan type.') {
                    status = 400;
                    message = err.message;
                } else if (err.message === 'Centre commercial address coordinates are missing.') {
                    status = 500;
                    message = 'Centre commercial address is not configured.';
                }
            }
            if (uploadedPublicId) {
                try {
                    await deleteImage(uploadedPublicId);
                } catch (delErr) {
                    console.error('Failed to cleanup uploaded image after transaction failure:', delErr);
                }
            }
            return errorResponse(res, status, message);
        }

    } catch (error) {
        console.error('Error submitting store registration:', error);
        if (uploadedPublicId) {
            try {
                await deleteImage(uploadedPublicId);
            } catch (delErr) {
                console.error('Failed to cleanup uploaded image after transaction failure:', delErr);
            }
        }
        return errorResponse(res, 500, 'An unexpected error occurred while submitting the registration.');
    }
};
