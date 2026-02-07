const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
    {
        boutique: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Boutique',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        sku: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true
        },
        stock: {
            type: Number,
            required: true,
            default : 0
        },
        minOrderQty: {
            type: Number,
            required: true,
            default : 1
        },
        maxOrderQty: {
            type: Number,
            required: true,
            default : 50
        },
        regularPrice: {
            type: Number,
            required: true
        },
        salePrice: {
            type: Number
        },
        isSale: {
            type: Boolean,
            default: false
        },
        tags: {
            type: [String],
            default: []
        },
        images: {
            type: [String], // URLs des images
            default: []
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true // createdAt / updatedAt automatiques
    }
);

module.exports = mongoose.model('Product', ProductSchema);
