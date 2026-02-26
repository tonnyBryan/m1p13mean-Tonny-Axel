const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true // token hashé
    },
    expiresAt: {
        type: Date,
        required: true
    },
    // Session info
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    device: { type: String, default: null },    // "Mobile", "Desktop", "Tablet"
    browser: { type: String, default: null },   // "Chrome", "Firefox", "Safari"
    os: { type: String, default: null },        // "Windows", "macOS", "Android", "iOS"
    location: { type: String, default: null },  // "Antananarivo, MG"
    isRevoked: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);