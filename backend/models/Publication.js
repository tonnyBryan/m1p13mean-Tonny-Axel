const mongoose = require('mongoose');

const PublicationSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        authorType: {
            type: String,
            enum: ['admin', 'boutique'],
            required: true
        },
        boutique: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Boutique',
            default: null
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        images: {
            type: [String],
            default: []
        },
        type: {
            type: String,
            enum: ['promotion', 'new_arrival', 'event', 'announcement', null],
            default: null
        },
        status: {
            type: String,
            enum: ['published', 'pending', 'rejected'],
            default: 'pending'
        },
        rejectedReason: {
            type: String,
            default: null,
            trim: true
        },
        publishedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

PublicationSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('Publication', PublicationSchema);
