const mongoose = require('mongoose');

const sharedWishesSchema = new mongoose.Schema({
    shortCode: {
        type: String,
        required: true,
        unique: true
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Template'
    },
    recipientName: {
        type: String,
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    customizedHtml: {
        type: String,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    lastViewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

const SharedWishes = mongoose.model('SharedWishes', sharedWishesSchema);

module.exports = SharedWishes;
