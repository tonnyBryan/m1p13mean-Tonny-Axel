const { successResponse, errorResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Boutique = require('../models/Boutique');
const LivraisonConfig = require('../models/LivraisonConfig');
const Box = require('../models/Box');
const { uploadImage } = require('../utils/cloudinary');
const bcrypt = require('bcryptjs'); // Assuming password hashing is needed for user
const mongoose = require('mongoose');
const CentreCommercial = require('../models/CentreCommercial');
const { deleteImage } = require('../utils/cloudinary');

/**
 * POST /api/boutiques
 * Create a full boutique with owner and delivery config
 */
exports.createBoutiqueFull = async (req, res) => {
    const session = await mongoose.startSession();
    let uploadedPublicId = null; // for cleanup in case of failure
    try {
        // 1. Parse Data
        let userPayload, boutiquePayload, livraisonPayload;
        try {
            userPayload = JSON.parse(req.body.user);
            boutiquePayload = JSON.parse(req.body.boutique);
            livraisonPayload = JSON.parse(req.body.livraisonConfig);
        } catch (e) {
            return errorResponse(res, 400, 'The submitted form data contains malformed JSON. Please correct the input and try again.');
        }

        // 2. Handle Logo (File or URL)
        let logoUrl = boutiquePayload.logo || '';

        if (req.file) {
            const uploaded = await uploadImage(req.file.buffer, 'boutiques');
            logoUrl = uploaded.secure_url;
            uploadedPublicId = uploaded.public_id || null;
        }

        if (!logoUrl) {
            return errorResponse(res, 400, 'A boutique logo is required. Please upload a file or provide a valid URL.');
        }

        // Start transaction
        let result = null;
        await session.withTransaction(async () => {
            // 3. Create User (Owner) - ensure email uniqueness
            const existingUser = await User.findOne({ email: userPayload.email }).session(session);
            if (existingUser) {
                // throw to abort transaction and return error later
                throw { status: 400, message: 'A user with the provided email already exists. Please use a different email or recover access to the existing account.' };
            }

            const defaultPassword = 'Password123!';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(defaultPassword, salt);

            const newUser = await User.create([{ // use array form to pass session
                name: userPayload.name,
                email: userPayload.email,
                password: hashedPassword,
                role: 'boutique',
                isActive: true
            }], { session });

            // newUser is an array when using create with array
            const createdUser = Array.isArray(newUser) ? newUser[0] : newUser;

            // 4. Find CentreCommercial to use its address (there is expected to be a single doc)
            const centre = await CentreCommercial.findOne().session(session);
            const addressObj = centre && centre.location && centre.location.coordinates ? {
                latitude: centre.location.coordinates.latitude || null,
                longitude: centre.location.coordinates.longitude || null
            } : { latitude: null, longitude: null };

            // 4.5 Check selected box
            if (!boutiquePayload.boxId) {
                throw { status: 400, message: 'Veuillez sélectionner un Box libre pour la boutique.' };
            }

            const selectedBox = await Box.findById(boutiquePayload.boxId).session(session);
            if (!selectedBox) {
                throw { status: 404, message: 'Le Box sélectionné est introuvable.' };
            }

            if (selectedBox.isOccupied || selectedBox.boutiqueId) {
                throw { status: 400, message: 'Le Box sélectionné est déjà occupé.' };
            }

            const planBBasePrice = centre ? (centre.planBPrice ?? 0) : 0;
            const priceToPayPerMonth = planBBasePrice + (selectedBox.pricePerMonth || 0);

            // 5. Create Boutique with isLocal true and address from centre commercial
            const boutiqueDoc = await Boutique.create([{
                owner: createdUser._id,
                name: boutiquePayload.name,
                description: boutiquePayload.description,
                logo: logoUrl,
                isActive: true,
                isValidated: true,
                isLocal: true,
                address: addressObj,
                boxId: selectedBox._id,
                plan: {
                    type: 'B',
                    priceToPayPerMonth,
                    startDate: Date.now()
                }
            }], { session });

            const createdBoutique = Array.isArray(boutiqueDoc) ? boutiqueDoc[0] : boutiqueDoc;

            // 5.5 Update Box
            selectedBox.isOccupied = true;
            selectedBox.boutiqueId = createdBoutique._id;
            await selectedBox.save({ session });

            // 6. Create LivraisonConfig
            await LivraisonConfig.create([{
                boutique: createdBoutique._id,
                isDeliveryAvailable: livraisonPayload.isDeliveryAvailable,
                deliveryRules: livraisonPayload.deliveryRules,
                deliveryDays: livraisonPayload.deliveryDays,
                orderCutoffTime: livraisonPayload.orderCutoffTime,
                isActive: true
            }], { session });

            // prepare result to return after transaction
            result = {
                user: createdUser,
                boutique: createdBoutique,
                defaultPassword
            };
        });

        // If transaction completed without throwing
        return successResponse(res, 201, 'Boutique created successfully.', result);

    } catch (error) {
        console.error('Error creating boutique:', error);

        // Attempt to cleanup uploaded image if any (best-effort)
        if (uploadedPublicId) {
            try {
                await deleteImage(uploadedPublicId);
            } catch (delErr) {
                console.error('Failed to cleanup uploaded image after transaction failure:', delErr);
            }
        }

        // handle custom thrown errors with status/message
        if (error && error.status && error.message) {
            return errorResponse(res, error.status, error.message);
        }
        return errorResponse(res, 500, 'An unexpected server error occurred while creating the boutique. Please try again later.');
    } finally {
        session.endSession();
    }
};

/**
 * GET /api/boutiques
 * Get all boutiques with filtering and pagination
 * Uses advancedResults middleware
 */
exports.getBoutiques = async (req, res) => {
    // The middleware places the result in res.advancedResults
    if (!res.advancedResults) {
        return errorResponse(res, 500, 'Server configuration error: pagination and filter middleware is not active. Please contact support.');
    }
    return successResponse(res, 200, null, res.advancedResults);
};

/**
 * GET /api/boutiques/:id/full
 * Get a boutique by ID along with its LivraisonConfig (if exists)
 */
exports.getBoutiqueFull = async (req, res) => {
    try {
        // Populate owner basic info for convenience
        const boutiqueDoc = await Boutique.findById(req.params.id).populate('owner', 'name email role').populate('boxId', 'number');

        if (!boutiqueDoc) {
            return errorResponse(res, 404, 'The requested boutique was not found. Please check the identifier and try again.');
        }

        // Try to find an associated LivraisonConfig, may be null
        const livraisonConfig = await LivraisonConfig.findOne({ boutique: boutiqueDoc._id }) || null;

        // Convert to plain object to allow attaching the livraisonConfig property
        const boutique = boutiqueDoc.toObject ? boutiqueDoc.toObject() : boutiqueDoc;
        boutique.livraisonConfig = livraisonConfig;

        return successResponse(res, 200, 'Boutique details with delivery configuration retrieved successfully.', boutique);
    } catch (error) {
        console.error('Error fetching boutique full:', error);
        // Handle invalid ObjectId format
        if (error.kind === 'ObjectId') {
            return errorResponse(res, 400, 'The provided boutique identifier is invalid. Please check and try again.');
        }
        return errorResponse(res, 500, 'An unexpected server error occurred while fetching the boutique. Please try again later.');
    }
};

/**
 * GET /api/boutiques/:id
 * Get a single boutique by ID
 */
exports.getBoutiqueById = async (req, res) => {
    try {
        const boutique = await Boutique.findById(req.params.id).populate('boxId', 'number');

        if (!boutique) {
            return errorResponse(res, 404, 'The requested boutique was not found. Please check the identifier and try again.');
        }

        return successResponse(res, 200, 'Boutique retrieved successfully.', boutique);
    } catch (error) {
        console.error('Error fetching boutique:', error);

        // Handle invalid ObjectId format
        if (error.kind === 'ObjectId') {
            return errorResponse(res, 400, 'The provided boutique identifier is invalid. Please check and try again.');
        }

        return errorResponse(res, 500, 'An unexpected server error occurred while fetching the boutique. Please try again later.');
    }
};

/**
 * PATCH /api/boutiques/:id/status
 * Update boutique active status (Admin only)
 */
exports.updateBoutiqueStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        // Validate input
        if (typeof isActive !== 'boolean') {
            return errorResponse(res, 400, 'The isActive field must be a boolean (true or false).');
        }

        const boutique = await Boutique.findById(req.params.id);

        if (!boutique) {
            return errorResponse(res, 404, 'The requested boutique was not found. Please check the identifier and try again.');
        }

        // Update the status
        boutique.isActive = isActive;
        if (!isActive) {
            boutique.isValidated = false;
            if (boutique.plan) {
                boutique.plan.startDate = null;
            }
        }
        await boutique.save();

        return successResponse(res, 200, 'Boutique status updated successfully.', boutique);
    } catch (error) {
        console.error('Error updating boutique status:', error);

        // Handle invalid ObjectId format
        if (error.kind === 'ObjectId') {
            return errorResponse(res, 400, 'The provided boutique identifier is invalid. Please check and try again.');
        }

        return errorResponse(res, 500, 'An unexpected server error occurred while updating the boutique status. Please try again later.');
    }
};

/**
 * PATCH /api/boutiques/:id/validate
 * Validate a boutique (Admin only)
 */
exports.validateBoutique = async (req, res) => {
    try {
        const boutique = await Boutique.findById(req.params.id);

        if (!boutique) {
            return errorResponse(res, 404, 'The requested boutique was not found. Please check the identifier and try again.');
        }

        if (boutique.isValidated) {
            return errorResponse(res, 400, 'This boutique is already validated.');
        }

        boutique.isValidated = true;
        if (boutique.plan) {
            boutique.plan.startDate = new Date();
        } else {
            boutique.plan = { type: null, priceToPayPerMonth: 0, startDate: new Date() };
        }

        await boutique.save();
        return successResponse(res, 200, 'Boutique validated successfully.', boutique);
    } catch (error) {
        console.error('Error validating boutique:', error);
        if (error.kind === 'ObjectId') {
            return errorResponse(res, 400, 'The provided boutique identifier is invalid. Please check and try again.');
        }
        return errorResponse(res, 500, 'An unexpected server error occurred while validating the boutique. Please try again later.');
    }
};

/**
 * GET /api/boutiques/stats
 * Get boutique statistics (Total, Running, Not Running, Pending)
 */
exports.getBoutiqueStats = async (req, res) => {
    try {
        const total = await Boutique.countDocuments();
        const running = await Boutique.countDocuments({ isActive: true, isValidated: true });
        const notRunning = await Boutique.countDocuments({
            $or: [
                { isActive: false },
                { isValidated: false }
            ]
        });
        const pending = await Boutique.countDocuments({ isValidated: false });

        return successResponse(res, 200, 'Boutique statistics retrieved successfully.', {
            total,
            running,
            notRunning,
            pending
        });
    } catch (error) {
        console.error('Error fetching boutique stats:', error);
        return errorResponse(res, 500, 'An unexpected server error occurred while fetching boutique statistics. Please try again later.');
    }
};

/**
 * PATCH /api/boutiques/:id
 * Update boutique general information (name, description, logo...)
 */
exports.updateBoutique = async (req, res) => {
    try {
        const { name, description } = req.body;
        let logo = req.body.logo;

        if (req.file) {
            const uploaded = await uploadImage(req.file.buffer, 'boutiques');
            logo = uploaded.secure_url;
        }

        // Basic validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return errorResponse(res, 400, 'The name field is required and must be a non-empty string.');
        }

        const boutique = await Boutique.findById(req.params.id);
        if (!boutique) {
            return errorResponse(res, 404, 'The requested boutique was not found. Please check the identifier and try again.');
        }

        boutique.name = name;
        boutique.description = description || boutique.description;
        boutique.logo = logo || boutique.logo;

        await boutique.save();

        // Return boutique with livraisonConfig injected for frontend convenience
        const livraisonConfig = await LivraisonConfig.findOne({ boutique: boutique._id }) || null;
        const boutiqueObj = boutique.toObject ? boutique.toObject() : boutique;
        boutiqueObj.livraisonConfig = livraisonConfig;

        return successResponse(res, 200, 'Boutique information updated successfully.', boutiqueObj);
    } catch (error) {
        console.error('Error updating boutique:', error);
        if (error.kind === 'ObjectId') {
            return errorResponse(res, 400, 'The provided boutique identifier is invalid. Please check and try again.');
        }
        return errorResponse(res, 500, 'An unexpected server error occurred while updating the boutique. Please try again later.');
    }
};

/**
 * PATCH /api/boutiques/:id/delivery
 * Update or create the LivraisonConfig for a boutique
 */
exports.updateDeliveryConfig = async (req, res) => {
    try {
        const { isDeliveryAvailable, orderCutoffTime, deliveryDays, deliveryRules } = req.body;

        if (isDeliveryAvailable && Array.isArray(deliveryDays)) {
            const activeDays = deliveryDays.filter(d => d.isActive).length;
            if (activeDays < 1) {
                return errorResponse(res, 400, "Minimum 1 jour actif obligatoire si la livraison est activée.");
            }
        }

        console.log(req.body);

        const boutique = await Boutique.findById(req.params.id);
        if (!boutique) {
            return errorResponse(res, 404, 'The requested boutique was not found. Please check the identifier and try again.');
        }

        // Find existing config
        let livraisonConfig = await LivraisonConfig.findOne({ boutique: boutique._id });

        if (livraisonConfig) {
            // Update fields if provided
            if (typeof isDeliveryAvailable === 'boolean') livraisonConfig.isDeliveryAvailable = isDeliveryAvailable;
            if (orderCutoffTime) livraisonConfig.orderCutoffTime = orderCutoffTime;
            if (deliveryDays) livraisonConfig.deliveryDays = deliveryDays;
            if (deliveryRules) livraisonConfig.deliveryRules = deliveryRules;

            await livraisonConfig.save();
        } else {
            // Create new config
            livraisonConfig = await LivraisonConfig.create({
                boutique: boutique._id,
                isDeliveryAvailable: typeof isDeliveryAvailable === 'boolean' ? isDeliveryAvailable : true,
                deliveryRules: deliveryRules || { minPrice: 0, baseDistanceKm: 0, extraPricePerKm: 0 },
                deliveryDays: deliveryDays || [],
                orderCutoffTime: orderCutoffTime || '18:00',
                isActive: true
            });
        }

        const boutiqueObj = boutique.toObject ? boutique.toObject() : boutique;
        boutiqueObj.livraisonConfig = livraisonConfig;

        return successResponse(res, 200, 'Delivery configuration updated successfully.', boutiqueObj);
    } catch (error) {
        console.error('Error updating livraison config:', error);
        if (error.kind === 'ObjectId') {
            return errorResponse(res, 400, 'The provided boutique identifier is invalid. Please check and try again.');
        }
        return errorResponse(res, 500, 'An unexpected server error occurred while updating the delivery configuration. Please try again later.');
    }
};
