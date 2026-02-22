const Category = require('../models/Category');
const Boutique = require('../models/Boutique');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// GET /api/categories
exports.getAllCategory = async (req, res) => {
    // advancedResults middleware already prepared res.advancedResults
    return successResponse(res, 200, null, res.advancedResults);
};

// POST /api/categories
exports.addCategory = async (req, res) => {
    try {
        const { name, description } = req.body || {};

        if (!name || name.toString().trim() === '') {
            return errorResponse(res, 400, 'Category name is required. Please provide a valid name.');
        }

        // Find boutique for current user (owner)
        const boutique = await Boutique.findOne({ owner: req.user._id }).select('_id');
        if (!boutique) {
            return errorResponse(res, 404, 'Boutique not found for the current user. Please create a boutique profile first.');
        }

        // Create category linked to boutique
        const category = await Category.create({
            boutique: boutique._id,
            name: name.toString().trim(),
            description: description ? description.toString().trim() : undefined
        });

        return successResponse(res, 201, 'Category created successfully.', category);
    } catch (error) {
        console.error('Error creating category:', error);
        // Handle duplicate key error (unique index on boutique+name)
        if (error.code === 11000) {
            return errorResponse(res, 400, 'A category with this name already exists for your boutique. Please choose a different name.');
        }
        return errorResponse(res, 500, 'An unexpected error occurred while creating the category. Please try again later.');
    }
};
