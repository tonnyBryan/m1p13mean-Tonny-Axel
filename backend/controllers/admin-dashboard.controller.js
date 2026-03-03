const User = require('../models/User');
const Boutique = require('../models/Boutique');
const Commande = require('../models/Commande');
const Vente = require('../models/Vente');
const SupportRequest = require('../models/SupportRequest');
const PaiementAbonnement = require('../models/PaiementAbonnement');
const Subscription = require('../models/Subscription');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * GET /api/admin-dashboard/realtime
 * Returns realtime dashboard data for the admin
 */
exports.getRealtime = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 1. User Stats
        const totalUsers = await User.countDocuments();
        const googleUsers = await User.countDocuments({ authProvider: 'google' });
        const localUsers = await User.countDocuments({ authProvider: 'local' });
        const newUsersToday = await User.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        // 2. Boutique Stats
        const totalBoutiques = await Boutique.countDocuments();
        const activeBoutiques = await Boutique.countDocuments({ isActive: true, isValidated: true });
        const pendingBoutiques = await Boutique.countDocuments({ isValidated: false });
        const localBoutiques = await Boutique.countDocuments({ isLocal: true });
        const externalBoutiques = await Boutique.countDocuments({ isLocal: false });

        // 3. Revenue/Sales Stats (Global)
        const caToday = await Vente.aggregate([
            {
                $match: {
                    status: 'paid',
                    saleDate: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);
        const globalCaToday = caToday.length ? caToday[0].total : 0;

        // 3b. Sales today count (direct vs order)
        const salesTodayAgg = await Vente.aggregate([
            {
                $match: {
                    status: 'paid',
                    saleDate: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: '$origin',
                    count: { $sum: 1 }
                }
            }
        ]);
        const salesTodayDirectCount = salesTodayAgg.find(i => i._id === 'direct')?.count || 0;
        const salesTodayOrderCount = salesTodayAgg.find(i => i._id === 'order')?.count || 0;
        const salesTodayTotalCount = salesTodayDirectCount + salesTodayOrderCount;

        // 4. Total rent payments (all-time)
        const rentPaymentsAgg = await PaiementAbonnement.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRentPayments = rentPaymentsAgg.length ? rentPaymentsAgg[0].total : 0;

        // 4b. Rent payments (this month)
        const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
        const rentPaymentsMonthAgg = await PaiementAbonnement.aggregate([
            { $match: { paidAt: { $gte: startOfMonth, $lte: endOfDay } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const rentPaymentsThisMonth = rentPaymentsMonthAgg.length ? rentPaymentsMonthAgg[0].total : 0;

        // 5. Open support requests
        const openSupportRequests = await SupportRequest.countDocuments({ status: { $ne: 'resolved' } });

        // 5c. Email subscribers
        const emailSubscribers = await Subscription.countDocuments();

        // 5b. Overdue boutiques (running but no payment covering current period)
        const runningBoutiques = await Boutique.find({
            isActive: true,
            isValidated: true,
            'plan.startDate': { $ne: null }
        }).select('_id').lean();
        const runningIds = runningBoutiques.map(b => b._id);

        let overdueBoutiques = 0;
        if (runningIds.length) {
            const paidBoutiqueIds = await PaiementAbonnement.distinct('boutique', {
                boutique: { $in: runningIds },
                periodStart: { $lte: new Date() },
                periodEnd: { $gt: new Date() }
            });
            overdueBoutiques = runningIds.length - paidBoutiqueIds.length;
        }

        // 6. Recent Users (Last 5, role user)
        const recentUsers = await User.find({ role: 'user' })
            .select('name email createdAt role')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 7. Recent Support Requests
        const recentSupportRequests = await SupportRequest.find({ status: { $ne: 'resolved' } })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        return successResponse(res, 200, 'Admin realtime dashboard data retrieved successfully.', {
            stats: {
                totalUsers,
                googleUsers,
                localUsers,
                newUsersToday,
                totalBoutiques,
                activeBoutiques,
                pendingBoutiques,
                localBoutiques,
                externalBoutiques,
                globalCaToday,
                totalRentPayments,
                rentPaymentsThisMonth,
                openSupportRequests,
                overdueBoutiques,
                salesTodayTotalCount,
                salesTodayDirectCount,
                salesTodayOrderCount,
                emailSubscribers
            },
            recentUsers,
            recentSupportRequests
        });

    } catch (error) {
        console.error('getAdminRealtime error:', error);
        return errorResponse(res, 500, 'Unable to fetch admin realtime dashboard data.');
    }
};

/**
 * GET /api/admin-dashboard/analytics
 * Returns analytics data for the admin
 */
exports.getAnalytics = async (req, res) => {
    try {
        // Current Period
        const to = req.query.to ? new Date(req.query.to) : new Date();
        to.setHours(23, 59, 59, 999);
        const from = req.query.from ? new Date(req.query.from) : new Date();
        if (!req.query.from) {
            from.setDate(from.getDate() - 30);
        }
        from.setHours(0, 0, 0, 0);

        // Previous Period
        const duration = to.getTime() - from.getTime();
        const effectiveDuration = duration < 24 * 60 * 60 * 1000 ? 24 * 60 * 60 * 1000 : duration;
        const prevTo = new Date(from.getTime() - 1);
        prevTo.setHours(23, 59, 59, 999);
        const prevFrom = new Date(prevTo.getTime() - effectiveDuration);
        prevFrom.setHours(0, 0, 0, 0);

        // 1. Global Revenue by Day
        const revenueByDay = await Vente.aggregate([
            {
                $match: {
                    status: 'paid',
                    saleDate: { $gte: from, $lte: to }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
                    total: { $sum: '$totalAmount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // 1b. Sales count by day (direct vs order)
        const salesCountByDayRaw = await Vente.aggregate([
            {
                $match: {
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
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        const salesCountMap = new Map();
        salesCountByDayRaw.forEach(item => {
            const date = item._id.date;
            if (!salesCountMap.has(date)) {
                salesCountMap.set(date, { date, total: 0, direct: 0, order: 0 });
            }
            const entry = salesCountMap.get(date);
            if (item._id.origin === 'direct') entry.direct = item.count;
            if (item._id.origin === 'order') entry.order = item.count;
            entry.total = (entry.direct || 0) + (entry.order || 0);
        });
        const salesCountByDay = Array.from(salesCountMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        // 2. Global Orders by Status
        const ordersByStatus = await Commande.aggregate([
            {
                $match: {
                    createdAt: { $gte: from, $lte: to }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. User growth (New users per day)
        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: from, $lte: to }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // 4. Top Performing Boutiques
        const topBoutiques = await Vente.aggregate([
            {
                $match: {
                    status: 'paid',
                    saleDate: { $gte: from, $lte: to }
                }
            },
            {
                $group: {
                    _id: '$boutique',
                    revenue: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'boutiques',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'boutiqueInfo'
                }
            },
            { $unwind: '$boutiqueInfo' },
            {
                $project: {
                    _id: 1,
                    name: '$boutiqueInfo.name',
                    logo: '$boutiqueInfo.logo',
                    revenue: 1,
                    orderCount: 1
                }
            }
        ]);

        return successResponse(res, 200, 'Admin analytics data retrieved successfully.', {
            period: { from, to },
            revenueByDay,
            salesCountByDay,
            ordersByStatus,
            userGrowth,
            topBoutiques
        });

    } catch (error) {
        console.error('getAdminAnalytics error:', error);
        return errorResponse(res, 500, 'Unable to fetch admin analytics data.');
    }
};
