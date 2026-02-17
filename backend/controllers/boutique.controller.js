const { successResponse, errorResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const Boutique = require('../models/Boutique');
const LivraisonConfig = require('../models/LivraisonConfig');
const { uploadImage } = require('../utils/cloudinary');
const bcrypt = require('bcryptjs'); // Assuming password hashing is needed for user

/**
 * POST /api/boutiques
 * Create a full boutique with owner and delivery config
 */
exports.createBoutiqueFull = async (req, res) => {
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
        }

        if (!logoUrl) {
            return errorResponse(res, 400, 'A boutique logo is required. Please upload a file or provide a valid URL.');
        }

        // 3. Create User (Owner)
        // Check if user exists
        const existingUser = await User.findOne({ email: userPayload.email });
        if (existingUser) {
            return errorResponse(res, 400, 'A user with the provided email already exists. Please use a different email or recover access to the existing account.');
        }

        // Create new user
        // Note: Password generation or input? Frontend didn't ask for password. 
        // We'll generate a default one or handle it. 
        // For now, let's assume a default password or if frontend adds it later.
        // The prompt said "User (on inserera seulement le name et email )".
        // So we must generate a random password or set a default.

        const defaultPassword = 'Password123!';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);

        const newUser = await User.create({
            name: userPayload.name,
            email: userPayload.email,
            password: hashedPassword,
            role: 'boutique',
            isActive: true
        });

        // 4. Create Boutique
        const newBoutique = await Boutique.create({
            owner: newUser._id,
            name: boutiquePayload.name,
            description: boutiquePayload.description,
            logo: logoUrl,
            isActive: true, // Default as per frontend
            isValidated: true
        });

        // 5. Create LivraisonConfig
        await LivraisonConfig.create({
            boutique: newBoutique._id,
            isDeliveryAvailable: livraisonPayload.isDeliveryAvailable,
            deliveryRules: livraisonPayload.deliveryRules,
            deliveryDays: livraisonPayload.deliveryDays,
            orderCutoffTime: livraisonPayload.orderCutoffTime,
            isActive: true
        });

        return successResponse(res, 201, 'Boutique created successfully.', {
            user: newUser,
            boutique: newBoutique,
            defaultPassword
        });

    } catch (error) {
        console.error('Error creating boutique:', error);
        return errorResponse(res, 500, 'An unexpected server error occurred while creating the boutique. Please try again later.');
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
        const boutiqueDoc = await Boutique.findById(req.params.id).populate('owner', 'name email role');

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
        const boutique = await Boutique.findById(req.params.id);

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
 * GET /api/boutiques/stats
 * Get boutique statistics (Total, Active, Validated, Pending)
 */
exports.getBoutiqueStats = async (req, res) => {
    try {
        const total = await Boutique.countDocuments();
        const active = await Boutique.countDocuments({ isActive: true, isValidated: true });
        const inactive = await Boutique.countDocuments({ isActive: false });
        const pending = await Boutique.countDocuments({ isValidated: false });

        return successResponse(res, 200, 'Boutique statistics retrieved successfully.', {
            total,
            active,
            inactive,
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
        const { name, description, logo } = req.body;

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
