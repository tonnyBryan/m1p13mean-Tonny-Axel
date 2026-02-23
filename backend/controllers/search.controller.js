// controllers/search.controller.js

const Product = require('../models/Product');
const Boutique = require('../models/Boutique');
const { errorResponse, successResponse } = require("../utils/apiResponse");
const ResultSearch = require("../models/dto/ResultSearch");
const Commande = require('../models/Commande');
const Vente = require('../models/Vente');
const mongoose = require('mongoose');


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


exports.searchGlobalForBoutique = async (req, res) => {
    try {
        const query = req.query.q?.trim();
        if (!query || query.length < 2) {
            return errorResponse(res, 400, 'Search query must be at least 2 characters.');
        }

        const Boutique = require('../models/Boutique');
        const boutique = await Boutique.findOne({ owner: req.user._id }).select('_id');
        if (!boutique) return errorResponse(res, 404, 'Boutique not found.');

        const regex = new RegExp(query, 'i');
        const isObjectId = /^[a-f\d]{24}$/i.test(query);
        const results = [];

        // Produits — nom ou SKU
        const products = await Product.find({
            boutique: boutique._id,
            $or: [
                { name: regex },
                { sku: regex }
            ]
        })
            .select('name sku images isActive')
            .limit(5)
            .lean();

        products.forEach(p => {
            results.push({
                type: 'product',
                id: p._id.toString(),
                name: p.name,
                description: `SKU: ${p.sku || '—'} · ${p.isActive ? 'Active' : 'Inactive'}`,
                image: p.images?.[0] || null,
                link: `/store/app/products/${p._id}`
            });
        });

        // Commandes — par ObjectId uniquement
        if (isObjectId) {
            const commandes = await Commande.find({
                boutique: boutique._id,
                _id: query
            })
                .select('totalAmount status createdAt')
                .limit(3)
                .lean();

            commandes.forEach(c => {
                results.push({
                    type: 'order',
                    id: c._id.toString(),
                    name: `Order #${c._id.toString()}`,
                    description: `${c.status} · ${c.totalAmount} Ar`,
                    image: null,
                    link: `/store/app/orders/${c._id}`
                });
            });

            // Ventes — par ObjectId uniquement
            const ventes = await Vente.find({
                boutique: boutique._id,
                _id: query
            })
                .select('totalAmount status saleDate client')
                .limit(3)
                .lean();

            ventes.forEach(v => {
                results.push({
                    type: 'sale',
                    id: v._id.toString(),
                    name: `Sale #${v._id.toString()}`,
                    description: `${v.client?.name || 'Client'} · ${v.totalAmount} Ar`,
                    image: null,
                    link: `/store/app/vente-liste/${v._id}`
                });
            });
        }

        return successResponse(res, 200, null, results);
    } catch (err) {
        console.error('searchGlobalForBoutique error:', err);
        return errorResponse(res, 500, 'Search failed. Please try again.');
    }
};


exports.searchGlobalForAdmin = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Query too short' });
        }

        const query = q.trim();
        const regex = new RegExp(query, 'i');

        const results = [];

        // Users (role = user) — par name, email, ou fullName via UserProfile
        const userProfileMatches = await mongoose.model('UserProfile').find({
            $or: [
                { firstName: regex },
                { lastName: regex }
            ]
        }).select('user').lean();

        const profileUserIds = userProfileMatches.map(p => p.user);

        const users = await mongoose.model('User').find({
            role: 'user',
            $or: [
                { name: regex },
                { email: regex },
                { _id: { $in: profileUserIds } }
            ]
        })
            .populate('profile', 'firstName lastName photo')
            .limit(5)
            .lean();

        users.forEach(u => {
            const fullName = u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : null;
            results.push({
                type: 'user',
                id: u._id,
                name: fullName || u.name,
                description: u.email,
                image: u.profile?.photo || null,
                link: `/admin/app/users/${u._id}`
            });
        });

        // Boutiques — par nom
        const boutiques = await mongoose.model('Boutique').find({
            name: regex
        })
            .limit(5)
            .lean();

        boutiques.forEach(b => {
            results.push({
                type: 'boutique',
                id: b._id,
                name: b.name,
                description: b.isValidated ? 'Validated' : 'Pending validation',
                image: b.logo || null,
                link: `/admin/app/boutiques/${b._id}`
            });
        });

        // Support Requests — par email
        const supportRequests = await mongoose.model('SupportRequest').find({
            email: regex
        })
            .limit(3)
            .lean();

        supportRequests.forEach(s => {
            results.push({
                type: 'support',
                id: s._id,
                name: s.fullName,
                description: s.email,
                image: null,
                link: `/admin/app/support-requests/` + s._id + '/reply'
            });
        });

        return res.json({ success: true, results });

    } catch (err) {
        console.error('searchGlobalForAdmin error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};