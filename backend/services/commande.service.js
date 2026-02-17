const Product = require('../models/Product');

async function removeEngagement(commande, session) {
    if (!commande || !Array.isArray(commande.products)) return;

    for (const item of commande.products) {
        const productId = item?.product?._id || item?.product;
        const qty = Number(item?.quantity) || 0;

        if (!productId || qty <= 0) {
            throw new Error(`Invalid product id or quantity for product ${productId}`);
        }

        const product = await Product.findById(productId).session(session);
        if (!product) throw new Error(`Product not found: ${productId}`);

        const newStockEngaged = Math.max((product.stockEngaged || 0) - qty, 0);
        product.stockEngaged = newStockEngaged;
        await product.save({ session });
    }
}

module.exports = { removeEngagement };
