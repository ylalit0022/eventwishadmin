const express = require('express');
const router = express.Router();
const { AdMob, adTypes } = require('../models/AdMob');

// Get all AdMob ads with filters and pagination
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            adType, 
            platform, 
            isActive,
            search
        } = req.query;

        // Build query
        const query = {};
        if (adType) query.adType = adType.toUpperCase();
        if (platform) query.platform = platform.toUpperCase();
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { adUnitCode: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const [ads, total] = await Promise.all([
            AdMob.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            AdMob.countDocuments(query)
        ]);

        res.json({
            success: true,
            message: 'AdMob ads retrieved successfully',
            data: {
                ads,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching AdMob ads:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching AdMob ads',
            error: error.message
        });
    }
});

// Create new AdMob ad
router.post('/', async (req, res) => {
    try {
        const adMob = new AdMob({
            ...req.body,
            createdBy: req.body.createdBy || 'admin' // Replace with actual user ID from auth
        });

        await adMob.save();
        
        res.status(201).json({
            success: true,
            message: 'AdMob ad created successfully',
            data: adMob
        });
    } catch (error) {
        console.error('Error creating AdMob ad:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating AdMob ad',
            error: error.message
        });
    }
});

// Update AdMob ad
router.put('/:id', async (req, res) => {
    try {
        const adMob = await AdMob.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!adMob) {
            return res.status(404).json({
                success: false,
                message: 'AdMob ad not found'
            });
        }

        res.json({
            success: true,
            message: 'AdMob ad updated successfully',
            data: adMob
        });
    } catch (error) {
        console.error('Error updating AdMob ad:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating AdMob ad',
            error: error.message
        });
    }
});

// Delete AdMob ad
router.delete('/:id', async (req, res) => {
    try {
        const adMob = await AdMob.findByIdAndDelete(req.params.id);

        if (!adMob) {
            return res.status(404).json({
                success: false,
                message: 'AdMob ad not found'
            });
        }

        res.json({
            success: true,
            message: 'AdMob ad deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting AdMob ad:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting AdMob ad',
            error: error.message
        });
    }
});

// Toggle AdMob ad status
router.patch('/:id/toggle', async (req, res) => {
    try {
        const adMob = await AdMob.findById(req.params.id);

        if (!adMob) {
            return res.status(404).json({
                success: false,
                message: 'AdMob ad not found'
            });
        }

        adMob.isActive = !adMob.isActive;
        await adMob.save();

        res.json({
            success: true,
            message: `AdMob ad ${adMob.isActive ? 'activated' : 'deactivated'} successfully`,
            data: adMob
        });
    } catch (error) {
        console.error('Error toggling AdMob ad:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling AdMob ad',
            error: error.message
        });
    }
});

// Get ad types
router.get('/types', async (req, res) => {
    try {
        res.json({
            success: true,
            data: adTypes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching ad types',
            error: error.message
        });
    }
});

module.exports = router;
