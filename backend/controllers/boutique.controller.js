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
            return errorResponse(res, 400, 'Invalid JSON format in form data');
        }

        // 2. Handle Logo (File or URL)
        let logoUrl = boutiquePayload.logo || '';

        if (req.file) {
            const uploaded = await uploadImage(req.file.buffer, 'boutiques');
            logoUrl = uploaded.secure_url;
        }

        if (!logoUrl) {
            return errorResponse(res, 400, 'Boutique logo is required (file or URL)');
        }

        // 3. Create User (Owner)
        // Check if user exists
        const existingUser = await User.findOne({ email: userPayload.email });
        if (existingUser) {
            return errorResponse(res, 400, 'User with this email already exists');
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

        return successResponse(res, 201, 'Boutique created successfully', {
            user: newUser,
            boutique: newBoutique,
            defaultPassword
        });

    } catch (error) {
        console.error('Error creating boutique:', error);
        return errorResponse(res, 500, 'Server Error while creating boutique');
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
        return errorResponse(res, 500, 'Advanced Results Middleware not running');
    }
    return successResponse(res, 200, null, res.advancedResults);
};

/**
 * GET /api/boutiques/:id
 * Get a single boutique by ID
 */
exports.getBoutiqueById = async (req, res) => {
    try {
        const boutique = await Boutique.findById(req.params.id);

        if (!boutique) {
            return errorResponse(res, 404, 'Boutique not found');
        }

        return successResponse(res, 200, 'Boutique retrieved successfully', boutique);
    } catch (error) {
        console.error('Error fetching boutique:', error);

        // Handle invalid ObjectId format
        if (error.kind === 'ObjectId') {
            return errorResponse(res, 400, 'Invalid boutique ID format');
        }

        return errorResponse(res, 500, 'Server Error while fetching boutique');
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
            return errorResponse(res, 400, 'isActive must be a boolean value');
        }

        const boutique = await Boutique.findById(req.params.id);

        if (!boutique) {
            return errorResponse(res, 404, 'Boutique not found');
        }

        // Update the status
        boutique.isActive = isActive;
        await boutique.save();

        return successResponse(res, 200, 'Boutique status updated successfully', boutique);
    } catch (error) {
        console.error('Error updating boutique status:', error);

        // Handle invalid ObjectId format
        if (error.kind === 'ObjectId') {
            return errorResponse(res, 400, 'Invalid boutique ID format');
        }

        return errorResponse(res, 500, 'Server Error while updating boutique status');
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

        return successResponse(res, 200, 'Boutique statistics retrieved', {
            total,
            active,
            inactive,
            pending
        });
    } catch (error) {
        console.error('Error fetching boutique stats:', error);
        return errorResponse(res, 500, 'Server Error while fetching statistics');
    }
};
