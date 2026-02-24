const mongoose = require('mongoose');
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Create multiple stock movements
 * @route   POST /api/stock-movements
 * @access  Private
 */
exports.createStockMovements = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { boutiqueId, movements } = req.body;
        const createdBy = req.user.id;

        if (!movements || !Array.isArray(movements) || movements.length === 0) {
            return errorResponse(res, 400, 'Please provide at least one movement.');
        }

        const results = [];

        for (const move of movements) {
            const { product: productId, type, quantity, note } = move;

            if (quantity <= 0) {
                throw new Error(`Quantity must be positive for product ${productId}.`);
            }

            const product = await Product.findById(productId).session(session);
            if (!product) {
                throw new Error(`Product ${productId} not found.`);
            }

            const stockBefore = product.stock;
            let stockAfter;

            if (type === 'IN') {
                stockAfter = stockBefore + quantity;
            } else if (type === 'OUT') {
                stockAfter = stockBefore - quantity;
            } else {
                throw new Error(`Invalid movement type: ${type}.`);
            }

            // Check for negative real stock
            // stockReal = product.stock - product.stockEngaged
            // After update: newStockReal = stockAfter - product.stockEngaged
            const newStockReal = stockAfter - product.stockEngaged;
            if (newStockReal < 0) {
                throw new Error(`Stock insuffisant pour ${product.name}. Nouveau stock réel serait de ${newStockReal}. Manaova inventaire fa mis anomalie.`);
            }

            // Create movement record
            const stockMovement = new StockMovement({
                boutique: boutiqueId,
                product: productId,
                type,
                quantity,
                stockBefore,
                stockAfter,
                note,
                createdBy
            });

            await stockMovement.save({ session });

            // Update product stock
            product.stock = stockAfter;
            await product.save({ session });

            results.push(stockMovement);
        }

        await session.commitTransaction();
        session.endSession();

        return successResponse(res, 201, 'Stock movements recorded successfully', results);

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('createStockMovements error:', err);
        return errorResponse(res, 400, err.message || 'An error occurred during stock movement processing.');
    }
};

/**
 * @desc    Get all stock movements for a boutique with filters
 * @route   GET /api/stock-movements
 * @access  Private
 */
exports.getStockMovements = async (req, res) => {
    try {
        // Advanced results middleware should handle most of this, 
        // but we can add specificity if needed.
        // For now, let's assume advancedResults is used in the route.
        return successResponse(res, 200, null, res.advancedResults);
    } catch (err) {
        console.error('getStockMovements error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred.');
    }
};
