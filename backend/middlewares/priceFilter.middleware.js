// Middleware product-specific: translate minPrice/maxPrice query params
// into a MongoDB $or filter: (isSale=true AND salePrice in range) OR (isSale=false AND regularPrice in range)
// Uses operator names without $ (gte/lte) so that the generic advancedResults middleware
// can later convert them to $gte/$lte.

module.exports = (req, res, next) => {
    try {
        const rawMin = req.query.minPrice;
        const rawMax = req.query.maxPrice;

        // Only set min/max when they are provided and valid numbers
        let min = undefined;
        let max = undefined;
        if (rawMin !== undefined && rawMin !== '') {
            const n = Number(rawMin);
            if (Number.isFinite(n)) min = n;
        }
        if (rawMax !== undefined && rawMax !== '') {
            const m = Number(rawMax);
            if (Number.isFinite(m)) max = m;
        }

        // If neither min nor max provided or both invalid, do nothing
        if (min === undefined && max === undefined) return next();

        // Read isSale param if provided (string from query), and then remove it to avoid conflicts
        const rawIsSale = req.query.isSale;
        let requestedIsSale = undefined;
        if (rawIsSale !== undefined) {
            // Normalize 'true'/'false' strings to boolean
            if (rawIsSale === 'true' || rawIsSale === true) requestedIsSale = true;
            else if (rawIsSale === 'false' || rawIsSale === false) requestedIsSale = false;
        }

        // Remove original params so they don't interfere with generic filtering
        delete req.query.minPrice;
        delete req.query.maxPrice;
        delete req.query.isSale;

        const orConditions = [];

        const saleCond = {};
        const regCond = {};

        if (min !== undefined) {
            saleCond.salePrice = saleCond.salePrice || {};
            saleCond.salePrice.gte = min; // advancedResults will convert gte -> $gte

            regCond.regularPrice = regCond.regularPrice || {};
            regCond.regularPrice.gte = min;
        }

        if (max !== undefined) {
            saleCond.salePrice = saleCond.salePrice || {};
            saleCond.salePrice.lte = max; // advancedResults will convert lte -> $lte

            regCond.regularPrice = regCond.regularPrice || {};
            regCond.regularPrice.lte = max;
        }

        // Only include condition if it has price constraints
        if (saleCond.salePrice) {
            saleCond.isSale = true;
        }

        if (regCond.regularPrice) {
            // Products not on sale (isSale false) should match regularPrice
            // Use a negative check to also include documents where isSale is missing
            // (regCond.isSale = { ne: true } -> advancedResults will convert to $ne)
            regCond.isSale = { ne: true };
        }

        // Decide which conditions to include based on requestedIsSale
        if (requestedIsSale === true) {
            if (saleCond.salePrice) orConditions.push(saleCond);
        } else if (requestedIsSale === false) {
            if (regCond.regularPrice) orConditions.push(regCond);
        } else {
            if (saleCond.salePrice) orConditions.push(saleCond);
            if (regCond.regularPrice) orConditions.push(regCond);
        }

        if (orConditions.length > 0) {
            // Attach the $or array directly to req.query as objects. advancedResults
            // will stringify req.query and convert operator names (gte/lte/ne) to $gte/$lte/$ne.
            req.query.$or = orConditions;
        }

        // console.log('priceFilter output:', JSON.stringify(req.query, null, 2));

        return next();
    } catch (err) {
        console.error('priceFilter middleware error:', err);
        return next();
    }
};
