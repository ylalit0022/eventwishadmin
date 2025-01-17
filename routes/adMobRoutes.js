const express = require('express');
const router = express.Router();
const { AdMob } = require('../models/AdMob');

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

// POST /api/admob-ads - Create a new ad
router.post('/', async (req, res) => {
    try {
        const newAd = new AdMob(req.body);
        await newAd.save();
        res.status(201).json({
            success: true,
            data: newAd,
            message: 'Ad created successfully'
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
router.put('/:id', async (req, res) => {
    try {
        const updatedAd = await AdMob.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
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

// PATCH /api/admob-ads/:id/status - Toggle ad status
router.patch('/:id/status', async (req, res) => {
    try {
        const ad = await AdMob.findById(req.params.id);
        
        if (!ad) {
            return res.status(404).json({
                success: false,
                message: 'Ad not found'
            });
        }

        ad.status = !ad.status;
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

module.exports = router;
