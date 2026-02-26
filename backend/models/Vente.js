const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VenteItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    isSale: { type: Boolean, default: false }
}, { _id: false });

const VenteSchema = new Schema({
    boutique: { type: Schema.Types.ObjectId, ref: 'Boutique', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    client: {
        name: { type: String, required: true },
        phoneNumber: { type: String, default: null },
        email: { type: String, default: null },
        _id: { type: Schema.Types.ObjectId, ref: 'User', default: null } // null if it's a passing client
    },
    items: { type: [VenteItemSchema], default: [] },
    paymentMethod: {
        type: String,
        enum: ['cash', 'mobile_money', 'card'],
        required: true
    },
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['draft', 'paid', 'canceled'],
        default: 'draft'
    },
    saleType: {
        type: String,
        enum: ['dine-in', 'delivery'],
        default: 'dine-in'
    },
    origin: {
        type: String,
        enum: ['direct', 'order'],
        default: 'direct'
    },
    order: { type: Schema.Types.ObjectId, ref: 'Commande', default: null }, // linked order if origin is 'order'
    deliveryPrice: { type: Number, default: 0 },
    saleDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Vente', VenteSchema);
