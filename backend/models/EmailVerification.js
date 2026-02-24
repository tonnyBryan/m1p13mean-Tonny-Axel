const mongoose = require('mongoose');

const EmailVerificationSchema = new mongoose.Schema(
    {
        email: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        code: { type: String, required: true },
        isUsed: { type: Boolean, default: false },
        attempts: { type: Number, default: 0 },
        expiresAt: { type: Date, required: true },
        authorizedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('EmailVerification', EmailVerificationSchema);
