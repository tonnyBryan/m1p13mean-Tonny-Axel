const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    channel: {
        type: String,
        enum: ['system', 'order', 'sale', 'stock', 'message'],
        default: 'system'
    },

    type: {
        type: String,
        required: true // ex: order_created, stock_low, sale_completed
    },

    severity: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    },

    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    payload: {
        type: Schema.Types.Mixed,
        default: {} // orderId, saleId, url, etc.
    },

    url: {
        type: String,
        default: null
    },

    isRead: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
