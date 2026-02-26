const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    label: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    description: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
});

const CardInfoSchema = new mongoose.Schema({
    cardNumber: { type: String },
    cardName: { type: String },
    expiryDate: { type: String },
    cvv: { type: String },
}, { _id: false });

const UserProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phoneNumber: { type: String },
        photo: { type: String, default: '/user.svg' },
        addresses: { type: [AddressSchema], default: [] },
        description: { type: String },
        cardInfo: { type: CardInfoSchema, default: null }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('UserProfile', UserProfileSchema);
