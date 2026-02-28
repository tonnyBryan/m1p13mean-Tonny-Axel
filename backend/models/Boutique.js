const mongoose = require('mongoose');

const CardInfoSchema = new mongoose.Schema({
    cardNumber: { type: String },
    cardName: { type: String },
    expiryDate: { type: String },
    cvv: { type: String },
}, { _id: false });

const PlanSchema = new mongoose.Schema({
    type: { type: String, enum: ['A', 'B'], default: null },
    priceToPayPerMonth: { type: Number, default: 0 },
    startDate: { type: Date, default: null }
}, { _id: false });

const BoutiqueSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        logo: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isValidated: {
            type: Boolean,
            default: false
        },
        isLocal: {
            type: Boolean,
            default: true  // true = boutique locale du centre, false = boutique externe
        },
        address: {
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null }
        },
        boxId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Box',
            default: null
        },
        plan: { type: PlanSchema, default: null },
        payment: { type: CardInfoSchema, default: null }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Boutique', BoutiqueSchema);
