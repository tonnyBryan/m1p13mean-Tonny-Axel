const User = require('../models/User');
const Boutique = require('../models/Boutique');
const Commande = require('../models/Commande');
const Vente = require('../models/Vente');
const Subscription = require('../models/Subscription');
const SupportRequest = require('../models/SupportRequest');
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

        // 4. Active Subscriptions (Simplified)
        const activeSubscriptions = await Subscription.countDocuments({
            status: 'active'
        });

        // 5. Recent Users (Last 5)
        const recentUsers = await User.find()
            .select('name email createdAt role')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 6. Recent Support Requests
        const recentSupportRequests = await SupportRequest.find({ status: { $ne: 'resolved' } })
            .populate('user', 'name')
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
                globalCaToday,
                activeSubscriptions
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
            ordersByStatus,
            userGrowth,
            topBoutiques
        });

    } catch (error) {
        console.error('getAdminAnalytics error:', error);
        return errorResponse(res, 500, 'Unable to fetch admin analytics data.');
    }
};
