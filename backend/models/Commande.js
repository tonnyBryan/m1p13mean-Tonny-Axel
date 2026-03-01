const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommandeProductSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    isSale: { type: Boolean, default: false }
}, { _id: false });

// Delivery address sub-schema: nullable, contains coords, description and price
const DeliveryAddressSchema = new Schema({
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    label: { type: String, default: '' },
    description: { type: String, default: '' },
    price: { type: Number, default: 0 }
}, { _id: false });

const CommandeSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    boutique: { type: Schema.Types.ObjectId, ref: 'Boutique', required: true },
    products: { type: [CommandeProductSchema], default: [] },
    deliveryMode: { type: String, enum: ['pickup', 'delivery'], default: null },
    // structured delivery address (nullable)
    deliveryAddress: { type: DeliveryAddressSchema, default: null },
    paymentMethod: { type: String, default: null },
    status: {
        type: String,
        enum: ['draft','paid','accepted','delivering','success','canceled','expired'],
        default: 'draft'
    },
    reasonCancellation: { type: String, default: null, trim: true },
    totalAmount: { type: Number, default: 0 },
    expiredAt: { type: Date, default: null }
}, { timestamps: true });

// Set expiredAt to createdAt + 1h when creating a draft
CommandeSchema.pre('save', function(next) {
    if (!this.expiredAt) {
        const created = this.createdAt ? this.createdAt : new Date();
        this.expiredAt = new Date(created.getTime() + 60 * 60 * 1000);
    }
    next();
});

module.exports = mongoose.model('Commande', CommandeSchema);
