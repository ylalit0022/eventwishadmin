const express = require('express');
const router = express.Router();
const SharedWishes = require('../models/SharedWishes');

// Get all shared wishes with analytics
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        // Build search query
        const searchQuery = search
            ? {
                $or: [
                    { shortCode: { $regex: search, $options: 'i' } },
                    { recipientName: { $regex: search, $options: 'i' } },
                    { senderName: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        // Execute query with pagination
        const [wishes, total] = await Promise.all([
            SharedWishes.find(searchQuery)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .populate('templateId', 'name'),
            SharedWishes.countDocuments(searchQuery)
        ]);

        // Get analytics data
        const analytics = {
            totalWishes: total,
            totalViews: wishes.reduce((sum, wish) => sum + wish.views, 0),
            averageViews: wishes.length > 0 
                ? (wishes.reduce((sum, wish) => sum + wish.views, 0) / wishes.length).toFixed(2)
                : 0,
            mostViewed: wishes.reduce((max, wish) => wish.views > max ? wish.views : max, 0),
            recentViews: wishes.filter(wish => {
                const lastDay = new Date();
                lastDay.setDate(lastDay.getDate() - 1);
                return wish.lastViewedAt && new Date(wish.lastViewedAt) > lastDay;
            }).length
        };

        res.json({
            success: true,
            message: 'Shared wishes retrieved successfully',
            data: {
                wishes,
                analytics,
                pagination: {
                    total,
                    page: parseInt(page),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching shared wishes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shared wishes',
            error: error.message
        });
    }
});

// Get analytics summary
router.get('/analytics', async (req, res) => {
    try {
        const allWishes = await SharedWishes.find();
        
        // Calculate time periods
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const analytics = {
            total: {
                wishes: allWishes.length,
                views: allWishes.reduce((sum, wish) => sum + wish.views, 0)
            },
            recent: {
                daily: allWishes.filter(wish => wish.createdAt > oneDayAgo).length,
                weekly: allWishes.filter(wish => wish.createdAt > oneWeekAgo).length,
                monthly: allWishes.filter(wish => wish.createdAt > oneMonthAgo).length
            },
            views: {
                daily: allWishes.filter(wish => wish.lastViewedAt > oneDayAgo)
                    .reduce((sum, wish) => sum + wish.views, 0),
                weekly: allWishes.filter(wish => wish.lastViewedAt > oneWeekAgo)
                    .reduce((sum, wish) => sum + wish.views, 0),
                monthly: allWishes.filter(wish => wish.lastViewedAt > oneMonthAgo)
                    .reduce((sum, wish) => sum + wish.views, 0)
            },
            topWishes: allWishes
                .sort((a, b) => b.views - a.views)
                .slice(0, 5)
        };

        res.json({
            success: true,
            message: 'Analytics retrieved successfully',
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics',
            error: error.message
        });
    }
});

module.exports = router;
