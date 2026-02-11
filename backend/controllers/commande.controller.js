const Commande = require('../models/Commande');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/apiResponse');

async function findOpenDraft(userId) {
    // Find non-expired draft
    const now = new Date();
    return await Commande.findOne({ user: userId, status: 'draft', $or: [ { expiredAt: { $exists: false } }, { expiredAt: { $gt: now } } ] });
}

// POST /api/commandes/add
// body: { productId, quantity }
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'Unauthorized');

        const { productId, quantity } = req.body;
        if (!productId) return errorResponse(res, 400, 'productId required');

        const qty = Number.isFinite(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 1;

        const product = await Product.findById(productId).lean();
        if (!product) return errorResponse(res, 404, 'Product not found');

        // Validate against product min/max order quantities
        const minOrder = product.minOrderQty || 1;
        const maxOrder = product.maxOrderQty || Number.MAX_SAFE_INTEGER;

        if (qty < minOrder) {
            return errorResponse(res, 400, `Minimum order quantity is ${minOrder}`);
        }

        if (qty > maxOrder) {
            return errorResponse(res, 400, `Maximum order quantity is ${maxOrder}`);
        }

        // find existing draft
        let commande = await findOpenDraft(userId);

        if (commande) {
            // verify boutique match
            if (String(commande.boutique) !== String(product.boutique)) {
                return errorResponse(res, 403, 'Product belongs to another boutique');
            }
        } else {
            // create new draft
            commande = new Commande({ user: userId, boutique: product.boutique, products: [], status: 'draft' });
        }

        // Check if product already in commande
        const existingIndex = commande.products.findIndex(p => String(p.product) === String(product._id));

        const unitPrice = product.isSale && product.salePrice ? product.salePrice : product.regularPrice;

        if (existingIndex >= 0) {
            // Ensure total quantity after addition does not exceed maxOrder
            const newQty = commande.products[existingIndex].quantity + qty;
            if (newQty > maxOrder) {
                return errorResponse(res, 400, `Adding this quantity would exceed maximum allowed for this product (${maxOrder})`);
            }

            // update quantity
            commande.products[existingIndex].quantity = newQty;
            commande.products[existingIndex].unitPrice = unitPrice; // keep latest unitPrice
            commande.products[existingIndex].totalPrice = commande.products[existingIndex].quantity * unitPrice;
        } else {
            // New product line: qty already validated above against max
            const prod = {
                product: product._id,
                quantity: qty,
                unitPrice: unitPrice,
                totalPrice: qty * unitPrice,
                isSale: !!product.isSale
            };
            commande.products.push(prod);
        }

        // Recompute totalAmount
        commande.totalAmount = commande.products.reduce((s, it) => s + (it.totalPrice || 0), 0);

        // set expiredAt if not set
        if (!commande.expiredAt) commande.expiredAt = new Date(Date.now() + 60*60*1000);

        await commande.save();

        return successResponse(res, 200, null, commande);

    } catch (err) {
        return errorResponse(res, 500, 'Server error');
    }
};

// GET /api/commandes/draft
exports.getDraft = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'Unauthorized');

        const commande = await findOpenDraft(userId);
        return successResponse(res, 200, null, commande);
    } catch (err) {
        console.error('getDraft error:', err);
        return errorResponse(res, 500, 'Server error');
    }
};

// GET /api/commandes/draft/full
// return the draft with boutique and product details populated
exports.getDraftFull = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'Unauthorized');

        const now = new Date();
        const commande = await Commande.findOne({ user: userId, status: 'draft', $or: [ { expiredAt: { $exists: false } }, { expiredAt: { $gt: now } } ] })
            .populate('boutique')
            .populate({ path: 'products.product', model: 'Product' })
            .exec();

        return successResponse(res, 200, null, commande);
    } catch (err) {
        console.error('getDraftFull error:', err);
        return errorResponse(res, 500, 'Server error');
    }
};

// PATCH /api/commandes/products/:productId/quantity
exports.updateItemQuantity = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'Unauthorized');

        const productId = req.params.productId;
        const { quantity } = req.body; // expected absolute quantity to set
        if (!productId) return errorResponse(res, 400, 'productId required');

        const qty = Number.isFinite(Number(quantity)) ? Number(quantity) : null;
        if (qty === null) return errorResponse(res, 400, 'quantity is required and must be a number');

        const product = await Product.findById(productId).lean();
        if (!product) return errorResponse(res, 404, 'Product not found');

        const minOrder = product.minOrderQty || 1;
        const maxOrder = product.maxOrderQty || Number.MAX_SAFE_INTEGER;

        if (qty < minOrder) return errorResponse(res, 400, `Minimum order quantity is ${minOrder}`);
        if (qty > maxOrder) return errorResponse(res, 400, `Maximum order quantity is ${maxOrder}`);

        // find open draft
        let commande = await findOpenDraft(userId);
        if (!commande) return errorResponse(res, 404, 'No open draft found');

        const itemIndex = commande.products.findIndex(p => String(p.product) === String(productId));
        if (itemIndex === -1) return errorResponse(res, 404, 'Product not in cart');

        // update
        const unitPrice = product.isSale && product.salePrice ? product.salePrice : product.regularPrice;
        commande.products[itemIndex].quantity = qty;
        commande.products[itemIndex].unitPrice = unitPrice;
        commande.products[itemIndex].totalPrice = qty * unitPrice;
        commande.products[itemIndex].isSale = !!product.isSale;

        // remove item if qty == 0
        if (qty === 0) {
            commande.products.splice(itemIndex, 1);
        }

        // recompute total
        commande.totalAmount = commande.products.reduce((s, it) => s + (it.totalPrice || 0), 0);

        await commande.save();

        return successResponse(res, 200, null, commande);

    } catch (err) {
        console.error('updateItemQuantity error:', err);
        return errorResponse(res, 500, 'Server error');
    }
};

// DELETE /api/commandes/products/:productId
exports.removeItemFromCart = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'Unauthorized');

        const productId = req.params.productId;
        if (!productId) return errorResponse(res, 400, 'productId required');

        let commande = await findOpenDraft(userId);
        if (!commande) return errorResponse(res, 404, 'No open draft found');

        const itemIndex = commande.products.findIndex(p => String(p.product) === String(productId));
        if (itemIndex === -1) return errorResponse(res, 404, 'Product not in cart');

        // remove the item
        commande.products.splice(itemIndex, 1);

        // If no products left, remove the commande document entirely
        if (!commande.products || commande.products.length === 0) {
            // remove the commande from DB
            await Commande.deleteOne({ _id: commande._id });
            return successResponse(res, 200, null, null);
        }

        // otherwise recompute total and save
        commande.totalAmount = commande.products.reduce((s, it) => s + (it.totalPrice || 0), 0);

        await commande.save();

        return successResponse(res, 200, null, commande);
    } catch (err) {
        console.error('removeItemFromCart error:', err);
        return errorResponse(res, 500, 'Server error');
    }
};
