const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

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

// Get dashboard stats
router.get('/stats', async (req, res) => {
    try {
        // Get real user count from the database
        const userCount = await mongoose.model('User').countDocuments();
        
        // Mock data for other stats
        const stats = {
            users: userCount,
            templates: 25,
            activities: 150,
            lastUpdated: new Date()
        };

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get dashboard summary
router.get('/summary', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get real user counts from the database
        const [totalUsers, newUsers] = await Promise.all([
            mongoose.model('User').countDocuments(),
            mongoose.model('User').countDocuments({ createdAt: { $gte: today } })
        ]);

        // Mock data for other summary information
        const summary = {
            users: {
                total: totalUsers,
                new: newUsers
            },
            templates: {
                total: 25
            },
            recentActivities: [
                {
                    id: 1,
                    type: 'template_created',
                    description: 'New template created',
                    user: {
                        name: 'Admin User',
                        email: 'admin@example.com'
                    },
                    createdAt: new Date()
                }
            ]
        };

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
