const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const csv = require('csv-parse');

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

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
        const categories = await Template.distinct('category');

        // Sort categories alphabetically
        categories.sort((a, b) => a.localeCompare(b));

        res.json({
            success: true,
            data: {
                templates,
                total,
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

// DELETE /api/templates/:id - Delete single template
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'Invalid template ID'
            });
        }

        const template = await Template.findById(id);
        
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        await Template.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Template deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({
            success: false,
            message: error.name === 'CastError' ? 'Invalid template ID format' : 'Error deleting template',
            error: error.message
        });
    }
});

// PUT /api/templates/:id/toggle-status - Toggle template status
router.put('/:id/toggle-status', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        template.status = !template.status;
        await template.save();

        res.json({
            success: true,
            data: template
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

// POST /api/templates/bulk-delete - Bulk delete templates
router.post('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or empty template IDs'
            });
        }

        const result = await Template.deleteMany({ _id: { $in: ids } });
        
        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} templates`,
            data: {
                deletedCount: result.deletedCount
            }
        });
    } catch (error) {
        console.error('Error bulk deleting templates:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting templates'
        });
    }
});

// POST /api/templates/bulk-status - Bulk update template status
router.post('/bulk-status', async (req, res) => {
    try {
        const { ids, status } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or empty template IDs'
            });
        }

        if (typeof status !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Status must be a boolean value'
            });
        }

        const result = await Template.updateMany(
            { _id: { $in: ids } },
            { $set: { status } }
        );
        
        res.json({
            success: true,
            message: `Successfully updated ${result.modifiedCount} templates`,
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('Error updating template statuses:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating template statuses'
        });
    }
});

// POST /api/templates/import - Import templates from CSV
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        if (!req.file.mimetype.includes('csv')) {
            return res.status(400).json({
                success: false,
                message: 'Only CSV files are allowed'
            });
        }

        const results = {
            inserted: 0,
            updated: 0,
            failed: 0,
            errors: []
        };

        // Parse CSV file
        const records = await new Promise((resolve, reject) => {
            const records = [];
            const parser = csv.parse({
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            parser.on('readable', function() {
                let record;
                while ((record = parser.read()) !== null) {
                    records.push(record);
                }
            });
            
            parser.on('error', (err) => {
                reject(new Error(`Error parsing CSV: ${err.message}`));
            });
            
            parser.on('end', () => resolve(records));

            // Feed the file buffer to the parser
            parser.write(req.file.buffer);
            parser.end();
        });

        if (!records || !records.length) {
            return res.status(400).json({
                success: false,
                message: 'No valid records found in CSV file'
            });
        }

        // Process each record
        for (const record of records) {
            try {
                // Validate required fields
                if (!record.title || !record.category || !record.htmlContent) {
                    results.failed++;
                    results.errors.push(`Row with title "${record.title || 'unknown'}" missing required fields`);
                    continue;
                }

                const templateData = {
                    title: record.title.trim(),
                    category: record.category.trim(),
                    htmlContent: record.htmlContent.trim(),
                    cssContent: record.cssContent?.trim() || '',
                    jsContent: record.jsContent?.trim() || '',
                    previewUrl: record.previewUrl?.trim() || '',
                    status: record.status?.toLowerCase() === 'false' ? false : true
                };

                // Check if template with same title exists
                const existingTemplate = await Template.findOne({ title: templateData.title });

                if (existingTemplate) {
                    // Update existing template
                    await Template.findByIdAndUpdate(existingTemplate._id, templateData);
                    results.updated++;
                } else {
                    // Create new template
                    const template = new Template(templateData);
                    await template.save();
                    results.inserted++;
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Error processing row with title "${record.title || 'unknown'}": ${error.message}`);
            }
        }

        res.json({
            success: true,
            message: `Import completed: ${results.inserted} inserted, ${results.updated} updated, ${results.failed} failed`,
            data: results
        });
    } catch (error) {
        console.error('Error importing templates:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error importing templates'
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

module.exports = router;
