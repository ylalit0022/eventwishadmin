const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

// Helper function to convert to CSV
const convertToCSV = (data, fields) => {
    try {
        const json2csvParser = new Parser({ fields });
        return json2csvParser.parse(data);
    } catch (err) {
        console.error('Error converting to CSV:', err);
        throw err;
    }
};

// Helper function to validate date range
const getDateRange = (dateRange) => {
    if (!dateRange) return {};
    
    const [start, end] = dateRange.split(',').map(date => new Date(date));
    return {
        createdAt: {
            $gte: start,
            $lte: end || new Date()
        }
    };
};

// Validate template data
const validateTemplateData = (req, res, next) => {
    const { title, category, htmlContent, previewUrl } = req.body;
    const errors = {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        errors.title = 'Title is required';
    } else if (title.length > 100) {
        errors.title = 'Title cannot exceed 100 characters';
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
        errors.category = 'Category is required';
    }

    if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.trim().length === 0) {
        errors.htmlContent = 'HTML content is required';
    }

    if (previewUrl && typeof previewUrl !== 'string') {
        errors.previewUrl = 'Preview URL must be a string';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

// POST /api/templates - Create new template
router.post('/', validateTemplateData, async (req, res) => {
    try {
        const templateData = {
            title: req.body.title.trim(),
            category: req.body.category.trim(),
            htmlContent: req.body.htmlContent.trim(),
            cssContent: req.body.cssContent?.trim() || '',
            jsContent: req.body.jsContent?.trim() || '',
            previewUrl: req.body.previewUrl?.trim() || '',
            status: req.body.status === 'false' ? false : true
        };

        const template = new Template(templateData);
        const savedTemplate = await template.save();
        
        res.status(201).json({
            success: true,
            data: savedTemplate
        });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating template',
            error: error.message
        });
    }
});

// PUT /api/templates/:id - Update template
router.put('/:id', validateTemplateData, async (req, res) => {
    try {
        const templateData = {
            title: req.body.title.trim(),
            category: req.body.category.trim(),
            htmlContent: req.body.htmlContent.trim(),
            cssContent: req.body.cssContent?.trim() || '',
            jsContent: req.body.jsContent?.trim() || '',
            previewUrl: req.body.previewUrl?.trim() || '',
            status: req.body.status === 'false' ? false : true
        };

        const template = await Template.findByIdAndUpdate(
            req.params.id,
            { $set: templateData },
            { new: true, runValidators: true }
        );

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating template',
            error: error.message
        });
    }
});

// GET /api/templates - Get all templates with filters
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status;
        const category = req.query.category;
        const dateRange = req.query.dateRange;

        // Build query
        const query = {};
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        if (status !== undefined) {
            query.status = status === 'true';
        }

        if (category) {
            query.category = category;
        }

        if (dateRange) {
            Object.assign(query, getDateRange(dateRange));
        }

        // Get total count
        const total = await Template.countDocuments(query);

        // Get templates with pagination
        const templates = await Template.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Get unique categories for filters
        const categories = await Template.distinct('category', {
            // Only get categories from active templates
            status: true
        });

        // Sort categories alphabetically
        categories.sort((a, b) => a.localeCompare(b));

        res.json({
            success: true,
            data: {
                templates,
                pagination: {
                    page,
                    limit,
                    total
                },
                filters: {
                    categories
                }
            }
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching templates',
            error: error.message
        });
    }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req, res) => {
    try {
        const template = await Template.findByIdAndDelete(req.params.id);
        
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        res.json({
            success: true,
            message: 'Template deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting template',
            error: error.message
        });
    }
});

// POST /api/templates/bulk-delete - Bulk delete templates
router.post('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || !ids.length) {
            return res.status(400).json({
                success: false,
                message: 'No template IDs provided'
            });
        }

        await Template.deleteMany({ _id: { $in: ids } });

        res.json({
            success: true,
            message: 'Templates deleted successfully'
        });
    } catch (error) {
        console.error('Error bulk deleting templates:', error);
        res.status(500).json({
            success: false,
            message: 'Error bulk deleting templates',
            error: error.message
        });
    }
});

// POST /api/templates/bulk-status - Bulk update template status
router.post('/bulk-status', async (req, res) => {
    try {
        const { ids, status } = req.body;
        if (!ids || !Array.isArray(ids) || !ids.length || typeof status !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Invalid request parameters'
            });
        }

        await Template.updateMany(
            { _id: { $in: ids } },
            { $set: { status } }
        );

        res.json({
            success: true,
            message: `Templates ${status ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Error bulk updating template status:', error);
        res.status(500).json({
            success: false,
            message: 'Error bulk updating template status',
            error: error.message
        });
    }
});

// POST /api/templates/import - Import templates from CSV
router.post('/import', async (req, res) => {
    try {
        const { file } = req.body;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const results = [];
        const errors = [];

        const csvData = file.split('\n').map(row => row.split(','));

        for (const data of csvData) {
            try {
                // Check if template with same title exists
                const existingTemplate = await Template.findOne({ title: data[0] });
                
                if (existingTemplate) {
                    // Update existing template
                    Object.assign(existingTemplate, {
                        category: data[1],
                        htmlContent: data[2],
                        cssContent: data[3],
                        jsContent: data[4],
                        status: data[5] === 'true'
                    });
                    await existingTemplate.save();
                    results.push({ title: data[0], action: 'updated' });
                } else {
                    // Create new template
                    const template = new Template({
                        title: data[0],
                        category: data[1],
                        htmlContent: data[2],
                        cssContent: data[3],
                        jsContent: data[4],
                        status: data[5] === 'true'
                    });
                    await template.save();
                    results.push({ title: data[0], action: 'created' });
                }
            } catch (error) {
                errors.push({ title: data[0], error: error.message });
            }
        }

        res.json({
            success: true,
            message: 'Templates imported successfully',
            data: {
                results,
                errors
            }
        });
    } catch (error) {
        console.error('Error importing templates:', error);
        res.status(500).json({
            success: false,
            message: 'Error importing templates',
            error: error.message
        });
    }
});

// GET /api/templates/export - Export templates to CSV
router.get('/export', async (req, res) => {
    try {
        // Build query from filters
        const query = {};
        if (req.query.search) {
            query.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { category: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        if (req.query.status !== undefined) {
            query.status = req.query.status === 'true';
        }
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.dateRange) {
            Object.assign(query, getDateRange(req.query.dateRange));
        }

        // Get templates
        const templates = await Template.find(query);

        // Convert to CSV
        const fields = ['title', 'category', 'htmlContent', 'cssContent', 'jsContent', 'status'];
        const csv = convertToCSV(templates, fields);

        // Set response headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=templates-${new Date().toISOString()}.csv`);

        res.send(csv);
    } catch (error) {
        console.error('Error exporting templates:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting templates',
            error: error.message
        });
    }
});

// PATCH /api/templates/:id/status - Toggle template status
router.patch('/:id/status', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        // Toggle the status
        template.status = !template.status;
        await template.save();

        res.json({
            success: true,
            data: template,
            message: `Template ${template.status ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Error toggling template status:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling template status',
            error: error.message
        });
    }
});

// POST /api/templates/preview - Generate preview HTML
router.post('/preview', async (req, res) => {
    try {
        const { htmlContent, cssContent, jsContent } = req.body;

        // Create preview HTML
        const previewHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${cssContent || ''}</style>
            </head>
            <body>
                ${htmlContent || ''}
                <script>${jsContent || ''}</script>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.send(previewHtml);
    } catch (error) {
        console.error('Error generating preview:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating preview',
            error: error.message
        });
    }
});

module.exports = router;
