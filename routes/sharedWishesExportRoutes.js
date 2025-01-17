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

// Helper function to format date for filename
const formatDateForFilename = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate().toString().padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

// Helper function to get the first day of month
const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Helper function to get the last day of month
const getLastDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

// Helper function to get date range based on enhanced filter
const getEnhancedDateRange = (filter) => {
    const now = new Date();

    // Handle specific date (DD/MM/YYYY)
    if (filter.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        if (!isValidDateFormat(filter)) {
            throw new Error('Invalid date format. Use DD/MM/YYYY');
        }
        const [day, month, year] = filter.split('/').map(Number);
        const specificDate = new Date(year, month - 1, day);
        specificDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(specificDate);
        nextDay.setDate(specificDate.getDate() + 1);
        
        return {
            start: specificDate,
            end: nextDay,
            label: formatDateForFilename(specificDate)
        };
    }

    // Handle other filter types
    switch (filter) {
        case 'this-month': {
            const start = getFirstDayOfMonth(now);
            const end = getLastDayOfMonth(now);
            return {
                start,
                end,
                label: `${months[start.getMonth()]}-${start.getFullYear()}`
            };
        }

        case 'last-month': {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const start = getFirstDayOfMonth(lastMonth);
            const end = getLastDayOfMonth(lastMonth);
            return {
                start,
                end,
                label: `${months[start.getMonth()]}-${start.getFullYear()}`
            };
        }

        case 'all-time':
            return {
                start: new Date(2020, 0, 1), // Start from 2020
                end: new Date(now.getFullYear() + 1, 0, 1), // Until next year
                label: 'All-Time'
            };

        default:
            throw new Error('Invalid filter type. Use DD/MM/YYYY, this-month, last-month, or all-time');
    }
};

// Enhanced export endpoint with flexible date filtering
router.get('/enhanced', async (req, res) => {
    try {
        const filter = req.query.filter;
        
        if (!filter) {
            return res.status(400).json({
                success: false,
                message: 'Filter parameter is required. Use DD/MM/YYYY, this-month, last-month, or all-time'
            });
        }

        // Get date range based on filter
        const dateRange = getEnhancedDateRange(filter);

        // Build query
        const query = filter === 'all-time' ? {} : {
            createdAt: {
                $gte: dateRange.start,
                $lte: dateRange.end
            }
        };

        // Fetch wishes
        const wishes = await SharedWish.find(query).sort({ createdAt: -1 });

        // Define CSV fields
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

        // Convert to CSV
        const csv = convertToCSV(wishes, fields);

        // Set response headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=wishes-${dateRange.label}-${formatDateForFilename(new Date())}.csv`
        );

        // Send CSV
        res.send(csv);

    } catch (error) {
        console.error('Error exporting wishes:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error exporting wishes'
        });
    }
});

module.exports = router;
