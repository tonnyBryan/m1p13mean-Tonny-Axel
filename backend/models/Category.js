const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
    {
        boutique: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Boutique',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Un nom de catégorie doit être unique par boutique
CategorySchema.index({ boutique: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', CategorySchema);