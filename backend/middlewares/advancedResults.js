const advancedResults = (model) => async (req, res, next) => {
    let queryObj = { ...req.query }; // copie des query params

    // Coerce booleans in query object ("true"/"false" -> true/false), recursively
    const coerceBooleans = (val) => {
        if (Array.isArray(val)) {
            return val.map(v => coerceBooleans(v));
        }
        if (val && typeof val === 'object') {
            Object.keys(val).forEach(k => {
                val[k] = coerceBooleans(val[k]);
            });
            return val;
        }
        if (val === 'true') return true;
        if (val === 'false') return false;
        return val;
    };

    queryObj = coerceBooleans(queryObj);

    // On exclut certains champs réservés pour pagination et tri
    const excludeFields = ['page', 'limit', 'sort', 'fields'];
    excludeFields.forEach(f => delete queryObj[f]);

    // Transforme les opérateurs pour MongoDB ($gte, $lte, $regex...)
    // Ex: ?age[gte]=18&age[lte]=30 => { age: { $gte: 18, $lte: 30 } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
        /\b(gte|gt|lte|lt|regex|ne|in|nin|options)\b/g,
        match => `$${match}`
    );

    let query = JSON.parse(queryStr);

    // CORRECTION: Gérer les regex avec options
    // MongoDB attend $regex et $options au même niveau
    Object.keys(query).forEach(key => {
        if (query[key] && typeof query[key] === 'object') {
            // Si on a à la fois $regex et $options
            if (query[key].$regex !== undefined && query[key].$options !== undefined) {
                // C'est déjà dans le bon format, ne rien faire
            } else if (query[key].$regex !== undefined) {
                // Si on a seulement $regex sans $options, c'est OK aussi
            }
        }
    });

    // Options de pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Options de tri
    let sort = req.query.sort ? req.query.sort.split(',').join(' ') : '-createdAt';

    // Fields (projection)
    const fields = req.query.fields ? req.query.fields.split(',').join(' ') : '-password';

    try {
        const results = await model
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select(fields);

        console.log("q = " +JSON.stringify(query));
        const totalDocs = await model.countDocuments(query);
        const totalPages = Math.ceil(totalDocs / limit);

        res.advancedResults = {
            items: results,
            pagination: {
                totalDocs,
                totalPages,
                page,
                limit
            }
        };

        next();
    } catch (err) {
        console.error('Advanced results error:', err);
        next(err);
    }
};

module.exports = advancedResults;