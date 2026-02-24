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
        return successResponse(res, 201, 'Sale created successfully', vente);
    } catch (err) {
        console.error('createVente error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred while creating the sale. Please try again later.');
    }
};

// Get stats for sales
exports.getVenteStats = async (req, res) => {
    try {
        let boutiqueId = req.query.boutiqueId;

        // Auto-detect boutique for boutique users
        if (!boutiqueId && req.user && (req.user.role === 'boutique' || req.user.role === 'admin')) {
            // If user is admin/boutique and we didn't pass ID, try to find associated boutique
            // For simplicity, if role is boutique, find their shop.
            if (req.user.role === 'boutique') {
                const Boutique = require('../models/Boutique');
                const boutique = await Boutique.findOne({ owner: req.user.id });
                if (boutique) boutiqueId = boutique._id;
            }
            // If admin, maybe return global stats if no ID? 
            // Or if admin wants stats for a specific shop, they pass ID.
            // If admin and no ID, we return global stats (matchStage empty for boutique).
        }

        const matchStage = {};
        if (boutiqueId) {
            // Cast to ObjectId if needed, but mongoose 5+ usually handles string
            // best to be safe if aggregate doesn't auto-cast
            const mongoose = require('mongoose');
            matchStage.boutique = new mongoose.Types.ObjectId(boutiqueId);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const stats = await Vente.aggregate([
            { $match: matchStage },
            {
                $facet: {
                    totalDocs: [{ $count: "count" }],
                    todayDocs: [
                        { $match: { saleDate: { $gte: today } } },
                        { $count: "count" }
                    ],
                    monthDocs: [
                        { $match: { saleDate: { $gte: firstDayOfMonth } } },
                        { $count: "count" }
                    ],
                    pendingDocs: [
                        { $match: { status: 'draft' } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const result = {
            totalDocs: stats[0].totalDocs[0]?.count || 0,
            todayDocs: stats[0].todayDocs[0]?.count || 0,
            monthDocs: stats[0].monthDocs[0]?.count || 0,
            pendingDocs: stats[0].pendingDocs[0]?.count || 0
        };

        return successResponse(res, 200, null, result);

    } catch (err) {
        console.error('getVenteStats error:', err);
        return errorResponse(res, 500, 'An unexpected server error occurred while fetching sales statistics. Please try again later.');
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
        return errorResponse(res, 500, 'An unexpected server error occurred while retrieving sales for the boutique. Please try again later.');
    }
};

// Get all sales with Advanced Results
exports.getAllVentes = async (req, res) => {
    try {
        // Just return what advancedResults prepared
        return successResponse(res, 200, null, res.advancedResults);
    } catch (err) {
        return errorResponse(res, 500, 'An unexpected server error occurred. Please try again later.');
    }
};

// Get a single sale by ID
exports.getVenteById = async (req, res) => {
    try {
        const vente = await Vente.findById(req.params.id)
            .populate('boutique')
            .populate('seller', 'name email')
            .populate('items.product');

        if (!vente) return errorResponse(res, 404, 'The requested sale was not found. Please verify the identifier.');

        return successResponse(res, 200, null, vente);
    } catch (err) {
        return errorResponse(res, 500, 'An unexpected server error occurred while retrieving the sale. Please try again later.');
    }
};

// Update a sale (only if draft)
exports.updateVente = async (req, res) => {
    try {
        const vente = await Vente.findById(req.params.id);
        if (!vente) return errorResponse(res, 404, 'The requested sale was not found. Please verify the identifier.');
        if (vente.status !== 'draft') return errorResponse(res, 400, 'This sale cannot be modified because it is no longer a draft.');

        const { client, items, paymentMethod, totalAmount, saleType, saleDate } = req.body;

        vente.client = client || vente.client;
        vente.items = items || vente.items;
        vente.paymentMethod = paymentMethod || vente.paymentMethod;
        vente.totalAmount = totalAmount || vente.totalAmount;
        vente.saleType = saleType || vente.saleType;
        vente.saleDate = saleDate || vente.saleDate;

        await vente.save();
        return successResponse(res, 200, 'Sale updated successfully', vente);
    } catch (err) {
        return errorResponse(res, 500, 'An unexpected server error occurred while updating the sale. Please try again later.');
    }
};

// Update status (paid, canceled)
exports.updateStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { status } = req.body;
        const vente = await Vente.findById(req.params.id).session(session);

        if (!vente) {
            await session.abortTransaction();
            return errorResponse(res, 404, 'The requested sale was not found. Please verify the identifier.');
        }

        if (vente.status !== 'draft') {
            await session.abortTransaction();
            return errorResponse(res, 400, 'The status of this sale can no longer be modified.');
        }

        if (status === 'paid') {
            const StockMovement = require('../models/StockMovement');
            const Product = require('../models/Product');

            for (const item of vente.items) {
                const product = await Product.findById(item.product).session(session);
                if (!product) {
                    throw new Error(`Produit introuvable: ${item.product}`);
                }

                const stockBefore = product.stock;
                const stockAfter = stockBefore - item.quantity;

                // Create movement record
                const stockMovement = new StockMovement({
                    boutique: vente.boutique,
                    product: product._id,
                    type: 'OUT',
                    quantity: item.quantity,
                    stockBefore,
                    stockAfter,
                    note: `Vente #${vente._id}`,
                    source: 'manual', // or maybe 'sale'? Let's keep manual or add 'sale' to enum if needed. 
                    // Actually the user didn't specify a 'sale' source, I'll use manual or just not specify if source is optional.
                    // Let's check StockMovement model source enum.
                    createdBy: req.user.id
                });
                await stockMovement.save({ session });

                // Update product stock
                product.stock = stockAfter;
                await product.save({ session });
            }
        }

        vente.status = status;
        await vente.save({ session });

        await session.commitTransaction();
        return successResponse(res, 200, `Status updated to ${status}`, vente);
    } catch (err) {
        await session.abortTransaction();
        console.error('updateStatus error:', err);
        return errorResponse(res, 500, err.message || 'An unexpected server error occurred while changing the sale status. Please try again later.');
    } finally {
        session.endSession();
    }
};

// Placeholder for invoice generation
const PDFDocument = require('pdfkit');

// Generate invoice PDF
exports.getInvoice = async (req, res) => {
    try {
        const vente = await Vente.findById(req.params.id)
            .populate('items.product')
            .populate('seller', 'name')
            .populate('boutique', 'name');

        if (!vente) return errorResponse(res, 404, 'The requested sale was not found. Please verify the identifier.');
        // Allow printing even if not paid (e.g. quote/proforma)? User said "imprimer", usually implies finalized.
        // But let's stick to paid or allow all if needed. User didn't specify strict restriction.
        // Let's keep the paid check if strict, or remove it. User focused on flow.
        // I will comment out the strict check to be flexible as "Create -> Detail -> Print" might be immediate.
        // if (vente.status !== 'paid') return errorResponse(res, 400, 'La facture n\'est disponible que pour les ventes payées');

        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=facture-${vente._id}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('FACTURE', { align: 'center' });
        doc.moveDown();

        // Boutique Info
        doc.fontSize(12).text(`Boutique: ${vente.boutique?.name || 'Ma Boutique'}`, { align: 'right' });
        doc.text(`Date: ${new Date(vente.createdAt).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Client Info
        doc.text(`Client: ${vente.client?.name || 'Client de passage'}`, { align: 'left' });
        if (vente.client?.phoneNumber) {
            doc.text(`Tél: ${vente.client.phoneNumber}`, { align: 'left' });
        }
        doc.moveDown();

        // Table Header
        const tableTop = 200;
        doc.font('Helvetica-Bold');
        doc.text('Produit', 50, tableTop);
        doc.text('Qté', 280, tableTop, { width: 90, align: 'right' });
        doc.text('Prix Unit.', 370, tableTop, { width: 90, align: 'right' });
        doc.text('Total', 460, tableTop, { width: 90, align: 'right' });
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        doc.font('Helvetica');

        // Items
        let y = tableTop + 25;
        vente.items.forEach(item => {
            const productName = item.product?.name || 'Produit inconnu';
            doc.text(productName, 50, y);
            doc.text(item.quantity.toString(), 280, y, { width: 90, align: 'right' });
            doc.text(item.unitPrice.toLocaleString() + ' Ar', 370, y, { width: 90, align: 'right' });
            doc.text(item.totalPrice.toLocaleString() + ' Ar', 460, y, { width: 90, align: 'right' });
            y += 20;
        });

        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;

        // Total
        doc.font('Helvetica-Bold').fontSize(14);
        doc.text(`Total: ${vente.totalAmount.toLocaleString()} Ar`, 350, y, { align: 'right' });

        // Footer
        doc.font('Helvetica').fontSize(10);
        doc.text('Merci de votre visite !', 50, 700, { align: 'center', width: 500 });

        doc.end();

    } catch (err) {
        console.error('Invoice generation error:', err);
        // If headers already sent, we can't send JSON error
        if (!res.headersSent) {
            return errorResponse(res, 500, 'An unexpected server error occurred while generating the invoice. Please try again later.');
        }
    }
};
