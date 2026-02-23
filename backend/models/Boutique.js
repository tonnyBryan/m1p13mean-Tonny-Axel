const mongoose = require('mongoose');

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
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Boutique', BoutiqueSchema);