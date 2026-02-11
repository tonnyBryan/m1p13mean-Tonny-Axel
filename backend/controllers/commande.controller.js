const Commande = require('../models/Commande');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Helper: compute product total and commande total
function computeProductTotal(productDoc) {
    return productDoc.quantity * productDoc.unitPrice;
}

async function findOpenDraft(userId) {
    // Find non-expired draft
    const now = new Date();
    return await Commande.findOne({ user: userId, status: 'draft', $or: [ { expiredAt: { $exists: false } }, { expiredAt: { $gt: now } } ] });
}

// POST /api/commandes/add
// body: { productId, quantity }
exports.addToCart = async (req, res, next) => {
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
exports.getDraft = async (req, res, next) => {
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

// additional helper: remove product, update qty etc could be added later
