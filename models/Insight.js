const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    usageCount: {
        type: Number,
        default: 0
    },
    userEngagement: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        action: {
            type: String,
            enum: ['view', 'edit', 'share', 'download']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    demographics: {
        countries: [{
            country: String,
            count: Number
        }],
        devices: [{
            device: String,
            count: Number
        }],
        browsers: [{
            browser: String,
            count: Number
        }]
    },
    dailyStats: [{
        date: {
            type: Date,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        usage: {
            type: Number,
            default: 0
        }
    }]
}, {
    timestamps: true
});

// Add indexes for better query performance
insightSchema.index({ templateId: 1, 'dailyStats.date': 1 });
insightSchema.index({ 'userEngagement.userId': 1 });

const Insight = mongoose.model('Insight', insightSchema);

module.exports = Insight;
