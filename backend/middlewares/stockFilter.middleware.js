module.exports = (req, res, next) => {
    try {
        const rawStockFilter = req.query.stockFilter;

        if (!rawStockFilter || rawStockFilter === 'all') {
            delete req.query.stockFilter;
            return next();
        }

        delete req.query.stockFilter;

        // stockReal = stock - stockEngaged
        // On utilise $expr pour filtrer sur un champ calculé
        if (rawStockFilter === 'out-of-stock') {
            // stockReal === 0 : stock <= stockEngaged
            req.query.$expr = {
                $lte: [{ $subtract: ['$stock', '$stockEngaged'] }, 0]
            };
        } else if (rawStockFilter === 'low-stock') {
            // stockReal > 0 && stockReal <= 5
            req.query.$expr = {
                $and: [
                    { $gt: [{ $subtract: ['$stock', '$stockEngaged'] }, 0] },
                    { $lte: [{ $subtract: ['$stock', '$stockEngaged'] }, 5] }
                ]
            };
        } else if (rawStockFilter === 'in-stock') {
            // stockReal > 5
            req.query.$expr = {
                $gt: [{ $subtract: ['$stock', '$stockEngaged'] }, 5]
            };
        }

        return next();
    } catch (err) {
        console.error('stockFilter middleware error:', err);
        return next();
    }
};