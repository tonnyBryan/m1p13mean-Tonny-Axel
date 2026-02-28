const { successResponse, errorResponse } = require('../utils/apiResponse');
const Box = require('../models/Box');
const Boutique = require('../models/Boutique');

/**
 * POST /api/boxes
 * Create a new box
 */
exports.createBox = async (req, res) => {
    try {
        const { number, pricePerMonth } = req.body;

        if (!number || pricePerMonth === undefined) {
            return errorResponse(res, 400, "Le numéro et le prix sont obligatoires.");
        }

        const existingBox = await Box.findOne({ number });
        if (existingBox) {
            return errorResponse(res, 400, "Un Box avec ce numéro existe déjà.");
        }

        const box = await Box.create({
            number,
            pricePerMonth,
            isOccupied: false
        });

        return successResponse(res, 201, "Box créé avec succès.", box);
    } catch (error) {
        console.error("Erreur createBox:", error);
        return errorResponse(res, 500, "Erreur serveur lors de la création du Box.");
    }
};

/**
 * GET /api/boxes
 * Get all boxes, optionally filtered by status
 */
exports.getBoxes = async (req, res) => {
    try {
        // middleware advancedResults might be used or simple filters
        // Let's implement simple filter: isOccupied (true/false/all)
        const filter = {};
        if (req.query.status === 'vide') {
            filter.isOccupied = false;
        } else if (req.query.status === 'occupe') {
            filter.isOccupied = true;
        }

        const boxes = await Box.find(filter).populate('boutiqueId', 'name logo');

        return successResponse(res, 200, "Boxes récupérés avec succès.", boxes);
    } catch (error) {
        console.error("Erreur getBoxes:", error);
        return errorResponse(res, 500, "Erreur serveur lors de la récupération des Boxes.");
    }
};

/**
 * GET /api/boxes/:id
 * Get box by ID
 */
exports.getBoxById = async (req, res) => {
    try {
        const box = await Box.findById(req.params.id).populate('boutiqueId');
        if (!box) {
            return errorResponse(res, 404, "Box introuvable.");
        }
        return successResponse(res, 200, "Box récupéré.", box);
    } catch (error) {
        console.error("Erreur getBoxById:", error);
        return errorResponse(res, 500, "Erreur lors de la récupération du Box.");
    }
};

/**
 * PATCH /api/boxes/:id
 * Update box details
 */
exports.updateBox = async (req, res) => {
    try {
        const { number, pricePerMonth } = req.body;
        const box = await Box.findById(req.params.id);

        if (!box) {
            return errorResponse(res, 404, "Box introuvable.");
        }

        if (number) box.number = number;
        if (pricePerMonth !== undefined) box.pricePerMonth = pricePerMonth;

        await box.save();
        return successResponse(res, 200, "Box mis à jour.", box);
    } catch (error) {
        if (error.code === 11000) {
            return errorResponse(res, 400, "Un Box avec ce numéro existe déjà.");
        }
        console.error("Erreur updateBox:", error);
        return errorResponse(res, 500, "Erreur serveur.");
    }
};

/**
 * DELETE /api/boxes/:id
 * Delete a box
 */
exports.deleteBox = async (req, res) => {
    try {
        const box = await Box.findById(req.params.id);
        if (!box) {
            return errorResponse(res, 404, "Box introuvable.");
        }

        if (box.isOccupied || box.boutiqueId) {
            return errorResponse(res, 400, "Impossible de supprimer un Box occupé.");
        }

        await Box.deleteOne({ _id: box._id });
        return successResponse(res, 200, "Box supprimé.");
    } catch (error) {
        console.error("Erreur deleteBox:", error);
        return errorResponse(res, 500, "Erreur serveur.");
    }
};
