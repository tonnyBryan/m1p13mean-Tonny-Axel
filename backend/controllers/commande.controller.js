const Commande = require('../models/Commande');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const LivraisonConfig = require('../models/LivraisonConfig');
const UserProfile = require('../models/UserProfile');
const Boutique = require('../models/Boutique');
const {removeEngagement, createVenteFromCommande} = require("../services/commande.service");
const mongoose = require('mongoose');

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
        if (!userId) return errorResponse(res, 401, 'You are not authorized to perform this action. Please authenticate and try again.');

        const { productId, quantity } = req.body;
        if (!productId) return errorResponse(res, 400, 'The productId is required. Please provide a valid product identifier.');

        const qty = Number.isFinite(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 1;

        // Find product with virtual stockReal
        const product = await Product.findById(productId);
        if (!product) return errorResponse(res, 404, 'The requested product was not found. It may have been removed.');

        // Validate min/max order quantities
        const minOrder = product.minOrderQty || 1;
        const maxOrder = product.maxOrderQty || Number.MAX_SAFE_INTEGER;

        if (qty < minOrder) {
            return errorResponse(res, 400, `The minimum order quantity for this product is ${minOrder}.`);
        }

        if (qty > maxOrder) {
            return errorResponse(res, 400, `The maximum order quantity for this product is ${maxOrder}.`);
        }

        // Check stockReal
        if (qty > product.stockReal) {
            return errorResponse(res, 400, `Insufficient stock. Available quantity: ${product.stockReal}.`);
        }

        // Find existing draft
        let commande = await findOpenDraft(userId);

        if (commande) {
            // Verify boutique match
            if (String(commande.boutique) !== String(product.boutique)) {
                return errorResponse(res, 403, 'This product belongs to a different boutique and cannot be added to the current cart.');
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
                return errorResponse(res, 400, `Adding this quantity would exceed the maximum allowed for this product (${maxOrder}).`);
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
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};


// GET /api/commandes/draft
exports.getDraft = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'You are not authorized to perform this action. Please authenticate and try again.');

        const commande = await findOpenDraft(userId);
        return successResponse(res, 200, null, commande);
    } catch (err) {
        console.error('getDraft error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};

// GET /api/commandes/draft/full
// return the draft with boutique and product details populated
exports.getDraftFull = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'You are not authorized to perform this action. Please authenticate and try again.');

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
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};

// PATCH /api/commandes/products/:productId/quantity
exports.updateItemQuantity = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'You are not authorized to perform this action. Please authenticate and try again.');

        const productId = req.params.productId;
        const { quantity } = req.body; // quantité absolue
        if (!productId) return errorResponse(res, 400, 'The productId is required. Please provide a valid product identifier.');

        const newQty = Number.isFinite(Number(quantity)) ? Number(quantity) : null;
        if (newQty === null) {
            return errorResponse(res, 400, 'The quantity is required and must be a valid number.');
        }

        const product = await Product.findById(productId);
        if (!product) return errorResponse(res, 404, 'The requested product was not found. It may have been removed.');

        const minOrder = product.minOrderQty || 1;
        const maxOrder = product.maxOrderQty || Number.MAX_SAFE_INTEGER;

        if (newQty < 0) {
            return errorResponse(res, 400, 'Quantity cannot be negative.');
        }
        if (newQty > 0 && newQty < minOrder) {
            return errorResponse(res, 400, `The minimum order quantity for this product is ${minOrder}.`);
        }
        if (newQty > maxOrder) {
            return errorResponse(res, 400, `The maximum order quantity for this product is ${maxOrder}.`);
        }

        // find open draft
        const commande = await findOpenDraft(userId);
        if (!commande) return errorResponse(res, 404, 'No active draft order was found. Please create a new order.');

        const itemIndex = commande.products.findIndex(
            p => String(p.product) === String(productId)
        );
        if (itemIndex === -1) {
            return errorResponse(res, 404, 'The specified product is not present in the cart.');
        }

        const item = commande.products[itemIndex];
        const oldQty = item.quantity;

        const delta = newQty - oldQty;

        // si on augmente → vérifier le stock réel
        if (delta > 0 && delta > product.stockReal) {
            return errorResponse(
                res,
                400,
                `Insufficient stock. Available quantity: ${product.stockReal}.`
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
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};


// DELETE /api/commandes/products/:productId
exports.removeItemFromCart = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'You are not authorized to perform this action. Please authenticate and try again.');

        const productId = req.params.productId;
        if (!productId) return errorResponse(res, 400, 'The productId is required. Please provide a valid product identifier.');

        let commande = await findOpenDraft(userId);
        if (!commande) return errorResponse(res, 404, 'No active draft order was found. Please create a new order.');

        const itemIndex = commande.products.findIndex(
            p => String(p.product) === String(productId)
        );
        if (itemIndex === -1) {
            return errorResponse(res, 404, 'The specified product is not present in the cart.');
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
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};


// POST /api/commandes/pay
exports.payCommand = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return errorResponse(res, 401, 'You are not authorized to perform this action. Please authenticate and try again.');

        const { deliveryMode, deliveryAddress, paymentInfo, savePaymentInfo, totalAmount } = req.body;
        const saveNewAddress = deliveryAddress?.saveNewAddress;

        // Find open draft
        let commande = await findOpenDraft(userId);
        if (!commande) return errorResponse(res, 404, 'No active draft order was found. Please create a new order.');

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
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};


// GET /api/commandes/:id
exports.getCommandById = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return errorResponse(res, 401, 'You are not authorized to perform this action. Please authenticate and try again.');

        const id = req.params.id;
        if (!id) return errorResponse(res, 400, 'The order id is required. Please provide a valid identifier.');

        async function attachUserProfileInfoToCommande(commande) {
            if (!commande) return;
            try {
                const userId = (commande.user && commande.user._id) ? commande.user._id : commande.user;
                if (!userId) return;

                const profile = await UserProfile.findOne({ user: userId }).select('firstName lastName phoneNumber photo').lean();
                if (!profile) return;

                commande.infoUser = {
                    firstName: profile.firstName || null,
                    lastName: profile.lastName || null,
                    phoneNumber: profile.phoneNumber || null,
                    photo: profile.photo || null
                };
            } catch (e) {
                console.error('Failed to attach user profile info for commande:', e);
            }
        }

        if (user.role === 'boutique') {
            const boutique = await Boutique.findOne({ owner: user._id }).select('_id');
            if (!boutique) return errorResponse(res, 403, 'No store associated with the authenticated user was found.');

            const commande = await Commande.findOne({ _id: id, boutique: boutique._id })
                .populate({ path: 'products.product', model: 'Product' })
                .exec();

            if (!commande) return errorResponse(res, 404, 'The requested order was not found in your store.');

            const commandeObj = commande.toObject();
            await attachUserProfileInfoToCommande(commandeObj);

            return successResponse(res, 200, null, commandeObj);
        }

        if (user.role === 'user') {
            const commande = await Commande.findOne({ _id: id, user: user._id })
                .populate('boutique')
                .populate({ path: 'products.product', model: 'Product' })
                .exec();

            if (!commande) return errorResponse(res, 404, 'The requested order was not found for this user.');

            return successResponse(res, 200, null, commande);
        }

        const commande = await Commande.findById(id)
            .populate('boutique')
            .populate({ path: 'products.product', model: 'Product' })
            .exec();

        if (!commande) return errorResponse(res, 404, 'The requested order was not found.');

        return successResponse(res, 200, null, commande);
    } catch (err) {
        console.error('getCommandById error:', err);
        return errorResponse(res, 400, 'The provided identifier is invalid. Please check and try again.');
    }
};


// GET /api/commandes
exports.getAllCommands = async (req, res) => {
    try {
        const advanced = res.advancedResults || null;
        if (req.user && req.user.role === 'user' && advanced && Array.isArray(advanced.items) && advanced.items.length) {
            try {
                advanced.items = await Commande.populate(advanced.items, { path: 'boutique', select: '_id name logo' });
            } catch (popErr) {
                console.error('Failed to populate boutique for commandes list (boutique role):', popErr);
            }
        }

        return successResponse(res, 200, null, advanced);
    } catch (err) {
        console.error('getAllCommands error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};

// PATCH /api/commandes/:id/accept
exports.acceptOrder = async (req, res) => {
    let session = null;
    try {
        const user = req.user;
        if (!user) return errorResponse(res, 401, 'Authentication is required to perform this action. Please sign in and try again.');

        const boutique = await Boutique.findOne({ owner: user._id }).select('_id');
        if (!boutique) return errorResponse(res, 403, 'No store was found for the authenticated account. Please verify your account and try again.');

        const id = req.params.id;
        if (!id) return errorResponse(res, 400, 'The order identifier is required. Please provide a valid order identifier and try again.');

        session = await mongoose.startSession();
        session.startTransaction();

        const commande = await Commande.findOne({ _id: id, boutique: boutique._id }).session(session);
        if (!commande) {
            await session.abortTransaction();
            return errorResponse(res, 404, 'No order matching the provided identifier was found for your store. Please verify the identifier and try again.');
        }

        const sellerId = req.user._id;

        const vente = await createVenteFromCommande(commande, sellerId, session);
        console.log(vente);
        await removeEngagement(commande, session);

        // TODO: creation vente, sortie de stock (business logic to be added later)

        commande.status = 'accepted';
        await commande.save({ session });

        await session.commitTransaction();

        return successResponse(res, 200, 'The order status has been successfully updated to "accepted".', commande);
    } catch (err) {
        console.error('acceptOrder error:', err);
        if (session) {
            try { await session.abortTransaction(); } catch (e) { console.error('Failed to abort transaction', e); }
        }
        return errorResponse(res, 500, 'An unexpected server error occurred while processing your request. Please try again later.');
    } finally {
        if (session) session.endSession();
    }
};

// PATCH /api/commandes/:id/cancel
exports.cancelOrder = async (req, res) => {
    let session = null;
    try {
        const user = req.user;
        if (!user) return errorResponse(res, 401, 'Authentication is required to perform this action. Please sign in and try again.');

        const boutique = await Boutique.findOne({ owner: user._id }).select('_id');
        if (!boutique) return errorResponse(res, 403, 'No store was found for the authenticated account. Please verify your account and try again.');

        const id = req.params.id;
        if (!id) return errorResponse(res, 400, 'The order identifier is required. Please provide a valid order identifier and try again.');

        session = await mongoose.startSession();
        session.startTransaction();

        const commande = await Commande.findOne({ _id: id, boutique: boutique._id }).session(session);
        if (!commande) {
            await session.abortTransaction();
            return errorResponse(res, 404, 'No order matching the provided identifier was found for your store. Please verify the identifier and try again.');
        }

        await removeEngagement(commande, session);

        commande.status = 'canceled';
        await commande.save({ session });

        await session.commitTransaction();

        return successResponse(res, 200, 'The order has been canceled successfully.', commande);
    } catch (err) {
        console.error('cancelOrder error:', err);
        if (session) {
            try { await session.abortTransaction(); } catch (e) { console.error('Failed to abort transaction', e); }
        }
        return errorResponse(res, 500, 'An unexpected server error occurred while processing the cancellation. Please try again later.');
    } finally {
        if (session) session.endSession();
    }
};


// PATCH /api/commandes/:id/start-delivery
exports.startDelivery = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return errorResponse(res, 401, 'You are not authorized to perform this action. Please authenticate and try again.');

        const boutique = await Boutique.findOne({ owner: user._id }).select('_id');
        if (!boutique) return errorResponse(res, 403, 'No store associated with the authenticated user was found.');

        const id = req.params.id;
        if (!id) return errorResponse(res, 400, 'The order id is required. Please provide a valid identifier.');

        const commande = await Commande.findOne({ _id: id, boutique: boutique._id }).populate({ path: 'products.product', model: 'Product' }).exec();
        if (!commande) return errorResponse(res, 404, 'The requested order was not found in your store.');

        commande.status = 'delivering';
        await commande.save();

        return successResponse(res, 200, 'Order status updated to delivering', commande);
    } catch (err) {
        console.error('startDelivery error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};

// PATCH /api/commandes/:id/pickup
exports.markAsPickedUp = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return errorResponse(res, 401, 'You are not authorized to perform this action. Please authenticate and try again.');

        const boutique = await Boutique.findOne({ owner: user._id }).select('_id');
        if (!boutique) return errorResponse(res, 403, 'No store associated with the authenticated user was found.');

        const id = req.params.id;
        if (!id) return errorResponse(res, 400, 'The order id is required. Please provide a valid identifier.');

        const commande = await Commande.findOne({ _id: id, boutique: boutique._id }).populate({ path: 'products.product', model: 'Product' }).exec();
        if (!commande) return errorResponse(res, 404, 'The requested order was not found in your store.');

        commande.status = 'success';
        await commande.save();

        return successResponse(res, 200, 'Order status updated to success (picked up)', commande);
    } catch (err) {
        console.error('markAsPickedUp error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};

// PATCH /api/commandes/:id/deliver
exports.markAsDelivered = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return errorResponse(res, 401, 'You are not authorized to perform this action. Please authenticate and try again.');

        const boutique = await Boutique.findOne({ owner: user._id }).select('_id');
        if (!boutique) return errorResponse(res, 403, 'No store associated with the authenticated user was found.');

        const id = req.params.id;
        if (!id) return errorResponse(res, 400, 'The order id is required. Please provide a valid identifier.');

        const commande = await Commande.findOne({ _id: id, boutique: boutique._id }).populate({ path: 'products.product', model: 'Product' }).exec();
        if (!commande) return errorResponse(res, 404, 'The requested order was not found in your store.');

        commande.status = 'success';
        await commande.save();

        return successResponse(res, 200, 'Order status updated to success (delivered)', commande);
    } catch (err) {
        console.error('markAsDelivered error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};
