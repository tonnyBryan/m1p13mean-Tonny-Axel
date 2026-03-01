const mongoose = require('mongoose');

const OAuthExchangeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }  // TTL auto-delete when expiresAt is reached
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('OAuthExchange', OAuthExchangeSchema);