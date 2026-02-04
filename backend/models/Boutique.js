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
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Boutique', BoutiqueSchema);
