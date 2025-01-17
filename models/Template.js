const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Title is required'], 
        trim: true 
    },
    category: { 
        type: String, 
        required: [true, 'Category is required'], 
        trim: true 
    },
    htmlContent: { 
        type: String, 
        required: [true, 'HTML content is required'] 
    },
    cssContent: { 
        type: String, 
        default: '' 
    },
    jsContent: { 
        type: String, 
        default: '' 
    },
    previewUrl: { 
        type: String 
    },
    status: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

// Middleware to update the updatedAt field
templateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add indexes for better query performance
templateSchema.index({ status: 1, category: 1, createdAt: -1 });
templateSchema.index({ title: 'text' });

module.exports = mongoose.model('Template', templateSchema);
