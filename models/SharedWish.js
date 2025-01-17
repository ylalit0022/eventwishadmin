const mongoose = require('mongoose');

const sharedWishSchema = new mongoose.Schema({
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: [true, 'Template ID is required']
    },
    recipientName: {
        type: String,
        required: [true, 'Recipient name is required'],
        trim: true
    },
    recipientEmail: {
        type: String,
        required: [true, 'Recipient email is required'],
        trim: true,
        lowercase: true
    },
    senderName: {
        type: String,
        required: [true, 'Sender name is required'],
        trim: true
    },
    senderEmail: {
        type: String,
        required: [true, 'Sender email is required'],
        trim: true,
        lowercase: true
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true
    },
    views: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'viewed', 'expired'],
        default: 'pending'
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Add indexes for better query performance
sharedWishSchema.index({ status: 1, createdAt: -1 });
sharedWishSchema.index({ templateId: 1 });
sharedWishSchema.index({ recipientEmail: 1 });
sharedWishSchema.index({ senderEmail: 1 });

const SharedWish = mongoose.model('SharedWish', sharedWishSchema);

module.exports = SharedWish;
