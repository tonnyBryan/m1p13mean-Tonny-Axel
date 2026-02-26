const mongoose = require('mongoose');
const { Schema } = mongoose;

const WishlistSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    products: [
        {
            product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            boutique: { type: Schema.Types.ObjectId, ref: 'Boutique', required: true },
            addedAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', WishlistSchema);
