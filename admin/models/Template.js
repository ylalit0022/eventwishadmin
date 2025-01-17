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
    isActive: {
        type: Boolean,
        default: true,
        required: true,
        index: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            ret.isActive = ret.isActive === undefined ? true : Boolean(ret.isActive);
            return ret;
        }
    }
});

// Add indexes for better query performance
templateSchema.index({ title: 1, category: 1 });

// Middleware to handle status changes
templateSchema.pre('save', function(next) {
    // Ensure isActive is boolean
    this.isActive = this.isActive === undefined ? true : Boolean(this.isActive);
    
    if (this.isModified('isActive')) {
        console.log('Template status changed:', {
            id: this._id,
            title: this.title,
            isActive: this.isActive
        });
    }
    next();
});

// Middleware for findOneAndUpdate
templateSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.isActive !== undefined) {
        update.$set.isActive = Boolean(update.$set.isActive);
    } else if (update.isActive !== undefined) {
        update.isActive = Boolean(update.isActive);
    }
    next();
});

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;
