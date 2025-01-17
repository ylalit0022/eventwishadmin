const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Template = require('../models/Template');
const AdMob = require('../models/AdMob');
const SharedWishes = require('../models/SharedWishes');

// Get recent activity
router.get('/recent-activity', async (req, res) => {
    try {
        // Mock data for recent activity since we don't have an Activity model yet
        const activities = [
            {
                id: 1,
                type: 'template_created',
                description: 'New template created',
                user: {
                    name: 'Admin User',
                    email: 'admin@example.com'
                },
                createdAt: new Date()
            },
            {
                id: 2,
                type: 'file_uploaded',
                description: 'New file uploaded',
                user: {
                    name: 'Admin User',
                    email: 'admin@example.com'
                },
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
            }
        ];

        res.json({
            success: true,
            activities
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get dashboard summary
router.get('/summary', async (req, res) => {
    try {
        const [templateCount, activeAdCount, sharedWishesCount] = await Promise.all([
            Template.countDocuments(),
            AdMob.countDocuments({ status: true }),
            SharedWishes.countDocuments()
        ]);

        res.json({
            success: true,
            message: 'Dashboard summary retrieved successfully',
            data: {
                templateCount,
                activeAdCount,
                sharedWishesCount
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard summary',
            error: error.message
        });
    }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        
        const [
            totalTemplates,
            totalWishes,
            recentWishes,
            activeAds
        ] = await Promise.all([
            Template.countDocuments(),
            SharedWishes.countDocuments(),
            SharedWishes.countDocuments({
                lastViewedAt: { $gte: oneDayAgo }
            }),
            AdMob.countDocuments({ status: true })
        ]);

        res.json({
            success: true,
            message: 'Dashboard stats retrieved successfully',
            data: {
                totalTemplates,
                totalWishes,
                recentWishes,
                activeAds
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
});

module.exports = router;
