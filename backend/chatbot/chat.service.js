// chat/chat.service.js
// Orchestrates the 2-phase pipeline.

const { callLLM, parseJSON } = require('./chat.llm.service');
const { runQueries }          = require('./chat.query.service');
const { getQuerySystem }      = require('./prompts/querySystem');
const { getResponseSystem }   = require('./prompts/responseSystem');

// Lightweight pre-check prompt — avoids sending the huge querySystem prompt
// for simple greetings or non-data questions.
const PRE_CHECK_SYSTEM = `You are a routing assistant. Analyze the user's message and respond ONLY with a JSON object.

Respond with:
{ "is_data_question": true }   — if the user is asking for data, stats, reports, lists, or insights about their boutique
{ "is_data_question": false }  — if it is a greeting, a capabilities question, chitchat, or anything not requiring database access

No other output. JSON only.`;

async function processMessage({ message, boutiqueId, boutiqueName, userId, history = [] }) {

    const now = new Date();
    const dateContext = `Current UTC datetime: ${now.toISOString()}. Day of week: ${now.toUTCString().split(',')[0]}.`;

    // Build history prefix (last 6 messages)
    let contextPrefix = '';
    if (history.length > 0) {
        contextPrefix = history.slice(-6)
            .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
            .join('\n') + '\n\n';
    }

    const userContext = `Boutique ID: ${boutiqueId}. Requester User ID: ${userId}.`;
    const fullUserMessage = contextPrefix + dateContext + '\n' + userContext + '\n\nUser message: ' + message;

    // ═══════════════════════════════════════════════════════
    // PRE-CHECK — is this a data question ?
    // Avoids loading the heavy querySystem prompt for greetings
    // ═══════════════════════════════════════════════════════
    let isDataQuestion = true; // default: assume data question
    try {
        const preRaw   = await callLLM(PRE_CHECK_SYSTEM, message);
        const preCheck = parseJSON(preRaw);
        isDataQuestion = preCheck.is_data_question === true;
    } catch (e) {
        // If pre-check fails, continue with full Phase 1 anyway
        console.warn('[chat.service] Pre-check failed, falling back to full Phase 1:', e.message);
    }

    // ═══════════════════════════════════════════════════════
    // SHORT-CIRCUIT — non-data question
    // Answer directly without Phase 1 heavy prompt
    // ═══════════════════════════════════════════════════════
    if (!isDataQuestion) {
        const lang = detectLang(message);
        const directSystemPrompt = getResponseSystem({ boutiqueName, lang });
        const directInput = JSON.stringify({
            originalMessage: message,
            intent: 'direct_answer',
            queryResults: {},
        });

        try {
            const raw2  = await callLLM(directSystemPrompt, directInput);
            const phase2 = parseJSON(raw2);
            return sanitizeResponse(phase2, lang);
        } catch (err) {
            console.error('[chat.service] Direct answer error:', err.message);
            return buildErrorResponse();
        }
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 1 — Query generation (full prompt)
    // ═══════════════════════════════════════════════════════
    const querySystemPrompt = getQuerySystem({ boutiqueId, boutiqueName });
    let phase1;
    try {
        const raw1 = await callLLM(querySystemPrompt, fullUserMessage);
        phase1     = parseJSON(raw1);
    } catch (err) {
        console.error('[chat.service] Phase 1 LLM error:', err.message);
        return buildErrorResponse();
    }

    const lang = phase1.lang || 'en';

    // Refusal or direct answer from Phase 1
    if (!phase1.needs_data) {
        return {
            type:    'text',
            lang,
            title:   '',
            summary: '',
            data: {
                message: phase1.direct_answer || 'I could not process your request.',
                variant: phase1.intent === 'refused' ? 'warning' : 'info',
            },
            actions: [],
        };
    }

    // ═══════════════════════════════════════════════════════
    // Execute MongoDB queries
    // ═══════════════════════════════════════════════════════
    let queryResults = {};
    if (phase1.queries && phase1.queries.length > 0) {
        try {
            console.log(phase1.queries)
            console.log(JSON.stringify(phase1.queries))

            const { results } = await runQueries(phase1.queries, boutiqueId, userId);
            queryResults = results;
        } catch (err) {
            console.error('[chat.service] Query execution error:', err.message);
            return buildErrorResponse(
                lang === 'fr'
                    ? 'Une erreur est survenue lors de la récupération des données.'
                    : 'An error occurred while fetching your data.'
            );
        }
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 2 — Response formatting
    // ═══════════════════════════════════════════════════════
    const responseSystemPrompt = getResponseSystem({ boutiqueName, lang });
    const phase2Input = JSON.stringify({
        originalMessage: message,
        intent:          phase1.intent,
        queryResults,
    });

    let phase2;
    try {
        const raw2 = await callLLM(responseSystemPrompt, phase2Input);
        phase2     = parseJSON(raw2);
    } catch (err) {
        console.error('[chat.service] Phase 2 LLM error:', err.message);
        return buildErrorResponse(
            lang === 'fr'
                ? 'Les données ont été récupérées mais une erreur est survenue lors du formatage.'
                : 'Data was fetched but an error occurred during formatting.'
        );
    }

    return sanitizeResponse(phase2, lang);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['kpi', 'table', 'chart', 'list', 'text', 'mixed'];

function sanitizeResponse(phase2, lang) {
    if (!ALLOWED_TYPES.includes(phase2.type)) {
        phase2.type = 'text';
        phase2.data = { message: phase2.summary || 'Here is your data.', variant: 'info' };
    }
    phase2.lang = phase2.lang || lang;
    return phase2;
}

function buildErrorResponse(message) {
    return {
        type:    'text',
        lang:    'en',
        title:   'Error',
        summary: '',
        data: { message: message || 'An error occurred while processing your request. Please try again.', variant: 'error' },
        actions: [],
    };
}

// Simple heuristic lang detection as fallback
function detectLang(text) {
    const frWords = ['quels', 'combien', 'comment', 'bonjour', 'que', 'est-ce', 'puis-je', 'mon', 'ma', 'les', 'des', 'pour', 'avec'];
    const lower   = text.toLowerCase();
    const score   = frWords.filter(w => lower.includes(w)).length;
    return score >= 1 ? 'fr' : 'en';
}

module.exports = { processMessage };