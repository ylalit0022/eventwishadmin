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
        const [recentWishes, recentFiles] = await Promise.all([
            // Recent shared wishes
            SharedWish.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('recipientName senderName createdAt status'),
            // Recent shared files
            SharedFile.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('fileName originalName owner createdAt')
        ]);

        // Format recent activity
        const formattedActivity = [
            ...recentWishes.map(wish => ({
                type: 'wish',
                title: `Wish shared with ${wish.recipientName || 'Unknown'}`,
                description: `From ${wish.senderName || 'Unknown'}`,
                status: wish.status || 'pending',
                timestamp: wish.createdAt
            })),
            ...recentFiles.map(file => ({
                type: 'file',
                title: `File shared: ${file.originalName || file.fileName}`,
                description: `Shared by ${file.owner}`,
                timestamp: file.createdAt
            }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

        res.json({
            success: true,
            data: {
                counts: {
                    files: totalFiles,
                    sharedFiles: totalSharedFiles,
                    wishes: totalSharedWishes,
                    adMob: totalAdMob
                },
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
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        // Fill in missing dates with zero counts
        const stats = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            stats[dateStr] = {
                files: 0,
                wishes: 0
            };
        }

        // Add file stats
        fileStats.forEach(stat => {
            if (stats[stat._id]) {
                stats[stat._id].files = stat.count;
            }
        });

        // Add wish stats
        wishStats.forEach(stat => {
            if (stats[stat._id]) {
                stats[stat._id].wishes = stat.count;
            }
        });

        // Convert to array and sort by date
        const formattedStats = Object.entries(stats)
            .map(([date, counts]) => ({
                date,
                ...counts
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            success: true,
            data: formattedStats
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
