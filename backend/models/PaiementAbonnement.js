const mongoose = require('mongoose');

const PaiementAbonnementSchema = new mongoose.Schema(
    {
        boutique: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Boutique',
            required: true
        },
        planType: {
            type: String,
            enum: ['A', 'B'],
            default: null
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: 'MGA',
            trim: true
        },
        periodStart: {
            type: Date,
            required: true
        },
        periodEnd: {
            type: Date,
            required: true
        },
        paidAt: {
            type: Date,
            default: Date.now
        },
        method: {
            type: String,
            default: null,
            trim: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('PaiementAbonnement', PaiementAbonnementSchema);
