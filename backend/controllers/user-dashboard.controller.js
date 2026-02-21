const Commande = require('../models/Commande');
const Wishlist = require('../models/Wishlist');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * GET /api/user-dashboard/kpi
 * Retourne les KPI pour l'utilisateur connecté
 */
exports.getKpiResume = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        // Filtre commun: user + status not in ['draft','expired']
        const match = {
            user: userId,
            status: { $nin: ['draft', 'expired'] }
        };

        const agg = await Commande.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    pickupOrders: { $sum: { $cond: [{ $eq: ['$deliveryMode', 'pickup'] }, 1, 0] } },
                    deliveryOrders: { $sum: { $cond: [{ $eq: ['$deliveryMode', 'delivery'] }, 1, 0] } },
                    totalSpent: { $sum: { $ifNull: ['$totalAmount', 0] } },
                    totalDeliveryFees: { $sum: { $ifNull: ['$deliveryAddress.price', 0] } }
                }
            }
        ]);

        const metrics = agg && agg.length ? agg[0] : {
            totalOrders: 0,
            pickupOrders: 0,
            deliveryOrders: 0,
            totalSpent: 0,
            totalDeliveryFees: 0
        };

        const wishlistDoc = await Wishlist.findOne({ user: userId }).select('products').lean();
        const wishlistCount = wishlistDoc && Array.isArray(wishlistDoc.products) ? wishlistDoc.products.length : 0;

        const data = {
            totalOrders: metrics.totalOrders,
            pickupOrders: metrics.pickupOrders,
            deliveryOrders: metrics.deliveryOrders,
            totalSpent: metrics.totalSpent,
            totalDeliveryFees: metrics.totalDeliveryFees,
            wishlistCount
        };

        return successResponse(res, 200, 'User KPI summary retrieved successfully.', data);
    } catch (error) {
        console.error('getKpiResume error:', error);
        return errorResponse(res, 500, 'Unable to fetch KPI summary at this time. Please try again later.');
    }
};

/**
 * GET /api/user-dashboard/orders
 * Retourne les commandes actives et la dernière commande successful
 * - activeOrders : commandes de l'utilisateur avec status in ['paid','accepted','delivering'] triées par updatedAt desc
 * - lastSuccessfulOrder : la dernière commande status 'success' triée par updatedAt desc
 * Pour chaque commande on ne retourne que : _id, status, boutique (populate: _id,name,logo), createdAt, updatedAt, totalAmount, deliveryAddress (null ou { price })
 */
exports.getOrderTab = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        // Champs à sélectionner
        const selectFields = '_id status boutique createdAt updatedAt totalAmount deliveryAddress.price';

        // Récupère les commandes actives
        const activeOrdersRaw = await Commande.find({
            user: userId,
            status: { $in: ['paid', 'accepted', 'delivering'] }
        })
            .select(selectFields)
            .populate('boutique', 'name logo')
            .sort({ updatedAt: -1 })
            .lean();

        // Récupère la dernière commande successful
        const lastSuccessfulRaw = await Commande.findOne({ user: userId, status: 'success' })
            .select(selectFields)
            .populate('boutique', 'name logo')
            .sort({ updatedAt: -1 })
            .lean();

        // Fonction utilitaire pour normaliser une commande selon le contrat de sortie
        const normalizeCommande = (cmd) => {
            if (!cmd) return null;

            // Normalize boutique: si populate a échoué, garder null
            const boutique = cmd.boutique ? {
                _id: cmd.boutique._id,
                name: cmd.boutique.name,
                logo: cmd.boutique.logo
            } : null;

            // deliveryAddress: si null ou absent -> null, sinon { price }
            const deliveryAddress = cmd.deliveryAddress && typeof cmd.deliveryAddress === 'object'
                ? { price: cmd.deliveryAddress.price || 0 }
                : null;

            return {
                _id: cmd._id,
                status: cmd.status,
                boutique,
                createdAt: cmd.createdAt,
                updatedAt: cmd.updatedAt,
                totalAmount: cmd.totalAmount,
                deliveryAddress
            };
        };

        const activeOrders = Array.isArray(activeOrdersRaw) ? activeOrdersRaw.map(normalizeCommande) : [];
        const lastSuccessfulOrder = normalizeCommande(lastSuccessfulRaw);

        const data = {
            activeOrders,
            lastSuccessfulOrder
        };

        return successResponse(res, 200, 'Orders tab retrieved successfully.', data);
    } catch (error) {
        console.error('getOrderTab error:', error);
        return errorResponse(res, 500, 'Unable to fetch orders at this time. Please try again later.');
    }
};
