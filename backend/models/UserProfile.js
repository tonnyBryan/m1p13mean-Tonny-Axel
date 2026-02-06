const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    label: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    description: { type: String },
    isDefault: { type: Boolean, default: false }
}, { _id: false });

const UserProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        firstName: { type: String },
        lastName: { type: String },
        phoneNumber: { type: String },
        photo: { type: String },
        addresses: { type: [AddressSchema], default: [] },
        description: { type: String }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('UserProfile', UserProfileSchema);
