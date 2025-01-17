const express = require('express');
const router = express.Router();
const AdMob = require('../models/AdMob');

// Get all AdMob units
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const searchRegex = new RegExp(search, 'i');

        const query = {
            $or: [
                { adUnitName: searchRegex },
                { adUnitCode: searchRegex }
            ]
        };

        const [adMobs, total] = await Promise.all([
            AdMob.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            AdMob.countDocuments(query)
        ]);

        res.json({
            adMobs,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (err) {
        console.error('Error getting AdMob units:', err);
        res.status(500).json({ message: 'Error getting AdMob units' });
    }
});

// Get AdMob types
router.get('/types', async (req, res) => {
    try {
        const types = ['banner', 'interstitial', 'rewarded'];
        res.json(types);
    } catch (err) {
        console.error('Error getting AdMob types:', err);
        res.status(500).json({ message: 'Error getting AdMob types' });
    }
});

// Create new AdMob unit
router.post('/', async (req, res) => {
    try {
        const adMob = new AdMob(req.body);
        await adMob.save();
        res.status(201).json(adMob);
    } catch (err) {
        console.error('Error creating AdMob unit:', err);
        res.status(500).json({ message: 'Error creating AdMob unit' });
    }
});

// Update AdMob unit
router.put('/:id', async (req, res) => {
    try {
        const adMob = await AdMob.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!adMob) {
            return res.status(404).json({ message: 'AdMob unit not found' });
        }
        res.json(adMob);
    } catch (err) {
        console.error('Error updating AdMob unit:', err);
        res.status(500).json({ message: 'Error updating AdMob unit' });
    }
});

// Toggle AdMob unit status
router.put('/:id/toggle', async (req, res) => {
    try {
        const adMob = await AdMob.findById(req.params.id);
        if (!adMob) {
            return res.status(404).json({ message: 'AdMob unit not found' });
        }
        adMob.isActive = !adMob.isActive;
        await adMob.save();
        res.json(adMob);
    } catch (err) {
        console.error('Error toggling AdMob unit status:', err);
        res.status(500).json({ message: 'Error toggling AdMob unit status' });
    }
});

// Delete AdMob unit
router.delete('/:id', async (req, res) => {
    try {
        const adMob = await AdMob.findByIdAndDelete(req.params.id);
        if (!adMob) {
            return res.status(404).json({ message: 'AdMob unit not found' });
        }
        res.json({ message: 'AdMob unit deleted successfully' });
    } catch (err) {
        console.error('Error deleting AdMob unit:', err);
        res.status(500).json({ message: 'Error deleting AdMob unit' });
    }
});

module.exports = router;
