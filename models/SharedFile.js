const mongoose = require('mongoose');

const sharedFileSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true,
        trim: true
    },
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            // Add display name virtual
            ret.displayName = ret.originalName;
            // Remove sensitive info
            delete ret.path;
            delete ret.__v;
            return ret;
        }
    }
});

// Virtual for display name
sharedFileSchema.virtual('displayName').get(function() {
    return this.originalName;
});

// Ensure indexes for better query performance
sharedFileSchema.index({ owner: 1, createdAt: -1 });
sharedFileSchema.index({ fileName: 1 });
sharedFileSchema.index({ originalName: 'text', description: 'text' });

module.exports = mongoose.model('SharedFile', sharedFileSchema);
