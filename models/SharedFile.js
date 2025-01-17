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
    sharedWith: [{
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        accessLevel: {
            type: String,
            enum: ['view', 'edit'],
            default: 'view'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    owner: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true
    },
    isPublic: {
        type: Boolean,
        default: false
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

// Indexes for better query performance
sharedFileSchema.index({ owner: 1, createdAt: -1 });
sharedFileSchema.index({ 'sharedWith.email': 1 });
sharedFileSchema.index({ fileName: 'text', description: 'text' });

module.exports = mongoose.model('SharedFile', sharedFileSchema);
