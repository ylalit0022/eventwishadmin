const express = require('express');
const router = express.Router();
const { AdMob, adTypes } = require('../models/AdMob');

// Validate ad data middleware
const validateAdData = (req, res, next) => {
    try {
        const { adName, adUnitId, adType } = req.body;

        // Skip validation for status-only updates
        if (req.method === 'PATCH' || (Object.keys(req.body).length === 1 && req.body.status !== undefined)) {
            return next();
        }

        const errors = {};
        let hasErrors = false;

        // Validate adName
        if (!adName || typeof adName !== 'string' || adName.trim().length === 0) {
            errors.adName = 'Ad name is required';
            hasErrors = true;
        } else if (adName.length > 100) {
            errors.adName = 'Ad name cannot exceed 100 characters';
            hasErrors = true;
        }

        // Validate adType
        if (!adType) {
            errors.adType = 'Ad type is required';
            hasErrors = true;
        } else if (!adTypes.includes(adType)) {
            errors.adType = `Ad type must be one of: ${adTypes.join(', ')}`;
            hasErrors = true;
        }

        // Validate adUnitId
        if (!adUnitId || typeof adUnitId !== 'string' || adUnitId.trim().length === 0) {
            errors.adUnitId = 'Ad unit ID is required';
            hasErrors = true;
        } else {
            const adUnitIdRegex = /^ca-app-pub-\d{16}\/\d{10}$/;
            if (!adUnitIdRegex.test(adUnitId.trim())) {
                errors.adUnitId = 'Ad unit ID should be like: ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY';
                hasErrors = true;
            }
        }

        if (hasErrors) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during validation',
            error: error.message
        });
    }
};

// Validate status update
const validateStatusUpdate = (req, res, next) => {
    const { status } = req.body;
    if (typeof status !== 'boolean') {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value',
            errors: {
                status: 'Status must be a boolean value'
            }
        });
    }
    next();
};

// GET /api/admob-ads - Get all ads with filters and pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const adType = req.query.adType;
        const status = req.query.status;

        // Build query
        const query = {};
        
        if (search) {
            query.$or = [
                { adName: { $regex: search, $options: 'i' } },
                { adUnitId: { $regex: search, $options: 'i' } }
            ];
        }

        if (adType) {
            query.adType = adType;
        }

        if (status !== undefined) {
            query.status = status === 'true';
        }

        // Get total count
        const total = await AdMob.countDocuments(query);

        // Get ads with pagination
        const ads = await AdMob.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: {
                ads,
                pagination: {
                    page,
                    limit,
                    total
                }
            }
        });
    } catch (error) {
        console.error('Error fetching ads:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ads',
            error: error.message
        });
    }
});

// POST /api/admob-ads/create - Create a new ad
router.post('/create', validateAdData, async (req, res) => {
    try {
        const { adName, adType, adUnitId, status = true } = req.body;

        // Trim input values
        const trimmedAdName = adName.trim();
        const trimmedAdUnitId = adUnitId.trim();

        // Check if ad unit ID already exists
        const existingAd = await AdMob.findOne({ adUnitId: trimmedAdUnitId });
        if (existingAd) {
            return res.status(400).json({
                success: false,
                message: 'Ad unit ID already exists',
                errors: {
                    adUnitId: 'This ad unit ID is already in use'
                }
            });
        }

        // Create new ad
        const newAd = new AdMob({
            adName: trimmedAdName,
            adType,
            adUnitId: trimmedAdUnitId,
            status: status !== undefined ? status : true
        });

        // Save to database
        await newAd.save();
        
        res.status(201).json({
            success: true,
            message: 'Ad created successfully',
            data: newAd
        });
    } catch (error) {
        console.error('Error creating ad:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create ad',
            error: error.message
        });
    }
});

// PUT /api/admob-ads/:id - Update an ad
router.put('/:id', validateAdData, async (req, res) => {
    try {
        // Check if this is a status-only update
        if (Object.keys(req.body).length === 1 && req.body.status !== undefined) {
            const updatedAd = await AdMob.findByIdAndUpdate(
                req.params.id,
                { $set: { status: req.body.status } },
                { new: true }
            );

            if (!updatedAd) {
                return res.status(404).json({
                    success: false,
                    message: 'Ad not found'
                });
            }

            return res.json({
                success: true,
                data: updatedAd,
                message: 'Status updated successfully'
            });
        }

        // Check if ad unit ID already exists for a different ad
        const existingAd = await AdMob.findOne({
            adUnitId: req.body.adUnitId,
            _id: { $ne: req.params.id }
        });
        
        if (existingAd) {
            return res.status(400).json({
                success: false,
                message: 'Ad unit ID already exists',
                errors: {
                    adUnitId: 'This ad unit ID is already in use'
                }
            });
        }

        const updatedAd = await AdMob.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    adName: req.body.adName.trim(),
                    adType: req.body.adType,
                    adUnitId: req.body.adUnitId.trim(),
                    status: req.body.status !== undefined ? req.body.status : true
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedAd) {
            return res.status(404).json({
                success: false,
                message: 'Ad not found'
            });
        }

        res.json({
            success: true,
            data: updatedAd,
            message: 'Ad updated successfully'
        });
    } catch (error) {
        console.error('Error updating ad:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update ad',
            error: error.message
        });
    }
});

// PATCH /api/admob-ads/:id/status - Toggle ad status
router.patch('/:id/status', validateStatusUpdate, async (req, res) => {
    try {
        const ad = await AdMob.findById(req.params.id);
        
        if (!ad) {
            return res.status(404).json({
                success: false,
                message: 'Ad not found'
            });
        }

        ad.status = req.body.status;
        await ad.save();

        res.json({
            success: true,
            data: ad,
            message: 'Ad status updated successfully'
        });
    } catch (error) {
        console.error('Error updating ad status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ad status',
            error: error.message
        });
    }
});

// DELETE /api/admob-ads/:id - Delete an ad
router.delete('/:id', async (req, res) => {
    try {
        const deletedAd = await AdMob.findByIdAndDelete(req.params.id);
        
        if (!deletedAd) {
            return res.status(404).json({
                success: false,
                message: 'Ad not found'
            });
        }

        res.json({
            success: true,
            message: 'Ad deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting ad:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete ad',
            error: error.message
        });
    }
});

module.exports = router;
