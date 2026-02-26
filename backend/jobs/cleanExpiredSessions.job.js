const cron = require('node-cron');
const RefreshToken = require('../models/RefreshToken');

async function cleanExpiredSessions() {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const result = await RefreshToken.deleteMany({
            expiresAt: { $lt: thirtyDaysAgo }
        });

        if (result.deletedCount > 0) {
            console.log(`[cleanExpiredSessions] Deleted ${result.deletedCount} expired session(s) at ${new Date().toISOString()}`);
        }

    } catch (err) {
        console.error('[cleanExpiredSessions] Error while cleaning sessions:', err);
    }
}

function initCleanExpiredSessionsJob() {
    cleanExpiredSessions().catch(err => {
        console.error('[cleanExpiredSessions] Initial run failed:', err);
    });

    // Toutes les nuits à minuit
    cron.schedule('0 0 * * *', () => {
        console.log('[cleanExpiredSessions] Cron triggered');
        cleanExpiredSessions().catch(err => {
            console.error('[cleanExpiredSessions] Cron run failed:', err);
        });
    }, {
        scheduled: true,
        timezone: process.env.TZ || 'UTC'
    });

    console.log('[cleanExpiredSessions] Job scheduled to run every night at midnight');
}

module.exports = initCleanExpiredSessionsJob;