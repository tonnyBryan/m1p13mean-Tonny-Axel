const mongoose = require('mongoose');

const SupportRequestSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        isAnswered: {
            type: Boolean,
            default: false
        },
        replies: [
            {
                subject: { type: String, required: true },
                text: { type: String, required: true },      // HTML sanitisé
                sentAt: { type: Date, default: Date.now },
                sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model('SupportRequest', SupportRequestSchema);
