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
        }
    },
    {
        timestamps: true // createdAt / updatedAt auto
    }
);

module.exports = mongoose.model('User', UserSchema);
