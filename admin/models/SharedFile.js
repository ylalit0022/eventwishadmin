const mongoose = require('mongoose');

const sharedFileSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    fileUrl: {
        type: String,
        required: [true, 'File URL is required']
    },
    fileType: {
        type: String,
        required: true,
        enum: ['image', 'document', 'video', 'other']
    },
    size: {
        type: Number,
        required: true
    },
    sharedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sharedWith: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        accessLevel: {
            type: String,
            enum: ['view', 'edit'],
            default: 'view'
        }
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    downloads: {
        type: Number,
        default: 0
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add index for better query performance
sharedFileSchema.index({ sharedBy: 1, 'sharedWith.user': 1 });

const SharedFile = mongoose.model('SharedFile', sharedFileSchema);

module.exports = SharedFile;
