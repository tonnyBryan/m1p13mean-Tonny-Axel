const Commande = require('../models/Commande');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const LivraisonConfig = require('../models/LivraisonConfig');
const UserProfile = require('../models/UserProfile');

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

        // Find product with virtual stockReal
        const product = await Product.findById(productId);
        if (!product) return errorResponse(res, 404, 'Product not found');

        // Validate min/max order quantities
        const minOrder = product.minOrderQty || 1;
        const maxOrder = product.maxOrderQty || Number.MAX_SAFE_INTEGER;

        if (qty < minOrder) {
            return errorResponse(res, 400, `Minimum order quantity is ${minOrder}`);
        }

        if (qty > maxOrder) {
            return errorResponse(res, 400, `Maximum order quantity is ${maxOrder}`);
        }

        // Check stockReal
        if (qty > product.stockReal) {
            return errorResponse(res, 400, `Stock insufficient. Available: ${product.stockReal}`);
        }

        // Find existing draft
        let commande = await findOpenDraft(userId);

        if (commande) {
            // Verify boutique match
            if (String(commande.boutique) !== String(product.boutique)) {
                return errorResponse(res, 403, 'Product belongs to another boutique');
            }
        } else {
            // Create new draft
            commande = new Commande({ user: userId, boutique: product.boutique, products: [], status: 'draft' });
        }

        // Check if product already in commande
        const existingIndex = commande.products.findIndex(p => String(p.product) === String(product._id));

        const unitPrice = product.isSale && product.salePrice ? product.salePrice : product.regularPrice;

        let quantityToAdd = qty; // La quantité réellement ajoutée au panier

        if (existingIndex >= 0) {
            const existingProduct = commande.products[existingIndex];
            const newQty = existingProduct.quantity + qty;

            // Ensure total quantity after addition does not exceed maxOrder
            if (newQty > maxOrder) {
                return errorResponse(res, 400, `Adding this quantity would exceed maximum allowed for this product (${maxOrder})`);
            }

            // Update quantity in commande
            existingProduct.quantity = newQty;
            existingProduct.unitPrice = unitPrice;
            existingProduct.totalPrice = newQty * unitPrice;

        } else {
            // New product line
            commande.products.push({
                product: product._id,
                quantity: qty,
                unitPrice,
                totalPrice: qty * unitPrice,
                isSale: !!product.isSale
            });
        }

        // Update stockEngaged uniquement de la quantité ajoutée
        product.stockEngaged += quantityToAdd;
        await product.save();

        // Recompute totalAmount
        commande.totalAmount = commande.products.reduce((s, it) => s + (it.totalPrice || 0), 0);

        // Set expiredAt if not set
        if (!commande.expiredAt) commande.expiredAt = new Date(Date.now() + 60*60*1000);

        await commande.save();

        return successResponse(res, 200, null, commande);

    } catch (err) {
        console.error(err);
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

        // If a draft and boutique exists, try to attach its LivraisonConfig
        if (commande && commande.boutique) {
            try {
                const livraisonConfig = await LivraisonConfig.findOne({ boutique: commande.boutique._id }) || null;
                // convert boutique doc to plain object if possible so we can attach the config
                const boutiqueObj = commande.boutique.toObject ? commande.boutique.toObject() : commande.boutique;
                boutiqueObj.livraisonConfig = livraisonConfig;
                commande.boutique = boutiqueObj;
            } catch (e) {
                // don't fail the whole request if livraisonConfig lookup fails; log and continue
                console.error('Failed to load livraisonConfig for boutique:', e);
            }
        }

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
        const { quantity } = req.body; // quantité absolue
        if (!productId) return errorResponse(res, 400, 'productId required');

        const newQty = Number.isFinite(Number(quantity)) ? Number(quantity) : null;
        if (newQty === null) {
            return errorResponse(res, 400, 'quantity is required and must be a number');
        }

        const product = await Product.findById(productId);
        if (!product) return errorResponse(res, 404, 'Product not found');

        const minOrder = product.minOrderQty || 1;
        const maxOrder = product.maxOrderQty || Number.MAX_SAFE_INTEGER;

        if (newQty < 0) {
            return errorResponse(res, 400, 'Quantity cannot be negative');
        }
        if (newQty > 0 && newQty < minOrder) {
            return errorResponse(res, 400, `Minimum order quantity is ${minOrder}`);
        }
        if (newQty > maxOrder) {
            return errorResponse(res, 400, `Maximum order quantity is ${maxOrder}`);
        }

        // find open draft
        const commande = await findOpenDraft(userId);
        if (!commande) return errorResponse(res, 404, 'No open draft found');

        const itemIndex = commande.products.findIndex(
            p => String(p.product) === String(productId)
        );
        if (itemIndex === -1) {
            return errorResponse(res, 404, 'Product not in cart');
        }

        const item = commande.products[itemIndex];
        const oldQty = item.quantity;

        const delta = newQty - oldQty;

        // si on augmente → vérifier le stock réel
        if (delta > 0 && delta > product.stockReal) {
            return errorResponse(
                res,
                400,
                `Stock insufficient. Available: ${product.stockReal}`
            );
        }

        const unitPrice = product.isSale && product.salePrice
            ? product.salePrice
            : product.regularPrice;

        // mise à jour panier
        if (newQty === 0) {
            commande.products.splice(itemIndex, 1);
        } else {
            item.quantity = newQty;
            item.unitPrice = unitPrice;
            item.totalPrice = newQty * unitPrice;
            item.isSale = !!product.isSale;
        }

        // mise à jour stockEngaged (delta positif ou négatif)
        product.stockEngaged += delta;
        if (product.stockEngaged < 0) product.stockEngaged = 0; // sécurité
        await product.save();

        // recompute total
        commande.totalAmount = commande.products.reduce(
            (s, it) => s + (it.totalPrice || 0),
            0
        );

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

        const itemIndex = commande.products.findIndex(
            p => String(p.product) === String(productId)
        );
        if (itemIndex === -1) {
            return errorResponse(res, 404, 'Product not in cart');
        }

        // récupérer la quantité engagée
        const removedItem = commande.products[itemIndex];
        const qtyToRelease = removedItem.quantity;

        //  libérer le stock engagé
        const product = await Product.findById(productId);
        if (product) {
            product.stockEngaged -= qtyToRelease;
            if (product.stockEngaged < 0) product.stockEngaged = 0;
            await product.save();
        }

        // supprimer l’item du panier
        commande.products.splice(itemIndex, 1);

        // si plus aucun produit → supprimer la commande
        if (!commande.products.length) {
            await Commande.deleteOne({ _id: commande._id });
            return successResponse(res, 200, null, null);
        }

        // recalcul du total
        commande.totalAmount = commande.products.reduce(
            (s, it) => s + (it.totalPrice || 0),
            0
        );

        await commande.save();

        return successResponse(res, 200, null, commande);

    } catch (err) {
        console.error('removeItemFromCart error:', err);
        return errorResponse(res, 500, 'Server error');
    }
};


// POST /api/commandes/pay
exports.payCommand = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'Unauthorized');

        const { deliveryMode, deliveryAddress, paymentInfo, savePaymentInfo, totalAmount } = req.body;
        const saveNewAddress = deliveryAddress?.saveNewAddress;

        // Find open draft
        let commande = await findOpenDraft(userId);
        if (!commande) return errorResponse(res, 404, 'No open draft found');

        // Update commande details
        commande.status = 'paid';
        commande.deliveryMode = deliveryMode || null;
        commande.deliveryAddress = deliveryAddress || null;
        commande.paymentMethod = 'card'; // Default to card for now
        commande.totalAmount = totalAmount;

        // Save new delivery address if required
        if (deliveryAddress && deliveryAddress.id === null && saveNewAddress) {
            const userProfile = await UserProfile.findOne({ user: userId });
            if (userProfile) {
                userProfile.addresses.push({
                    label: deliveryAddress.label,
                    description: deliveryAddress.description,
                    latitude: deliveryAddress.latitude,
                    longitude: deliveryAddress.longitude,
                    price: deliveryAddress.price
                });
                await userProfile.save();
            }
        }

        // Save or update payment info if required
        if (savePaymentInfo) {
            const userProfile = await UserProfile.findOne({ user: userId });
            if (userProfile) {
                userProfile.cardInfo = paymentInfo;
                await userProfile.save();
            }
        }

        await commande.save();

        commande = await Commande.findById(commande._id)
            .populate('boutique')
            .populate({ path: 'products.product', model: 'Product' })
            .exec();

        return successResponse(res, 200, 'Payment processed successfully', commande);
    } catch (err) {
        console.error('payCommand error:', err);
        return errorResponse(res, 500, 'Server error');
    }
};
