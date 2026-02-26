const mongoose = require('mongoose');

const LivraisonConfigSchema = new mongoose.Schema(
    {
        boutique: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Boutique',
            required: true
        },
        isDeliveryAvailable: {
            type: Boolean,
            default: true
        },
        deliveryRules: {
            minPrice: { type: Number, default: 0 },
            baseDistanceKm: { type: Number, default: 0 },
            extraPricePerKm: { type: Number, default: 0 }
        },
        deliveryDays: [{
            day: { type: Number, required: true }, // 1 to 7
            isActive: { type: Boolean, default: true }
        }],
        orderCutoffTime: {
            type: String, // "HH:mm"
            default: "18:00"
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

module.exports = mongoose.model('LivraisonConfig', LivraisonConfigSchema);
