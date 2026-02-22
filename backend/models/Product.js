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
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true
        },
        stock: {
            type: Number,
            required: true,
            default : 0
        },
        stockEngaged: {
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
        avgRating: {
            type: Number,
            default: 0
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Champ virtuel pour le prix effectif
ProductSchema.virtual('effectivePrice').get(function() {
    return this.isSale && this.salePrice ? this.salePrice : this.regularPrice;
});

ProductSchema.virtual('stockReal').get(function() {
    return Math.max(0, this.stock - this.stockEngaged);
});


// Index pour optimiser les recherches par prix
ProductSchema.index({ regularPrice: 1 });
ProductSchema.index({ salePrice: 1 });

module.exports = mongoose.model('Product', ProductSchema);
