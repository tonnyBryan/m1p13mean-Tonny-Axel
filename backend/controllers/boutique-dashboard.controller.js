const Commande = require('../models/Commande');
const Vente = require('../models/Vente');
const Product = require('../models/Product');
const UserProfile = require('../models/UserProfile');
const ProductRating = require('../models/ProductRating');
const Boutique = require('../models/Boutique');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * GET /api/boutique-dashboard/realtime
 * Retourne les données temps réel pour la boutique connectée
 */
exports.getRealtime = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        // Récupérer la boutique liée au owner
        const boutique = await Boutique.findOne({ owner: userId }).lean();
        if (!boutique) return errorResponse(res, 404, 'Boutique not found.');
        const boutiqueId = boutique._id;

        // Début et fin du jour courant
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // ── 1. Commandes en attente (status: paid)
        const pendingOrdersCount = await Commande.countDocuments({
            boutique: boutiqueId,
            status: 'paid'
        });

        // ── 2. Commandes en cours (status: accepted | delivering)
        const activeOrdersCount = await Commande.countDocuments({
            boutique: boutiqueId,
            status: { $in: ['accepted', 'delivering'] }
        });

        // ── 3. CA du jour — depuis Vente (status: paid, saleDate aujourd'hui)
        const caToday = await Vente.aggregate([
            {
                $match: {
                    boutique: boutiqueId,
                    status: 'paid',
                    saleDate: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' },
                    direct: {
                        $sum: { $cond: [{ $eq: ['$origin', 'direct'] }, '$totalAmount', 0] }
                    },
                    fromOrder: {
                        $sum: { $cond: [{ $eq: ['$origin', 'order'] }, '$totalAmount', 0] }
                    }
                }
            }
        ]);

        const caTodayData = caToday.length ? caToday[0] : { total: 0, direct: 0, fromOrder: 0 };

        // ── 4. Produits en stock faible (stockReal <= 5)
        // stockReal = stock - stockEngaged
        // On filtre via aggregation pour utiliser le virtual stockReal
        const lowStockProducts = await Product.aggregate([
            {
                $match: {
                    boutique: boutiqueId,
                    isActive: true
                }
            },
            {
                $addFields: {
                    stockReal: { $max: [{ $subtract: ['$stock', '$stockEngaged'] }, 0] }
                }
            },
            {
                $match: {
                    stockReal: { $lte: 5 }
                }
            },
            { $sort: { stockReal: 1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    stockReal: 1,
                    images: { $slice: ['$images', 1] }
                }
            }
        ]);

        // Nombre total de produits en stock faible (pour afficher "X autres")
        const lowStockTotal = await Product.aggregate([
            { $match: { boutique: boutiqueId, isActive: true } },
            {
                $addFields: {
                    stockReal: { $max: [{ $subtract: ['$stock', '$stockEngaged'] }, 0] }
                }
            },
            { $match: { stockReal: { $lte: 5 } } },
            { $count: 'total' }
        ]);
        const lowStockCount = lowStockTotal.length ? lowStockTotal[0].total : 0;

        // ── 5. 5 dernières commandes reçues
        const lastOrders = await Commande.find({
            boutique: boutiqueId,
            status: { $nin: ['draft', 'expired'] }
        })
            .select('_id status totalAmount createdAt user')
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const normalizedOrders = lastOrders.map(cmd => ({
            _id: cmd._id,
            status: cmd.status,
            totalAmount: cmd.totalAmount,
            createdAt: cmd.createdAt,
            client: cmd.user ? {
                _id: cmd.user._id,
                name: cmd.user.name,
                email: cmd.user.email
            } : null
        }));

        // ── 6. 5 derniers avis reçus sur les produits de la boutique
        const lastRatings = await ProductRating.find()
            .populate({
                path: 'product',
                match: { boutique: boutiqueId },
                select: 'name images boutique'
            })
            .populate('user', '_id')
            .sort({ createdAt: -1 })
            .lean();

        // Filtrer les ratings avec produit valide
        const validRatings = lastRatings.filter(r => r.product !== null);

        // Récupérer les userIds
        const userIds = validRatings.map(r => r.user?._id).filter(Boolean);

        // Récupérer les profils
        const profiles = await UserProfile.find({
            user: { $in: userIds }
        }).select('user firstName lastName photo').lean();

        // Créer un map rapide
        const profileMap = {};
        profiles.forEach(p => {
            profileMap[p.user.toString()] = p;
        });

        // Construire résultat final
        const filteredRatings = validRatings
            .slice(0, 5)
            .map(r => {
                const profile = profileMap[r.user?._id?.toString()];

                return {
                    _id: r._id,
                    rating: r.rating,
                    comment: r.comment,
                    createdAt: r.createdAt,
                    product: {
                        _id: r.product._id,
                        name: r.product.name,
                        image: r.product.images?.[0] ?? null
                    },
                    user: profile
                        ? {
                            fullName: `${profile.firstName} ${profile.lastName}`,
                            photo: profile.photo ?? null
                        }
                        : null
                };
            });

        return successResponse(res, 200, 'Realtime dashboard data retrieved successfully.', {
            pendingOrdersCount,
            activeOrdersCount,
            caToday: {
                total: caTodayData.total,
                direct: caTodayData.direct,
                fromOrder: caTodayData.fromOrder
            },
            lowStock: {
                total: lowStockCount,
                items: lowStockProducts
            },
            lastOrders: normalizedOrders,
            lastRatings: filteredRatings
        });

    } catch (error) {
        console.error('getRealtime error:', error);
        return errorResponse(res, 500, 'Unable to fetch realtime dashboard data.');
    }
};



/**
 * GET /api/boutique-dashboard/analytics?from=&to=
 * Retourne les données analytics pour la boutique connectée sur une période
 */
exports.getAnalytics = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const boutique = await Boutique.findOne({ owner: userId }).lean();
        if (!boutique) return errorResponse(res, 404, 'Boutique not found.');
        const boutiqueId = boutique._id;

        // ── Période actuelle
        const to = req.query.to ? new Date(req.query.to) : new Date();
        to.setHours(23, 59, 59, 999);

        const from = req.query.from ? new Date(req.query.from) : new Date();
        if (!req.query.from) {
            from.setDate(from.getDate() - 30);
        }
        from.setHours(0, 0, 0, 0);

        // ── Période précédente (même durée, juste avant)
        const duration = to.getTime() - from.getTime();

        // Si même jour, on force la durée à 1 jour complet
        const effectiveDuration = duration < 24 * 60 * 60 * 1000
            ? 24 * 60 * 60 * 1000
            : duration;

        const prevTo = new Date(from.getTime() - 1);
        prevTo.setHours(23, 59, 59, 999);
        const prevFrom = new Date(prevTo.getTime() - effectiveDuration);
        prevFrom.setHours(0, 0, 0, 0);

        // ── Helper aggregation CA
        const getCaStats = async (dateFrom, dateTo) => {
            const result = await Vente.aggregate([
                {
                    $match: {
                        boutique: boutiqueId,
                        status: 'paid',
                        saleDate: { $gte: dateFrom, $lte: dateTo }
                    }
                },
                {
                    $group: {
                        _id: '$origin',
                        total: { $sum: '$totalAmount' }
                    }
                }
            ]);

            const data = { direct: 0, fromOrder: 0, total: 0 };
            for (const entry of result) {
                if (entry._id === 'direct') data.direct = entry.total;
                if (entry._id === 'order') data.fromOrder = entry.total;
            }
            data.total = data.direct + data.fromOrder;
            return data;
        };

        // ── Helper aggregation Commandes
        const getCommandesStats = async (dateFrom, dateTo) => {
            const result = await Commande.aggregate([
                {
                    $match: {
                        boutique: boutiqueId,
                        status: { $in: ['success', 'canceled'] },
                        updatedAt: { $gte: dateFrom, $lte: dateTo }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const data = { success: 0, canceled: 0 };
            for (const entry of result) {
                if (entry._id === 'success') data.success = entry.count;
                if (entry._id === 'canceled') data.canceled = entry.count;
            }
            return data;
        };

        // ── 1. CA par jour sur la période actuelle
        const caPerDay = await Vente.aggregate([
            {
                $match: {
                    boutique: boutiqueId,
                    status: 'paid',
                    saleDate: { $gte: from, $lte: to }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
                        origin: '$origin'
                    },
                    total: { $sum: '$totalAmount' }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        const caMap = {};
        for (const entry of caPerDay) {
            const date = entry._id.date;
            if (!caMap[date]) caMap[date] = { date, direct: 0, fromOrder: 0 };
            if (entry._id.origin === 'direct') caMap[date].direct = entry.total;
            if (entry._id.origin === 'order') caMap[date].fromOrder = entry.total;
        }
        const caByDay = Object.values(caMap).map(d => ({
            date: d.date,
            direct: d.direct,
            fromOrder: d.fromOrder,
            total: d.direct + d.fromOrder
        }));

        // ── 2. Stats actuelles et précédentes en parallèle
        const [
            currentCA,
            previousCA,
            currentCommandes,
            previousCommandes
        ] = await Promise.all([
            getCaStats(from, to),
            getCaStats(prevFrom, prevTo),
            getCommandesStats(from, to),
            getCommandesStats(prevFrom, prevTo)
        ]);

        // ── 3. Top 5 produits
        const topProducts = await Vente.aggregate([
            {
                $match: {
                    boutique: boutiqueId,
                    status: 'paid',
                    saleDate: { $gte: from, $lte: to }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.totalPrice' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    _id: '$product._id',
                    name: '$product.name',
                    image: { $arrayElemAt: ['$product.images', 0] },
                    totalQuantity: 1,
                    totalRevenue: 1
                }
            }
        ]);

        return successResponse(res, 200, 'Analytics data retrieved successfully.', {
            period: {
                from: from.toISOString(),
                to: to.toISOString(),
                previous: {
                    from: prevFrom.toISOString(),
                    to: prevTo.toISOString()
                }
            },
            caByDay,
            current: {
                ca: currentCA,
                commandes: currentCommandes
            },
            previous: {
                ca: previousCA,
                commandes: previousCommandes
            },
            // Rétrocompatibilité — on garde commandes à la racine
            commandes: currentCommandes,
            topProducts
        });

    } catch (error) {
        console.error('getAnalytics error:', error);
        return errorResponse(res, 500, 'Unable to fetch analytics data.');
    }
};