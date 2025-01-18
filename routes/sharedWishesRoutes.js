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

// Helper function to format date to DD/MM/YYYY
const formatDateToString = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Helper function to get start and end dates for week
const getWeekDates = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    return {
        start: formatDateToString(startOfWeek),
        end: formatDateToString(endOfWeek)
    };
};

// Helper function to get start and end dates for month
const getMonthDates = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return {
        start: formatDateToString(startOfMonth),
        end: formatDateToString(endOfMonth)
    };
};

// Helper function to validate date format (DD/MM/YYYY)
const isValidDateFormat = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return false;
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return false;
    
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year &&
           year >= 2020 && 
           year <= new Date().getFullYear();
};

// Helper function to parse date string to Date object
const parseDateString = (dateString) => {
    try {
        const [day, month, year] = dateString.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        return date;
    } catch (error) {
        throw new Error(`Invalid date format: ${dateString}. Expected DD/MM/YYYY`);
    }
};

// Helper function to get date range based on filter
const getDateRange = (filter) => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    try {
        // If filter is a date string, validate and parse it
        if (typeof filter === 'string' && filter.includes('/')) {
            if (!isValidDateFormat(filter)) {
                throw new Error(`Invalid date format: ${filter}. Expected DD/MM/YYYY`);
            }
            const startDate = parseDateString(filter);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            endDate.setSeconds(endDate.getSeconds() - 1);
            
            return {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            };
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        switch (filter) {
            case 'today': {
                const endOfDay = new Date(startOfDay);
                endOfDay.setHours(23, 59, 59, 999);
                return {
                    start: startOfDay.toISOString(),
                    end: endOfDay.toISOString()
                };
            }
            
            case 'week': {
                const weekDates = getWeekDates();
                return {
                    start: parseDateString(weekDates.start).toISOString(),
                    end: parseDateString(weekDates.end).toISOString()
                };
            }
            
            case 'month': {
                const monthDates = getMonthDates();
                return {
                    start: parseDateString(monthDates.start).toISOString(),
                    end: parseDateString(monthDates.end).toISOString()
                };
            }
            
            case 'all':
                return {
                    start: new Date(2020, 0, 1).toISOString(),
                    end: now.toISOString()
                };
            
            default:
                throw new Error(`Invalid filter: ${filter}. Expected 'today', 'week', 'month', 'all', or date in DD/MM/YYYY format`);
        }
    } catch (error) {
        console.error('Error in getDateRange:', error);
        // Return today's range as fallback
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);
        
        return {
            start: startOfDay.toISOString(),
            end: endOfDay.toISOString()
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

// Export endpoint
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

// New export endpoint
router.get('/export-new', async (req, res) => {
    try {
        // Get all wishes
        const wishes = await SharedWish.find()
            .sort({ createdAt: -1 })
            .select('recipientName recipientEmail senderName senderEmail views status createdAt');

        if (!wishes || wishes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No data found to export'
            });
        }

        // Convert to CSV
        const csv = convertToCSV(wishes.map(wish => ({
            _id: wish._id,
            recipientName: wish.recipientName,
            recipientEmail: wish.recipientEmail,
            senderName: wish.senderName,
            senderEmail: wish.senderEmail,
            views: wish.views,
            status: wish.status,
            createdAt: wish.createdAt
        })), [
            '_id',
            'recipientName',
            'recipientEmail',
            'senderName',
            'senderEmail',
            'views',
            'status',
            'createdAt'
        ]);

        // Set response headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=wishes-${new Date().toISOString().split('T')[0]}.csv`);

        // Send CSV
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export data',
            error: error.message
        });
    }
});

// Get trending templates with category info
router.get('/trending-templates', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const trendingTemplates = await SharedWish.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$templateId',
                    totalShares: { $sum: 1 },
                    totalViews: { $sum: '$views' }
                }
            },
            {
                $sort: { totalShares: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'templates',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'template'
                }
            },
            {
                $unwind: '$template'
            },
            {
                $project: {
                    templateId: '$_id',
                    templateTitle: '$template.title',
                    templateCategory: '$template.category',
                    previewUrl: '$template.previewUrl',
                    totalShares: 1,
                    totalViews: 1,
                    averageViews: { $divide: ['$totalViews', '$totalShares'] }
                }
            }
        ]);

        res.json({
            success: true,
            data: trendingTemplates
        });
    } catch (error) {
        console.error('Error fetching trending templates:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching trending templates',
            error: error.message
        });
    }
});

// Get enhanced analytics with template categories
router.get('/analytics', async (req, res) => {
    try {
        const filter = req.query.filter || 'today';
        const dateRange = getDateRange(filter);

        // Match stage for the date range
        const matchStage = {
            createdAt: {
                $gte: new Date(dateRange.start),
                $lt: new Date(dateRange.end)
            }
        };

        // Get basic analytics
        const analyticsResult = await SharedWish.aggregate([
            {
                $match: matchStage
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

        // Get category-wise distribution
        const categoryDistribution = await SharedWish.aggregate([
            {
                $match: matchStage
            },
            {
                $lookup: {
                    from: 'templates',
                    localField: 'templateId',
                    foreignField: '_id',
                    as: 'template'
                }
            },
            {
                $unwind: '$template'
            },
            {
                $group: {
                    _id: '$template.category',
                    count: { $sum: 1 },
                    views: { $sum: { $ifNull: ['$views', 0] } }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    views: 1,
                    avgViews: { $divide: ['$views', '$count'] }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Get hourly trend data
        const hourlyTrend = await SharedWish.aggregate([
            {
                $match: matchStage
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        hour: { $hour: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    views: { $sum: { $ifNull: ['$views', 0] } }
                }
            },
            {
                $sort: { '_id.date': 1, '_id.hour': 1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                analytics: analyticsResult[0] || {
                    totalWishes: 0,
                    totalViews: 0,
                    avgViews: 0
                },
                categoryDistribution,
                hourlyTrend
            }
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

// Enhanced export endpoint with template information
router.get('/export-enhanced', async (req, res) => {
    try {
        const filter = req.query.filter;
        if (!filter) {
            return res.status(400).json({
                success: false,
                message: 'Filter parameter is required'
            });
        }

        let dateRange;
        try {
            dateRange = getDateRange(filter);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        let dateQuery = {};
        if (filter !== 'all') {
            dateQuery = {
                createdAt: {
                    $gte: new Date(dateRange.start),
                    $lt: new Date(dateRange.end)
                }
            };
        }

        // Get wishes with template information
        const wishes = await SharedWish.aggregate([
            {
                $match: dateQuery
            },
            {
                $lookup: {
                    from: 'templates',
                    localField: 'templateId',
                    foreignField: '_id',
                    as: 'template'
                }
            },
            {
                $unwind: {
                    path: '$template',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    shortCode: {
                        $toString: {
                            $substr: [{ $toString: '$_id' }, -6, 6]
                        }
                    },
                    templateTitle: { $ifNull: ['$template.title', 'Unknown Template'] },
                    templateCategory: { $ifNull: ['$template.category', 'Uncategorized'] },
                    recipientName: 1,
                    recipientEmail: 1,
                    senderName: 1,
                    senderEmail: 1,
                    views: { $ifNull: ['$views', 0] },
                    status: 1,
                    createdAt: {
                        $dateToString: {
                            format: '%d/%m/%Y %H:%M',
                            date: '$createdAt',
                            timezone: 'Asia/Kolkata'
                        }
                    }
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        if (wishes.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No data found for the selected period (${filter})`
            });
        }

        // Define CSV fields
        const fields = [
            'shortCode',
            'templateTitle',
            'templateCategory',
            'recipientName',
            'recipientEmail',
            'senderName',
            'senderEmail',
            'views',
            'status',
            'createdAt'
        ];

        // Convert to CSV
        const csv = convertToCSV(wishes, fields);

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=wishes-${filter}-${new Date().toISOString().split('T')[0]}.csv`);
        
        // Send CSV
        res.send(csv);
    } catch (error) {
        console.error('Error in export-enhanced:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting data',
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
