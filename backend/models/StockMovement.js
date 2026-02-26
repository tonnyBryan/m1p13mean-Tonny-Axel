const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema(
    {
        boutique: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Boutique',
            required: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        type: {
            type: String,
            enum: ['IN', 'OUT'],
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [0, 'Quantity must be positive']
        },
        stockBefore: {
            type: Number,
            required: true
        },
        stockAfter: {
            type: Number,
            required: true
        },
        note: {
            type: String
        },
        source: {
            type: String,
            enum: ['manual', 'inventory', 'sale'],
            default: 'manual'
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('StockMovement', StockMovementSchema);
