// chat/chat.controller.js

const Boutique     = require('../models/Boutique');
const ChatSession  = require('./chat.session.schema');
const { processMessage } = require('./chat.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// How many past messages to send to the LLM as context (last N)
const HISTORY_WINDOW = 10;

// ── POST /api/chat/message ────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body || {};

        if (!message || message.toString().trim() === '') {
            return errorResponse(res, 400, 'Message is required.');
        }
        if (message.length > 1000) {
            return errorResponse(res, 400, 'Message is too long. Maximum 1000 characters.');
        }

        // ── Get boutique ──────────────────────────────────────────────────────
        const boutique = await Boutique.findOne({ owner: req.user._id }).select('_id name');
        if (!boutique) {
            return errorResponse(res, 404, 'Boutique not found for the current user.');
        }

        // ── Load or create session ────────────────────────────────────────────
        let session = await ChatSession.findOne({ boutique: boutique._id });
        if (!session) {
            session = await ChatSession.create({ boutique: boutique._id, messages: [] });
        }

        // ── Build history window for the LLM ─────────────────────────────────
        const history = session.messages
            .slice(-HISTORY_WINDOW)
            .map(m => ({ role: m.role, content: m.content }));

        // ── Process through 2-phase pipeline ─────────────────────────────────
        const result = await processMessage({
            message:      message.toString().trim(),
            boutiqueId:   boutique._id.toString(),
            boutiqueName: boutique.name,
            history,
        });

        // ── Persist both messages ─────────────────────────────────────────────
        // Drop oldest 20 if approaching cap
        if (session.messages.length >= 98) {
            session.messages = session.messages.slice(20);
        }

        session.messages.push({
            role:    'user',
            content: message.toString().trim(),
        });

        const assistantContent = result.summary || result.data?.message || 'Done.';
        session.messages.push({
            role:               'assistant',
            content:            assistantContent,
            structuredResponse: result,
        });

        await session.save();

        return successResponse(res, 200, null, result);

    } catch (err) {
        console.error('[chat.controller] Unexpected error:', err);
        return errorResponse(res, 500, 'An unexpected error occurred. Please try again.');
    }
};

// ── GET /api/chat/history ─────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
    try {
        const boutique = await Boutique.findOne({ owner: req.user._id }).select('_id');
        if (!boutique) return errorResponse(res, 404, 'Boutique not found.');

        const session = await ChatSession.findOne({ boutique: boutique._id });
        if (!session) return successResponse(res, 200, null, { messages: [] });

        const messages = session.messages.map(m => ({
            role:               m.role,
            content:            m.content,
            structuredResponse: m.structuredResponse || null,
            createdAt:          m.createdAt,
        }));

        return successResponse(res, 200, null, { messages });

    } catch (err) {
        console.error('[chat.controller] getHistory error:', err);
        return errorResponse(res, 500, 'An unexpected error occurred.');
    }
};

// ── DELETE /api/chat/history ──────────────────────────────────────────────────
exports.clearHistory = async (req, res) => {
    try {
        const boutique = await Boutique.findOne({ owner: req.user._id }).select('_id');
        if (!boutique) return errorResponse(res, 404, 'Boutique not found.');

        await ChatSession.findOneAndUpdate(
            { boutique: boutique._id },
            { $set: { messages: [] } }
        );

        return successResponse(res, 200, 'Conversation cleared.');

    } catch (err) {
        console.error('[chat.controller] clearHistory error:', err);
        return errorResponse(res, 500, 'An unexpected error occurred.');
    }
};