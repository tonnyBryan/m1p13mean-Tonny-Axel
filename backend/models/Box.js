const mongoose = require('mongoose');

const BoxSchema = new mongoose.Schema(
    {
        number: {
            type: String,
            required: true,
            unique: true
        },
        pricePerMonth: {
            type: Number,
            required: true
        },
        isOccupied: {
            type: Boolean,
            default: false
        },
        boutiqueId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Boutique',
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Box', BoxSchema);
