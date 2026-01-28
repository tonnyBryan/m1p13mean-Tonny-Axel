const advancedResults = (model) => async (req, res, next) => {
    let queryObj = { ...req.query }; // copie des query params

    // On exclut certains champs réservés pour pagination et tri
    const excludeFields = ['page', 'limit', 'sort', 'fields'];
    excludeFields.forEach(f => delete queryObj[f]);

    // Transforme les opérateurs pour MongoDB ($gte, $lte, $regex...)
    // Ex: ?age[gte]=18&age[lte]=30 => { age: { $gte: 18, $lte: 30 } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
        /\b(gte|gt|lte|lt|regex|ne|in|nin)\b/g,
        match => `$${match}`
    );

    let query = JSON.parse(queryStr);

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

        const totalDocs = await model.countDocuments(query);
        const totalPages = Math.ceil(totalDocs / limit);

        res.advancedResults = {
            success: true,
            count: results.length,
            totalDocs,
            totalPages,
            page,
            data: results
        };

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = advancedResults;
