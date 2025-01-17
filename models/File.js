const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    originalname: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Changed to false since we don't have user auth yet
    }
}, {
    timestamps: true
});

// Virtual for file URL
fileSchema.virtual('url').get(function() {
    return `/api/files/download/${this._id}`;
});

// Add file type virtual
fileSchema.virtual('type').get(function() {
    if (this.mimetype.startsWith('image/')) return 'image';
    if (this.mimetype === 'application/pdf') return 'pdf';
    if (this.mimetype.includes('word') || this.mimetype === 'text/plain') return 'document';
    if (this.mimetype === 'text/html' || this.mimetype === 'text/css' || 
        this.mimetype === 'application/javascript' || this.mimetype === 'application/json') return 'code';
    return 'default';
});

// Include virtuals when converting to JSON
fileSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('File', fileSchema);
