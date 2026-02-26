// chat/chat.session.schema.js

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true,
        },
        // Raw text content — used to rebuild history for the LLM
        content: {
            type: String,
            required: true,
            maxlength: 2000,
        },
        // Structured UI response (only for assistant messages)
        structuredResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const ChatSessionSchema = new mongoose.Schema(
    {
        boutique: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Boutique',
            required: true,
        },
        // Cap messages array to last 100 entries to avoid unbounded growth
        messages: {
            type: [MessageSchema],
            default: [],
            validate: {
                validator: v => v.length <= 100,
                message: 'Session cannot exceed 100 messages.',
            },
        },
    },
    { timestamps: true }
);

// One active session per boutique (can extend to multiple sessions later)
ChatSessionSchema.index({ boutique: 1 });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);