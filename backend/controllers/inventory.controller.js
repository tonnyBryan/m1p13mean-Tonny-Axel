const InventoryCount = require('../models/InventoryCount');
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const mongoose = require('mongoose');

exports.createInventoryCount = async (req, res) => {
    let session = null;
    try {
        const { boutiqueId, note, lines } = req.body;
        const createdBy = req.user.id;

        session = await mongoose.startSession();
        session.startTransaction();

        const inventoryLines = [];

        for (const line of lines) {
            const product = await Product.findById(line.product).session(session);
            if (!product) {
                throw new Error(`Produit introuvable: ${line.product}`);
            }

            const stockBefore = product.stock;
            const countedQuantity = line.countedQuantity;

            let movementId = null;
            let movementCreated = false;

            if (countedQuantity !== stockBefore) {
                const diff = countedQuantity - stockBefore;
                const type = diff > 0 ? 'IN' : 'OUT';
                const quantity = Math.abs(diff);

                const movement = new StockMovement({
                    boutique: boutiqueId,
                    product: product._id,
                    type,
                    quantity,
                    stockBefore,
                    stockAfter: countedQuantity,
                    note: note || 'Régularisation inventaire',
                    source: 'inventory',
                    createdBy
                });

                await movement.save({ session });
                movementId = movement._id;
                movementCreated = true;

                // Update product stock
                product.stock = countedQuantity;
                await product.save({ session });
            }

            inventoryLines.push({
                product: product._id,
                countedQuantity,
                stockBefore,
                movementCreated,
                movementId
            });
        }

        const inventoryCount = new InventoryCount({
            boutique: boutiqueId,
            createdBy,
            note,
            lines: inventoryLines
        });

        await inventoryCount.save({ session });

        await session.commitTransaction();
        return successResponse(res, 201, 'Inventaire enregistré avec succès', inventoryCount);

    } catch (err) {
        if (session) await session.abortTransaction();
        console.error('createInventoryCount error:', err);
        return errorResponse(res, 500, err.message || 'Erreur lors de la création de l\'inventaire');
    } finally {
        if (session) session.endSession();
    }
};

exports.getInventoryCounts = async (req, res) => {
    try {
        // advancedResults middleware will handle filtering if used
        if (res.advancedResults) {
            return successResponse(res, 200, null, res.advancedResults);
        }

        const counts = await InventoryCount.find({ boutique: req.query.boutique })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        return successResponse(res, 200, null, counts);
    } catch (err) {
        return errorResponse(res, 500, 'Erreur lors de la récupération des inventaires');
    }
};

exports.getInventoryCountById = async (req, res) => {
    try {
        const count = await InventoryCount.findById(req.params.id)
            .populate('createdBy', 'name')
            .populate('lines.product', 'name sku images')
            .populate('lines.movementId');

        if (!count) return errorResponse(res, 404, 'Inventaire introuvable');

        return successResponse(res, 200, null, count);
    } catch (err) {
        return errorResponse(res, 500, 'Erreur lors de la récupération de l\'inventaire');
    }
};
