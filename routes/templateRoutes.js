const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const multer = require('multer');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const fs = require('fs');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

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
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    // Clean up the uploaded file
                    fs.unlinkSync(req.file.path);

                    // Process and validate the data
                    const templates = results.map(row => ({
                        title: row.title,
                        category: row.category,
                        htmlContent: row.htmlContent,
                        cssContent: row.cssContent || '',
                        jsContent: row.jsContent || '',
                        previewUrl: row.previewUrl || '',
                        status: row.status === 'true'
                    }));

                    // Insert the templates
                    const inserted = await Template.insertMany(templates, { ordered: false });

                    res.json({
                        success: true,
                        message: `Successfully imported ${inserted.length} templates`,
                        data: inserted
                    });
                } catch (error) {
                    console.error('Error processing CSV:', error);
                    res.status(400).json({
                        success: false,
                        message: 'Error processing CSV file',
                        error: error.message
                    });
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
        // Get query parameters for filtering
        const status = req.query.status;
        const category = req.query.category;
        const dateRange = req.query.dateRange;

        // Build query
        const query = {};
        
        if (status !== undefined) {
            query.status = status === 'true';
        }

        if (category) {
            query.category = category;
        }

        if (dateRange) {
            Object.assign(query, getDateRange(dateRange));
        }

        // Get templates
        const templates = await Template.find(query).sort({ createdAt: -1 });

        // Define CSV fields
        const fields = [
            'title',
            'category',
            'htmlContent',
            'cssContent',
            'jsContent',
            'previewUrl',
            'status',
            'createdAt',
            'updatedAt'
        ];

        // Convert to CSV
        const csv = convertToCSV(templates, fields);

        // Set response headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=templates-${new Date().toISOString()}.csv`
        );

        // Send CSV
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
