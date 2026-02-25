const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'boutique', 'user'],
            default: 'user'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        isAlertedToNewDevice: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true // createdAt / updatedAt auto
    }
);

// Virtual for profile
UserSchema.virtual('profile', {
    ref: 'UserProfile',
    localField: '_id',
    foreignField: 'user',
    justOne: true
});

// Ensure virtuals are included in JSON
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);
