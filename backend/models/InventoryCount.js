const mongoose = require('mongoose');

const InventoryLineSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    countedQuantity: {
        type: Number,
        required: true
    },
    stockBefore: {
        type: Number,
        required: true
    },
    movementCreated: {
        type: Boolean,
        default: false
    },
    movementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StockMovement'
    }
});

const InventoryCountSchema = new mongoose.Schema(
    {
        boutique: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Boutique',
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        note: {
            type: String
        },
        lines: [InventoryLineSchema]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('InventoryCount', InventoryCountSchema);
