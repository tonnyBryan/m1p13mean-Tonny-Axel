const Vente = require('../models/Vente');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create a new direct sale
exports.createVente = async (req, res) => {
    try {
        const { boutiqueId, sellerId, client, items, paymentMethod, totalAmount, saleType, saleDate } = req.body;

        const vente = new Vente({
            boutique: boutiqueId,
            seller: sellerId,
            client,
            items,
            paymentMethod,
            totalAmount,
            saleType: saleType || 'dine-in',
            saleDate: saleDate || Date.now(),
            status: 'draft'
        });

        await vente.save();
        return successResponse(res, 201, 'Vente créée avec succès', vente);
    } catch (err) {
        console.error('createVente error:', err);
        return errorResponse(res, 500, 'Erreur lors de la création de la vente');
    }
};

// Get all sales for a boutique
exports.getVentesByBoutique = async (req, res) => {
    try {
        const { boutiqueId } = req.params;
        const ventes = await Vente.find({ boutique: boutiqueId })
            .populate('seller', 'name email')
            .populate('items.product', 'name sku')
            .sort({ createdAt: -1 });

        return successResponse(res, 200, null, ventes);
    } catch (err) {
        console.error('getVentesByBoutique error:', err);
        return errorResponse(res, 500, 'Erreur lors de la récupération des ventes');
    }
};

// Get all sales with Advanced Results
exports.getAllVentes = async (req, res) => {
    try {
        // Just return what advancedResults prepared
        return successResponse(res, 200, null, res.advancedResults);
    } catch (err) {
        return errorResponse(res, 500, 'Erreur serveur');
    }
};

// Get a single sale by ID
exports.getVenteById = async (req, res) => {
    try {
        const vente = await Vente.findById(req.params.id)
            .populate('boutique')
            .populate('seller', 'name email')
            .populate('items.product');

        if (!vente) return errorResponse(res, 404, 'Vente non trouvée');

        return successResponse(res, 200, null, vente);
    } catch (err) {
        return errorResponse(res, 500, 'Erreur serveur');
    }
};

// Update a sale (only if draft)
exports.updateVente = async (req, res) => {
    try {
        const vente = await Vente.findById(req.params.id);
        if (!vente) return errorResponse(res, 404, 'Vente non trouvée');
        if (vente.status !== 'draft') return errorResponse(res, 400, 'Impossible de modifier une vente qui n\'est plus un brouillon');

        const { client, items, paymentMethod, totalAmount, saleType, saleDate } = req.body;

        vente.client = client || vente.client;
        vente.items = items || vente.items;
        vente.paymentMethod = paymentMethod || vente.paymentMethod;
        vente.totalAmount = totalAmount || vente.totalAmount;
        vente.saleType = saleType || vente.saleType;
        vente.saleDate = saleDate || vente.saleDate;

        await vente.save();
        return successResponse(res, 200, 'Vente mise à jour', vente);
    } catch (err) {
        return errorResponse(res, 500, 'Erreur lors de la mise à jour');
    }
};

// Update status (paid, canceled)
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const vente = await Vente.findById(req.params.id);

        if (!vente) return errorResponse(res, 404, 'Vente non trouvée');

        // Logical check: cannot go back to draft, cannot change if already paid or canceled?
        // User said: "paid (modification et annulation impossible)"
        if (vente.status !== 'draft') {
            return errorResponse(res, 400, 'Le statut de cette vente ne peut plus être modifié');
        }

        vente.status = status;
        await vente.save();

        return successResponse(res, 200, `Statut mis à jour vers ${status}`, vente);
    } catch (err) {
        return errorResponse(res, 500, 'Erreur lors du changement de statut');
    }
};

// Placeholder for invoice generation
exports.getInvoice = async (req, res) => {
    try {
        const vente = await Vente.findById(req.params.id).populate('items.product');
        if (!vente) return errorResponse(res, 404, 'Vente non trouvée');
        if (vente.status !== 'paid') return errorResponse(res, 400, 'La facture n\'est disponible que pour les ventes payées');

        // Logic for invoice generation (PDF etc) would go here
        // For now, return the data
        return successResponse(res, 200, 'Facture générée', { invoiceUrl: '#', vente });
    } catch (err) {
        return errorResponse(res, 500, 'Erreur lors de la génération de la facture');
    }
};
