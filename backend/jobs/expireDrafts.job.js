const cron = require('node-cron');
const Commande = require('../models/Commande');

// expireDrafts: find all commandes with status 'draft' and expiredAt <= now -> set status to 'expired'
async function expireDrafts() {
    try {
        const now = new Date();
        const filter = { status: 'draft', expiredAt: { $lte: now } };
        const update = { $set: { status: 'expired' } };
        const res = await Commande.updateMany(filter, update);
        // `res` shape depends on mongoose version: check common fields
        const count = (res && (res.nModified || res.modifiedCount || res.n)) || 0;
        console.log(`[expireDrafts] Expired ${count} draft commande(s) at ${now.toISOString()}`);
    } catch (err) {
        console.error('[expireDrafts] Error while expiring drafts:', err);
    }
}

// initExpireDraftsJob: call once immediately and then schedule every 10 minutes
function initExpireDraftsJob() {
    // run now (useful at startup)
    expireDrafts().catch(err => {
        console.error('[expireDrafts] Initial run failed:', err);
    });

    // schedule: every 10 minutes
    // cron pattern: '*/10 * * * *' -> every 10 minutes
    cron.schedule('*/2 * * * *', () => {
        console.log('[expireDrafts] Cron triggered');
        expireDrafts().catch(err => {
            console.error('[expireDrafts] Cron run failed:', err);
        });
    }, {
        scheduled: true,
        timezone: process.env.TZ || 'UTC'
    });

    console.log('[expireDrafts] Job scheduled to run every 10 minutes');
}

module.exports = initExpireDraftsJob;
