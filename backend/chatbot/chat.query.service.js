// chat/chat.query.service.js
const mongoose = require('mongoose');

// ── Whitelists ────────────────────────────────────────────────────────────────

const ALLOWED_COLLECTIONS = [
    'commandes', 'products', 'stockmovements', 'categories',
    'wishlists', 'productratings', 'ventes', 'inventorycounts',
    'livraisonconfigs', 'notifications',
];

const ALLOWED_OPERATIONS = ['find', 'aggregate', 'count', 'findOne'];

const FORBIDDEN_FIELDS = [
    'password', 'token', 'refreshToken', 'accessToken',
    'email', 'phone', 'paymentDetails', 'cardNumber',
];

const FORBIDDEN_STAGES = [
    '$out', '$merge', '$indexStats', '$currentOp', '$listSessions',
    '$planCacheStats', '$collStats',
];

// Fields that hold ObjectId references — always convert string → ObjectId
const OBJECTID_FIELDS = [
    'boutique', '_id', 'user', 'product', 'seller', 'owner',
    'category', 'recipient', 'order', 'createdBy',
    'products.boutique', 'items.product',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isObjectIdString(val) {
    return typeof val === 'string' && /^[a-f\d]{24}$/i.test(val);
}

/**
 * Recursively walk the entire object and convert any 24-hex string
 * sitting under a known ObjectId field key into a real ObjectId.
 * This fixes the bug where LLM puts boutique/product IDs as plain strings.
 */
function resolveObjectIds(obj, depth = 0) {
    if (depth > 15 || obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => resolveObjectIds(item, depth + 1));
    }

    if (typeof obj === 'object') {
        const result = {};
        for (const key of Object.keys(obj)) {
            const val = obj[key];
            // If the key is a known ObjectId field and value is a 24-hex string → convert
            if (OBJECTID_FIELDS.includes(key) && isObjectIdString(val)) {
                result[key] = new mongoose.Types.ObjectId(val);
            } else {
                result[key] = resolveObjectIds(val, depth + 1);
            }
        }
        return result;
    }

    return obj;
}

function findForbiddenField(obj, depth = 0) {
    if (depth > 10 || typeof obj !== 'object' || obj === null) return null;
    for (const key of Object.keys(obj)) {
        const cleanKey = key.replace(/^\$/, '');
        if (FORBIDDEN_FIELDS.includes(cleanKey)) return key;
        const found = findForbiddenField(obj[key], depth + 1);
        if (found) return found;
    }
    return null;
}

function findForbiddenStage(pipeline) {
    if (!Array.isArray(pipeline)) return null;
    for (const stage of pipeline) {
        for (const key of Object.keys(stage)) {
            if (FORBIDDEN_STAGES.includes(key)) return key;
        }
    }
    return null;
}

/**
 * Ensure boutique scope is present. Inject if missing.
 * ObjectId conversion is handled separately by resolveObjectIds.
 */
function enforceBoutiqueScope(query, boutiqueId) {
    // notifications scoped by recipient, not boutique
    if (query.collection === 'notifications') return query;

    const oid = new mongoose.Types.ObjectId(boutiqueId);

    if (query.operation === 'aggregate') {
        const pipeline = query.pipeline || [];
        const firstStage = pipeline[0];

        if (firstStage && firstStage.$match) {
            const match = firstStage.$match;
            // Always overwrite boutique with a real ObjectId (even if LLM put a string)
            if (!match.boutique && !match['products.boutique']) {
                match.boutique = oid;
            } else {
                match.boutique = oid; // force correct ObjectId
            }
        } else {
            pipeline.unshift({ $match: { boutique: oid } });
        }
        return { ...query, pipeline };
    }

    // find / findOne / count
    const filter = query.filter || {};
    filter.boutique = oid; // always force correct ObjectId
    return { ...query, filter };
}

/**
 * Resolve date placeholder strings to real Date objects.
 */
function resolveDatePlaceholders(obj) {
    if (typeof obj === 'string') {
        const now = new Date();
        const todayStart = new Date(now); todayStart.setUTCHours(0, 0, 0, 0);
        const todayEnd   = new Date(now); todayEnd.setUTCHours(23, 59, 59, 999);
        const weekStart  = new Date(now); weekStart.setUTCDate(weekStart.getUTCDate() - 6); weekStart.setUTCHours(0, 0, 0, 0);
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const monthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        const yearStart  = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        const yearEnd    = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
        const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        const lastMonthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));

        const map = {
            '<TODAY_START>': todayStart, '<TODAY_END>': todayEnd,
            '<WEEK_START>':  weekStart,  '<WEEK_END>':  todayEnd,
            '<MONTH_START>': monthStart, '<MONTH_END>': monthEnd,
            '<YEAR_START>':  yearStart,  '<YEAR_END>':  yearEnd,
            '<LAST_MONTH_START>': lastMonthStart, '<LAST_MONTH_END>': lastMonthEnd,
        };
        return map[obj] ?? obj;
    }
    if (Array.isArray(obj)) return obj.map(resolveDatePlaceholders);
    if (typeof obj === 'object' && obj !== null) {
        const result = {};
        for (const key of Object.keys(obj)) result[key] = resolveDatePlaceholders(obj[key]);
        return result;
    }
    return obj;
}

// ── Validator ─────────────────────────────────────────────────────────────────

function validateQuery(rawQuery, boutiqueId) {
    if (!ALLOWED_COLLECTIONS.includes(rawQuery.collection))
        return { valid: false, reason: `Collection "${rawQuery.collection}" is not allowed.` };

    if (!ALLOWED_OPERATIONS.includes(rawQuery.operation))
        return { valid: false, reason: `Operation "${rawQuery.operation}" is not allowed.` };

    const toScan = rawQuery.filter || rawQuery.pipeline || {};
    const forbidden = findForbiddenField(toScan);
    if (forbidden)
        return { valid: false, reason: `Forbidden field: "${forbidden}".` };

    if (rawQuery.operation === 'aggregate') {
        const badStage = findForbiddenStage(rawQuery.pipeline);
        if (badStage)
            return { valid: false, reason: `Forbidden stage: "${badStage}".` };
    }

    if (rawQuery.limit && rawQuery.limit > 200) rawQuery.limit = 200;

    // Order matters:
    // 1. resolve date placeholders (string replacements, safe first)
    // 2. resolve ObjectId strings recursively (LLM-generated IDs)
    // 3. enforce boutique scope LAST — injects real ObjectId, must not be overwritten
    let safeQuery = resolveDatePlaceholders(rawQuery);
    safeQuery = resolveObjectIds(safeQuery);
    safeQuery = enforceBoutiqueScope(safeQuery, boutiqueId); // always last

    return { valid: true, query: safeQuery };
}

// ── Executor ──────────────────────────────────────────────────────────────────

async function executeQuery(validatedQuery) {
    const db  = mongoose.connection.db;
    const col = db.collection(validatedQuery.collection);

    switch (validatedQuery.operation) {
        case 'count':
            return { count: await col.countDocuments(validatedQuery.filter || {}) };
        case 'findOne':
            return await col.findOne(validatedQuery.filter || {}, { projection: validatedQuery.projection || {} });
        case 'find':
            return await col
                .find(validatedQuery.filter || {}, { projection: validatedQuery.projection || {} })
                .sort(validatedQuery.sort || {})
                .limit(validatedQuery.limit || 50)
                .toArray();
        case 'aggregate':
            return await col.aggregate(validatedQuery.pipeline || []).toArray();
        default:
            throw new Error(`Unsupported operation: ${validatedQuery.operation}`);
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

async function runQueries(queries, boutiqueId, userId) {
    const results = {};

    for (let rawQuery of queries) {
        // Resolve REQUESTER_USER_ID placeholder for notifications
        // NOTE: use string replace on serialized form BEFORE ObjectId conversion
        // (validateQuery will convert ObjectIds after this step)
        if (userId && JSON.stringify(rawQuery).includes('REQUESTER_USER_ID')) {
            rawQuery = JSON.parse(
                JSON.stringify(rawQuery).replace(/REQUESTER_USER_ID/g, userId)
            );
        }

        const alias = rawQuery.alias || rawQuery.collection;
        const validation = validateQuery(rawQuery, boutiqueId);

        if (!validation.valid) {
            console.warn(`[chat.query] Rejected "${alias}": ${validation.reason}`);
            results[alias] = { error: validation.reason };
            continue;
        }

        try {
            // Log the final validated query to confirm ObjectId conversion
            console.log(`[chat.query] Executing "${alias}":`, JSON.stringify(validation.query, null, 2).slice(0, 300));
            results[alias] = await executeQuery(validation.query);
            console.log(`[chat.query] "${alias}" result:`, JSON.stringify(results[alias]).slice(0, 150));
        } catch (err) {
            console.error(`[chat.query] Execution error "${alias}":`, err.message);
            results[alias] = { error: 'Query execution failed.' };
        }
    }

    return { success: true, results };
}

module.exports = { runQueries };