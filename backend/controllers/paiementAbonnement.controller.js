const PaiementAbonnement = require('../models/PaiementAbonnement');
const Boutique = require('../models/Boutique');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

const withAnchorDay = (year, monthIndex, anchorDay, timeRef) => {
    const day = Math.min(anchorDay, daysInMonth(year, monthIndex));
    const d = new Date(year, monthIndex, day);
    d.setHours(timeRef.getHours(), timeRef.getMinutes(), timeRef.getSeconds(), timeRef.getMilliseconds());
    return d;
};

const addMonthsWithAnchor = (date, monthsToAdd, anchorDay, timeRef) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return withAnchorDay(year, month + monthsToAdd, anchorDay, timeRef || date);
};

const getCurrentPeriod = (startDate, refDate) => {
    if (!startDate || refDate < startDate) return null;

    const anchorDay = startDate.getDate();
    const monthsDiff =
        (refDate.getFullYear() - startDate.getFullYear()) * 12 +
        (refDate.getMonth() - startDate.getMonth());

    let periodStart = withAnchorDay(
        startDate.getFullYear(),
        startDate.getMonth() + monthsDiff,
        anchorDay,
        startDate
    );

    if (refDate < periodStart) {
        periodStart = withAnchorDay(
            startDate.getFullYear(),
            startDate.getMonth() + monthsDiff - 1,
            anchorDay,
            startDate
        );
    }

    const periodEnd = addMonthsWithAnchor(periodStart, 1, anchorDay, startDate);
    return { periodStart, periodEnd };
};

// GET /api/paiement-abonnements/boutique/:boutiqueId
exports.getPaymentsByBoutique = async (req, res) => {
    try {
        return successResponse(res, 200, null, res.advancedResults);
    } catch (err) {
        console.error('getPaymentsByBoutique error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};

// POST /api/paiement-abonnements/pay
exports.paySubscription = async (req, res) => {
    try {
        const { boutiqueId, amount, currency, method, paidAt } = req.body;
        if (!boutiqueId) return errorResponse(res, 400, 'The boutiqueId is required.');

        const boutique = await Boutique.findById(boutiqueId).select('isActive isValidated plan');
        if (!boutique) return errorResponse(res, 404, 'The requested boutique was not found.');

        if (!boutique.isActive || !boutique.isValidated || !boutique.plan || !boutique.plan.startDate) {
            return errorResponse(res, 400, 'This boutique is not running. Payment cannot be registered.');
        }

        const startDate = new Date(boutique.plan.startDate);
        const now = new Date();

        if (now < startDate) {
            return errorResponse(res, 400, 'The subscription period has not started yet.');
        }

        const lastPayment = await PaiementAbonnement.findOne({ boutique: boutique._id })
            .sort({ periodEnd: -1 });

        if (lastPayment && lastPayment.periodEnd && lastPayment.periodEnd > now) {
            return errorResponse(res, 400, 'The current subscription period is already paid.');
        }

        let periodStart;
        let periodEnd;

        if (lastPayment && lastPayment.periodEnd) {
            periodStart = lastPayment.periodEnd;
            periodEnd = addMonthsWithAnchor(periodStart, 1, startDate.getDate(), startDate);
        } else {
            const period = getCurrentPeriod(startDate, now);
            if (!period) return errorResponse(res, 400, 'Unable to determine the current billing period.');
            periodStart = period.periodStart;
            periodEnd = period.periodEnd;
        }

        const rawAmount = amount !== undefined && amount !== null ? amount : boutique.plan.priceToPayPerMonth;
        const finalAmount = Number(rawAmount);
        if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
            return errorResponse(res, 400, 'A valid amount is required.');
        }

        const payment = await PaiementAbonnement.create({
            boutique: boutique._id,
            planType: boutique.plan?.type || null,
            amount: finalAmount,
            currency: currency || 'MGA',
            periodStart,
            periodEnd,
            paidAt: paidAt ? new Date(paidAt) : undefined,
            method: method || null
        });

        return successResponse(res, 201, 'Subscription payment recorded successfully.', payment);
    } catch (err) {
        console.error('paySubscription error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};
