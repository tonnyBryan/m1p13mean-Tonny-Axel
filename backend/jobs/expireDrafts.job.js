const cron = require('node-cron');
const Commande = require('../models/Commande');
const Product = require('../models/Product');

async function expireDrafts() {
    try {
        const now = new Date();

        // 1️⃣ récupérer les drafts expirés
        const expiredDrafts = await Commande.find({
            status: 'draft',
            expiredAt: { $lte: now }
        });

        if (!expiredDrafts.length) {
            return;
        }

        // 2️⃣ pour chaque commande expirée
        for (const commande of expiredDrafts) {

            // libérer le stock engagé
            for (const item of commande.products) {
                const product = await Product.findById(item.product);
                if (!product) continue;

                product.stockEngaged -= item.quantity;
                if (product.stockEngaged < 0) {
                    product.stockEngaged = 0;
                }

                await product.save();
            }

            // 3️⃣ marquer la commande comme expirée
            commande.status = 'expired';
            await commande.save();
        }

        console.log(
            `[expireDrafts] Expired ${expiredDrafts.length} draft commande(s) at ${now.toISOString()}`
        );

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
    cron.schedule('*/10 * * * *', () => {
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
