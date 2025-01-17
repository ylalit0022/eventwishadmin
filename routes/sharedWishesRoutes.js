const express = require('express');
const router = express.Router();
const SharedWish = require('../models/SharedWish');

// Helper function to convert to CSV
const convertToCSV = (data, fields) => {
    // Create CSV header
    let csv = fields.join(',') + '\n';
    
    // Add data rows
    data.forEach(item => {
        const row = fields.map(field => {
            const value = field.split('.').reduce((obj, key) => obj?.[key], item);
            // Escape commas and quotes
            return `"${String(value || '').replace(/"/g, '""')}"`;
        });
        csv += row.join(',') + '\n';
    });
    
    return csv;
};

// Helper function to validate date format (DD/MM/YYYY)
const isValidDateFormat = (dateString) => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return false;
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
};

// Helper function to format date to ISO string with timezone
const formatDate = (date) => {
    return date.toISOString();
};

// Helper function to get date range based on filter
const getDateRange = (filter) => {
    const now = new Date();
    
    // Handle specific date format (DD/MM/YYYY)
    if (isValidDateFormat(filter)) {
        const [day, month, year] = filter.split('/').map(Number);
        const startDate = new Date(year, month - 1, day);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);
        
        return {
            start: formatDate(startDate),
            end: formatDate(endDate)
        };
    }
    
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
        case 'today':
            return {
                start: formatDate(startOfDay),
                end: formatDate(new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000))
            };
            
        case 'week': {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7); // End of week (Saturday)
            
            return {
                start: formatDate(startOfWeek),
                end: formatDate(endOfWeek)
            };
        }
            
        case 'month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            
            return {
                start: formatDate(startOfMonth),
                end: formatDate(endOfMonth)
            };
        }
            
        case 'all':
            return {
                start: formatDate(new Date(2020, 0, 1)), // Start from year 2020
                end: formatDate(new Date(now.getTime() + 24 * 60 * 60 * 1000)) // Tomorrow
            };
            
        default:
            return {
                start: formatDate(startOfDay),
                end: formatDate(new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000))
            };
    }
};

// Get all shared wishes with pagination, search, and filters
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const filter = req.query.filter || 'today';

        console.log('Received filter:', filter);

        // Get date range based on filter
        const dateRange = getDateRange(filter);
        console.log('Date range:', {
            start: new Date(dateRange.start).toLocaleString(),
            end: new Date(dateRange.end).toLocaleString(),
            filter
        });

        // Build search query
        const searchQuery = {
            createdAt: {
                $gte: new Date(dateRange.start),
                $lt: new Date(dateRange.end)
            }
        };

        if (search) {
            searchQuery.$or = [
                { recipientName: { $regex: search, $options: 'i' } },
                { recipientEmail: { $regex: search, $options: 'i' } },
                { senderName: { $regex: search, $options: 'i' } },
                { senderEmail: { $regex: search, $options: 'i' } }
            ];
        }

        console.log('Search query:', JSON.stringify(searchQuery, null, 2));

        // Get total count for pagination
        const total = await SharedWish.countDocuments(searchQuery);
        console.log('Total documents found:', total);

        // Get wishes with pagination
        const wishes = await SharedWish.find(searchQuery)
            .populate('templateId', 'previewUrl')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Format response
        const formattedWishes = wishes.map(wish => ({
            id: wish._id,
            shortCode: wish._id.toString().slice(-6).toUpperCase(),
            recipientName: wish.recipientName,
            senderName: wish.senderName,
            status: wish.status,
            views: wish.views || 0,
            createdAt: wish.createdAt,
            previewUrl: wish.templateId?.previewUrl || null
        }));

        // Get analytics for the filtered period
        const analyticsResult = await SharedWish.aggregate([
            {
                $match: searchQuery
            },
            {
                $group: {
                    _id: null,
                    totalWishes: { $sum: 1 },
                    totalViews: { $sum: { $ifNull: ['$views', 0] } },
                    avgViews: { $avg: { $ifNull: ['$views', 0] } }
                }
            }
        ]);

        // Get top performing wish
        const topWish = await SharedWish.findOne(searchQuery)
            .sort({ views: -1 })
            .limit(1);

        // Get trend data (group by day)
        const trend = await SharedWish.aggregate([
            {
                $match: searchQuery
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    wishes: { $sum: 1 },
                    views: { $sum: { $ifNull: ['$views', 0] } }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Ensure analytics has values even if no results
        const analytics = analyticsResult[0] || { totalWishes: 0, totalViews: 0, avgViews: 0 };

        res.json({
            success: true,
            data: {
                wishes: formattedWishes,
                pagination: {
                    page,
                    limit,
                    total
                },
                analytics: {
                    totalWishes: analytics.totalWishes || 0,
                    totalViews: analytics.totalViews || 0,
                    avgViews: Math.round((analytics.avgViews || 0) * 10) / 10,
                    topWish: topWish ? {
                        recipientName: topWish.recipientName,
                        views: topWish.views || 0
                    } : null,
                    trend: trend.map(t => ({
                        _id: t._id,
                        views: t.views || 0,
                        wishes: t.wishes || 0
                    }))
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

// Export shared wishes as CSV
router.get('/export', async (req, res) => {
    try {
        const filter = req.query.filter || 'today';
        const dateRange = getDateRange(filter);

        const wishes = await SharedWish.find({
            createdAt: {
                $gte: new Date(dateRange.start),
                $lt: new Date(dateRange.end)
            }
        }).sort({ createdAt: -1 });

        const fields = [
            'shortCode',
            'recipientName',
            'recipientEmail',
            'senderName',
            'senderEmail',
            'message',
            'views',
            'status',
            'createdAt'
        ];

        const formattedData = wishes.map(wish => ({
            shortCode: wish._id.toString().slice(-6).toUpperCase(),
            recipientName: wish.recipientName || '',
            recipientEmail: wish.recipientEmail || '',
            senderName: wish.senderName || '',
            senderEmail: wish.senderEmail || '',
            message: wish.message || '',
            views: wish.views || 0,
            status: wish.status || '',
            createdAt: wish.createdAt.toISOString()
        }));

        const csv = convertToCSV(formattedData, fields);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=shared-wishes-${filter}-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting shared wishes:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting shared wishes',
            error: error.message
        });
    }
});

// Get analytics
router.get('/analytics', async (req, res) => {
    try {
        // Get total wishes
        const totalWishes = await SharedWish.countDocuments();

        // Get total views
        const viewsAggregation = await SharedWish.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: { $ifNull: ['$views', 0] } },
                    averageViews: { $avg: { $ifNull: ['$views', 0] } },
                    mostViewed: { $max: { $ifNull: ['$views', 0] } }
                }
            }
        ]);

        // Get recent views (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentViews = await SharedWish.countDocuments({
            updatedAt: { $gte: oneDayAgo },
            views: { $gt: 0 }
        });

        const analytics = {
            totalWishes,
            totalViews: viewsAggregation[0]?.totalViews || 0,
            averageViews: Math.round((viewsAggregation[0]?.averageViews || 0) * 10) / 10,
            mostViewed: viewsAggregation[0]?.mostViewed || 0,
            recentViews
        };

        res.json({
            success: true,
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

// Get a single shared wish by ID
router.get('/:id', async (req, res) => {
    try {
        const wish = await SharedWish.findById(req.params.id);
        if (!wish) {
            return res.status(404).json({
                success: false,
                message: 'Shared wish not found'
            });
        }
        res.json({
            success: true,
            data: wish
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching shared wish',
            error: error.message
        });
    }
});

// Update shared wish
router.patch('/:id', async (req, res) => {
    try {
        const wish = await SharedWish.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!wish) {
            return res.status(404).json({
                success: false,
                message: 'Shared wish not found'
            });
        }
        res.json({
            success: true,
            data: wish
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating shared wish',
            error: error.message
        });
    }
});

// Delete shared wish
router.delete('/:id', async (req, res) => {
    try {
        const wish = await SharedWish.findByIdAndDelete(req.params.id);
        if (!wish) {
            return res.status(404).json({
                success: false,
                message: 'Shared wish not found'
            });
        }
        res.json({
            success: true,
            message: 'Shared wish deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting shared wish',
            error: error.message
        });
    }
});

module.exports = router;
