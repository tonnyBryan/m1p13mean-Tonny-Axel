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
// Also matches dotted paths like "productInfo.boutique", "items.product", etc.
const OBJECTID_FIELDS = [
    'boutique', '_id', 'user', 'product', 'seller', 'owner',
    'category', 'recipient', 'order', 'createdBy',
    'products.boutique', 'items.product',
];

// Base field names — used to match ANY dotted path ending with these names
// e.g. "productInfo.boutique", "info.product", "$lookup result.boutique"
const OBJECTID_FIELD_SUFFIXES = [
    'boutique', '_id', 'user', 'product', 'seller', 'owner',
    'category', 'recipient', 'order', 'createdBy',
];

function isObjectIdKey(key) {
    if (OBJECTID_FIELDS.includes(key)) return true;
    // Match any dotted path ending with a known ObjectId field name
    // e.g. "productInfo.boutique" → ends with "boutique" ✓
    const lastPart = key.split('.').pop();
    return OBJECTID_FIELD_SUFFIXES.includes(lastPart);
}

// Collections that do NOT have a direct "boutique" field.
// Their scope is enforced via $lookup on products (or recipient for notifications).
// enforceBoutiqueScope must NOT inject { boutique } on these — it would match nothing.
const NO_DIRECT_BOUTIQUE_SCOPE = [
    'notifications',   // scoped by recipient (user._id)
    'productratings',  // scoped via $lookup → products.boutique
    'wishlists',       // scoped via products[].boutique
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isObjectIdString(val) {
    return typeof val === 'string' && /^[a-f\d]{24}$/i.test(val);
}

/**
 * Recursively walk the entire object and convert any 24-hex string
 * sitting under a known ObjectId field key into a real ObjectId.
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
            if (isObjectIdKey(key) && isObjectIdString(val)) {
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
 * Ensure boutique scope is present and correct.
 *
 * Collections in NO_DIRECT_BOUTIQUE_SCOPE are skipped entirely —
 * they scope via $lookup or via recipient, not a direct boutique field.
 *
 * For all other collections: inject / overwrite boutique with a real ObjectId.
 */
function enforceBoutiqueScope(query, boutiqueId) {
    if (NO_DIRECT_BOUTIQUE_SCOPE.includes(query.collection)) {
        return query; // leave pipeline untouched — LLM handles scope via $lookup
    }

    const oid = new mongoose.Types.ObjectId(boutiqueId);

    if (query.operation === 'aggregate') {
        const pipeline = query.pipeline || [];
        const firstStage = pipeline[0];

        if (firstStage && firstStage.$match) {
            firstStage.$match.boutique = oid; // always overwrite
        } else {
            pipeline.unshift({ $match: { boutique: oid } });
        }
        return { ...query, pipeline };
    }

    // find / findOne / count
    const filter = query.filter || {};
    filter.boutique = oid;
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
    // 1. resolve date placeholders (string replacements)
    // 2. resolve ObjectId strings recursively
    // 3. enforce boutique scope LAST
    let safeQuery = resolveDatePlaceholders(rawQuery);
    safeQuery = resolveObjectIds(safeQuery);
    safeQuery = enforceBoutiqueScope(safeQuery, boutiqueId);

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
        // Resolve REQUESTER_USER_ID placeholder before ObjectId conversion
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
            console.log(`[chat.query] Executing "${alias}":`, JSON.stringify(validation.query, null, 2).slice(0, 400));
            results[alias] = await executeQuery(validation.query);
            console.log(`[chat.query] "${alias}" result:`, JSON.stringify(results[alias]).slice(0, 200));
        } catch (err) {
            console.error(`[chat.query] Execution error "${alias}":`, err.message);
            results[alias] = { error: 'Query execution failed.' };
        }
    }

    return { success: true, results };
}

module.exports = { runQueries };