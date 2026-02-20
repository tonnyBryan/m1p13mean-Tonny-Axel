const Product = require('../models/Product');
const Vente = require('../models/Vente');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

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

async function createVenteFromCommande(commande, sellerId, session) {
    if (!commande || !Array.isArray(commande.products) || commande.products.length === 0) {
        throw new Error('Commande has no products to create a sale.');
    }

    if (!sellerId) {
        throw new Error('Seller ID is required to create a sale.');
    }

    let clientName = 'Guest';
    let clientEmail = null;
    let clientPhone = null;

    if (commande.user) {
        const user = await User.findById(commande.user).session(session);
        if (user) clientEmail = user.email || null;

        const profile = await UserProfile.findOne({ user: commande.user }).session(session);
        if (profile) clientName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        if (profile?.phoneNumber) clientPhone = profile.phoneNumber;
    }

    const items = commande.products.map(p => ({
        product: p.product,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.totalPrice,
        isSale: p.isSale || false
    }));

    const deliveryPrice = commande.deliveryAddress?.price || 0;

    const venteData = {
        boutique: commande.boutique,
        seller: sellerId,
        client: {
            name: clientName,
            email: clientEmail,
            phoneNumber: clientPhone,
            _id: commande.user || null
        },
        items,
        paymentMethod: 'card',
        totalAmount: commande.totalAmount,
        status: 'paid',
        saleType: commande.deliveryMode === 'delivery' ? 'delivery' : 'dine-in',
        origin: 'order',
        order: commande._id,
        deliveryPrice: deliveryPrice,
        saleDate: new Date()
    };

    const vente = new Vente(venteData);
    await vente.save({ session });
    return vente;
}

module.exports = { removeEngagement, createVenteFromCommande };
