// chat/chat.llm.service.js
// Provider selected via LLM_PROVIDER env variable:
//   'groq' (default) | 'claude' | 'openai' | 'gemini'

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'groq';

// ── Groq ──────────────────────────────────────────────────────────────────────
async function callGroq(systemPrompt, userMessage) {
    const Groq = require('groq-sdk');
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await client.chat.completions.create({
        model:                 'llama-3.3-70b-versatile',
        max_completion_tokens: 4096,
        temperature:           0.2,
        top_p:                 1,
        stream:                false,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userMessage  },
        ],
    });

    const content      = response.choices[0].message.content;
    const finishReason = response.choices[0].finish_reason;

    if (finishReason === 'length') {
        console.warn('[chat.llm] Groq response truncated (finish_reason: length).');
    }

    return content;
}

// ── Claude (Anthropic) ────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userMessage) {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 4096,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userMessage }],
    });

    return response.content[0].text;
}

// ── OpenAI (GPT-4o) ───────────────────────────────────────────────────────────
async function callOpenAI(systemPrompt, userMessage) {
    const OpenAI = require('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
        model:           'gpt-4o',
        max_tokens:      4096,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userMessage  },
        ],
    });

    return response.choices[0].message.content;
}

// ── Google Gemini ─────────────────────────────────────────────────────────────
async function callGemini(systemPrompt, userMessage) {
    const { GoogleGenAI } = require('@google/genai');
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await client.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        config: {
            systemInstruction: systemPrompt,
            temperature:       0.2,
            maxOutputTokens:   4096,
        },
        contents: userMessage,
    });

    return response.text;
}

// ── Shared caller ─────────────────────────────────────────────────────────────
async function callLLM(systemPrompt, userMessage) {
    switch (LLM_PROVIDER) {
        case 'openai': return callOpenAI(systemPrompt, userMessage);
        case 'claude': return callClaude(systemPrompt, userMessage);
        case 'gemini': return callGemini(systemPrompt, userMessage);
        case 'groq':
        default:       return callGroq(systemPrompt, userMessage);
    }
}

// ── JSON parser ───────────────────────────────────────────────────────────────
function parseJSON(raw) {
    try {
        const clean = raw
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i,    '')
            .replace(/\s*```$/i,    '');
        return JSON.parse(clean);
    } catch (err) {
        console.error('[chat.llm] parseJSON failed. Full raw response:\n', raw);
        throw new Error(`LLM returned invalid JSON. Length: ${raw.length} chars.`);
    }
}

module.exports = { callLLM, parseJSON };