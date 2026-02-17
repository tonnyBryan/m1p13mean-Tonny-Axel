// controllers/search.controller.js

const Product = require('../models/Product');
const Boutique = require('../models/Boutique');
const { errorResponse, successResponse } = require("../utils/apiResponse");
const ResultSearch = require("../models/dto/ResultSearch");

/**
 * GET /api/search?q=mot
 * Recherche globale produits et boutiques
 */
exports.globalSearch = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim() === '') {
            return errorResponse(res, 400, 'A search query is required. Please provide a search term.');
        }

        const regex = new RegExp(query, 'i');

        const products = await Product.find({
            isActive: true,
            $or: [
                { name: regex },
                { description: regex },
                { category: regex },
                { tags: regex },
                { sku: regex }
            ]
        })
            .populate('boutique', 'logo')
            .lean();

        const boutiques = await Boutique.find({
            isActive: true,
            $or: [
                { name: regex },
                { description: regex }
            ]
        }).lean();

        const results = [];

        products.forEach(p => {
            results.push(new ResultSearch({
                type: 'product',
                id: p._id.toString(),
                name: p.name,
                description: p.description,
                image: p.images[0] || p.boutique?.logo || null,
                link: `/v1/stores/${p.boutique?._id}/products/${p._id}`
            }));
        });

        boutiques.forEach(b => {
            results.push(new ResultSearch({
                type: 'boutique',
                id: b._id.toString(),
                name: b.name,
                description: b.description,
                image: b.logo || null,
                link: `/v1/stores/${b._id}`
            }));
        });

        return successResponse(res, 200, null, results);

    } catch (err) {
        console.error('globalSearch error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred while performing the search. Please try again later.');
    }
};
