const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const multer = require('multer');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/previews/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'preview-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
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
    const { title, category, htmlContent } = req.body;
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

    // CSS and JS content are optional but should be strings if provided
    if (req.body.cssContent && typeof req.body.cssContent !== 'string') {
        errors.cssContent = 'CSS content must be a string';
    }

    if (req.body.jsContent && typeof req.body.jsContent !== 'string') {
        errors.jsContent = 'JavaScript content must be a string';
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

// POST /api/templates/create - Create new template
router.post('/create', upload.single('previewImage'), validateTemplateData, async (req, res) => {
    try {
        const templateData = {
            title: req.body.title.trim(),
            category: req.body.category.trim(),
            htmlContent: req.body.htmlContent.trim(),
            cssContent: req.body.cssContent?.trim() || '',
            jsContent: req.body.jsContent?.trim() || '',
            status: req.body.status !== undefined ? req.body.status : true
        };

        // Add preview URL if image was uploaded
        if (req.file) {
            templateData.previewUrl = `/uploads/previews/${req.file.filename}`;
        }

        const template = new Template(templateData);
        const savedTemplate = await template.save();
        
        res.status(201).json({
            success: true,
            message: 'Template created successfully',
            data: savedTemplate
        });
    } catch (error) {
        console.error('Error creating template:', error);
        
        // Remove uploaded file if there was an error
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error removing uploaded file:', err);
            });
        }

        res.status(400).json({
            success: false,
            message: 'Error creating template',
            error: error.message,
            errors: error.errors ? Object.keys(error.errors).reduce((acc, key) => {
                acc[key] = error.errors[key].message;
                return acc;
            }, {}) : null
        });
    }
});

// POST /api/templates - Create new template
router.post('/', async (req, res) => {
    try {
        console.log('Received template data:', req.body);
        
        // Validate required fields
        const { title, category, htmlContent } = req.body;
        if (!title || !category || !htmlContent) {
            console.log('Missing required fields:', {
                title: !!title,
                category: !!category,
                htmlContent: !!htmlContent
            });
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                details: {
                    title: !title ? 'Title is required' : null,
                    category: !category ? 'Category is required' : null,
                    htmlContent: !htmlContent ? 'HTML content is required' : null
                }
            });
        }

        const template = new Template(req.body);
        console.log('Created template instance:', template);
        
        const savedTemplate = await template.save();
        console.log('Saved template:', savedTemplate);
        
        res.status(201).json({
            success: true,
            data: savedTemplate
        });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating template',
            error: error.message,
            details: error.errors ? Object.keys(error.errors).reduce((acc, key) => {
                acc[key] = error.errors[key].message;
                return acc;
            }, {}) : null
        });
    }
});

// PUT /api/templates/:id - Update template
router.put('/:id', async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
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
        res.status(400).json({
            success: false,
            message: 'Error updating template',
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
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const results = [];
        const errors = [];

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', async (data) => {
                try {
                    // Check if template with same title exists
                    const existingTemplate = await Template.findOne({ title: data.title });
                    
                    if (existingTemplate) {
                        // Update existing template
                        Object.assign(existingTemplate, {
                            category: data.category,
                            htmlContent: data.htmlContent,
                            cssContent: data.cssContent,
                            jsContent: data.jsContent,
                            status: data.status === 'true'
                        });
                        await existingTemplate.save();
                        results.push({ title: data.title, action: 'updated' });
                    } else {
                        // Create new template
                        const template = new Template({
                            title: data.title,
                            category: data.category,
                            htmlContent: data.htmlContent,
                            cssContent: data.cssContent,
                            jsContent: data.jsContent,
                            status: data.status === 'true'
                        });
                        await template.save();
                        results.push({ title: data.title, action: 'created' });
                    }
                } catch (error) {
                    errors.push({ title: data.title, error: error.message });
                }
            })
            .on('end', () => {
                // Delete uploaded file
                fs.unlinkSync(req.file.path);

                res.json({
                    success: true,
                    message: 'Templates imported successfully',
                    data: {
                        results,
                        errors
                    }
                });
            });
    } catch (error) {
        console.error('Error importing templates:', error);
        // Clean up uploaded file if exists
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
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
