const express = require('express');
const router = express.Router();
const SharedWish = require('../models/SharedWish');
const AdMob = require('../models/AdMob').AdMob;
const File = require('../models/File');
const SharedFile = require('../models/SharedFile');

// Get dashboard summary
router.get('/summary', async (req, res) => {
    try {
        const [totalFiles, totalSharedFiles, totalSharedWishes, totalAdMob] = await Promise.all([
            File.countDocuments(),
            SharedFile.countDocuments(),
            SharedWish.countDocuments(),
            AdMob.countDocuments()
        ]);

        // Get recent activity
        const recentActivity = await Promise.all([
            // Recent shared wishes
            SharedWish.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('recipientName senderName createdAt status'),
            // Recent shared files
            SharedFile.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('fileName sharedWith createdAt')
        ]);

        // Format recent activity
        const formattedActivity = [
            ...recentActivity[0].map(wish => ({
                type: 'wish',
                title: `Wish shared with ${wish.recipientName}`,
                description: `From ${wish.senderName}`,
                status: wish.status,
                timestamp: wish.createdAt
            })),
            ...recentActivity[1].map(file => ({
                type: 'file',
                title: `File shared: ${file.fileName}`,
                description: `Shared with ${file.sharedWith.length} users`,
                timestamp: file.createdAt
            }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

        res.json({
            success: true,
            data: {
                totalFiles,
                totalSharedFiles,
                totalSharedWishes,
                totalAdMob,
                recentActivity: formattedActivity
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
        // Get stats for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [fileStats, wishStats] = await Promise.all([
            // File sharing stats
            SharedFile.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Wish sharing stats
            SharedWish.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        count: { $sum: 1 },
                        views: { $sum: '$views' }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                fileStats,
                wishStats
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
