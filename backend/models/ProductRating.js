const mongoose = require('mongoose');
const Product = require('./Product');
const { Schema } = mongoose;

const ProductRatingSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    }
}, { timestamps: true });

ProductRatingSchema.index({ product: 1, user: 1 }, { unique: true });

ProductRatingSchema.post('save', async function () {
    try {
        const productId = this.product;
        if (!productId) return;

        // Use aggregation to compute total and average safely and efficiently
        const result = await mongoose.model('ProductRating').aggregate([
            { $match: { product: productId } },
            {
                $group: {
                    _id: '$product',
                    total: { $sum: 1 },
                    avg: { $avg: '$rating' }
                }
            }
        ]);

        const total = result.length ? result[0].total : 0;
        const avg = result.length ? result[0].avg : 0;

        await Product.findByIdAndUpdate(productId, { avgRating: avg, totalRatings: total }, { runValidators: true });
    } catch (err) {
        // Log the error — post middleware errors won't affect the original save, but we want visibility
        console.error('Error updating product ratings after save:', err);
    }
});

ProductRatingSchema.post('findOneAndDelete', async function (doc) {
    try {
        if (!doc) return;

        const productId = doc.product;
        if (!productId) return;

        const result = await mongoose.model('ProductRating').aggregate([
            { $match: { product: productId } },
            {
                $group: {
                    _id: '$product',
                    total: { $sum: 1 },
                    avg: { $avg: '$rating' }
                }
            }
        ]);

        const total = result.length ? result[0].total : 0;
        const avg = result.length ? result[0].avg : 0;

        await Product.findByIdAndUpdate(productId, {
            avgRating: avg,
            totalRatings: total
        });

    } catch (err) {
        console.error('Error updating product ratings after findOneAndDelete:', err);
    }
});

const ProductRating = mongoose.model('ProductRating', ProductRatingSchema);

module.exports = ProductRating;
