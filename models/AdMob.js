const mongoose = require('mongoose');

const adTypes = ['Banner', 'Interstitial', 'Rewarded', 'Native', 'App Open', 'Video'];

// Set strict query mode
mongoose.set('strictQuery', true);

const AdMobSchema = new mongoose.Schema({
    adName: {
        type: String,
        required: [true, 'Ad name is required'],
        trim: true
    },
    adUnitId: {
        type: String,
        required: [true, 'Ad unit ID is required'],
        unique: true,
        trim: true,
        index: true
    },
    adType: {
        type: String,
        required: [true, 'Ad type is required'],
        enum: {
            values: adTypes,
            message: 'Invalid ad type. Must be one of: ' + adTypes.join(', ')
        }
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware to update the updatedAt field
AdMobSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Add indexes for better query performance
AdMobSchema.index({ adName: 1 });
AdMobSchema.index({ adType: 1 });
AdMobSchema.index({ status: 1 });

// Add validation for adUnitId format
AdMobSchema.path('adUnitId').validate(function(value) {
    // Basic format validation for AdMob unit ID
    return /^ca-app-pub-\d{16}\/\d{10}$/.test(value);
}, 'Invalid AdMob unit ID format. Should be like: ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY');

const AdMob = mongoose.model('AdMob', AdMobSchema);

const admobAdSchema = new mongoose.Schema({
    adName: { 
        type: String, 
        required: [true, 'Ad name is required'], 
        trim: true 
    },
    adUnitId: { 
        type: String, 
        required: [true, 'Ad unit ID is required'], 
        trim: true,
        unique: true 
    },
    adType: { 
        type: String, 
        required: [true, 'Ad type is required'],
        enum: adTypes
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
            return ret;
        }
    }
});

// Middleware to update the updatedAt field
admobAdSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const AdmobAd = mongoose.model('AdmobAd', admobAdSchema);

module.exports = { AdMob, AdmobAd, adTypes };
