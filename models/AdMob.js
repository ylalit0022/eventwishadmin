const mongoose = require('mongoose');

const adTypes = [
    { value: 'banner', label: 'Banner Ad' },
    { value: 'interstitial', label: 'Interstitial Ad' },
    { value: 'rewarded', label: 'Rewarded Ad' },
    { value: 'native', label: 'Native Ad' },
    { value: 'app_open', label: 'App Open Ad' }
];

const AdMobSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Ad name is required'],
        trim: true
    },
    adUnitId: {
        type: String,
        required: [true, 'Ad Unit ID is required'],
        unique: true,
        trim: true
    },
    adType: {
        type: String,
        required: [true, 'Ad type is required'],
        enum: {
            values: adTypes.map(type => type.value),
            message: 'Invalid ad type'
        }
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
    timestamps: true
});

// Static method to get ad types
AdMobSchema.statics.getAdTypes = function() {
    return adTypes;
};

// Pre-save middleware to update timestamps
AdMobSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const AdMob = mongoose.model('AdMob', AdMobSchema);

module.exports = {
    AdMob,
    adTypes
};
