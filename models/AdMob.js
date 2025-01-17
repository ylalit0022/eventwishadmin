const mongoose = require('mongoose');

const adMobSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Ad name is required'],
        trim: true
    },
    adType: {
        type: String,
        required: [true, 'Ad type is required'],
        trim: true
    },
    adUnitCode: {
        type: String,
        required: [true, 'Ad unit code is required'],
        trim: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    platform: {
        type: String,
        enum: ['android', 'ios', 'both'],
        default: 'both'
    },
    description: {
        type: String,
        trim: true
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

// Ensure adUnitCode is unique
adMobSchema.index({ adUnitCode: 1 }, { unique: true });

const AdMob = mongoose.model('AdMob', adMobSchema);

module.exports = AdMob;
