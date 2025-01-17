const express = require('express');
const router = express.Router();
const Template = require('../models/Template');

// Get all templates with pagination and search
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, title = '', category = '', status } = req.query;
        const query = {};

        // Add search conditions
        if (title) {
            query.title = new RegExp(title, 'i');
        }
        if (category) {
            query.category = new RegExp(category, 'i');
        }
        if (status !== undefined) {
            query.isActive = status === 'true';
        }

        const [templates, total] = await Promise.all([
            Template.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Template.countDocuments(query)
        ]);

        res.json({
            success: true,
            templates,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        console.error('Error getting templates:', err);
        res.status(500).json({ success: false, message: 'Error getting templates' });
    }
});

// Get template categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Template.distinct('category');
        res.json({
            success: true,
            categories: categories.map(name => ({ name }))
        });
    } catch (err) {
        console.error('Error getting categories:', err);
        res.status(500).json({ success: false, message: 'Error getting categories' });
    }
});

// Get template by ID
router.get('/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }
        res.json({ success: true, template });
    } catch (err) {
        console.error('Error getting template:', err);
        res.status(500).json({ success: false, message: 'Error getting template' });
    }
});

// Create new template
router.post('/', async (req, res) => {
    try {
        const template = new Template(req.body);
        await template.save();
        res.status(201).json({ success: true, template });
    } catch (err) {
        console.error('Error creating template:', err);
        res.status(400).json({ success: false, message: err.message });
    }
});

// Update template
router.put('/:id', async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }
        res.json({ success: true, template });
    } catch (err) {
        console.error('Error updating template:', err);
        res.status(400).json({ success: false, message: err.message });
    }
});

// Delete template
router.delete('/:id', async (req, res) => {
    try {
        const template = await Template.findByIdAndDelete(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }
        res.json({ success: true, message: 'Template deleted successfully' });
    } catch (err) {
        console.error('Error deleting template:', err);
        res.status(500).json({ success: false, message: 'Error deleting template' });
    }
});

// Bulk import templates
router.post('/bulk-import', async (req, res) => {
    try {
        const { templates } = req.body;
        
        // Validate templates
        if (!Array.isArray(templates)) {
            return res.status(400).json({
                success: false,
                message: 'Templates must be an array'
            });
        }

        const importedTemplates = await Template.insertMany(templates);
        res.status(201).json({
            success: true,
            templates: importedTemplates
        });
    } catch (err) {
        console.error('Error importing templates:', err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

// Update template status
router.patch('/:id/status', async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            { isActive: req.body.isActive },
            { new: true }
        );
        
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }
        
        res.json({ success: true, template });
    } catch (err) {
        console.error('Error updating template status:', err);
        res.status(500).json({ success: false, message: 'Error updating template status' });
    }
});

// Get template statistics
router.get('/stats/dashboard', async (req, res) => {
    try {
        const [totalTemplates, templatesByCategory] = await Promise.all([
            Template.countDocuments(),
            Template.aggregate([
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalTemplates,
                templatesByCategory
            }
        });
    } catch (err) {
        console.error('Error getting template stats:', err);
        res.status(500).json({ success: false, message: 'Error getting template stats' });
    }
});

module.exports = router;
