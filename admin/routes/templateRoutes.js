const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const auth = require('../middleware/auth');

// Get all templates with filtering and pagination
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

        // Build query
        const query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        // Handle status filter
        if (req.query.isActive !== undefined) {
            query.isActive = req.query.isActive === 'true';
        }

        // Handle date range
        if (startDate && endDate) {
            query.createdAt = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // Get templates
        const templates = await Template.find(query)
            .sort({ [sort]: order === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Get total count
        const totalTemplates = await Template.countDocuments(query);

        // Get statistics
        const stats = {
            active: await Template.countDocuments({ ...query, isActive: true }),
            inactive: await Template.countDocuments({ ...query, isActive: false }),
            categories: await Template.aggregate([
                { $match: query },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ])
        };

        res.json({
            templates,
            totalTemplates,
            totalPages: Math.ceil(totalTemplates / limit),
            currentPage: page,
            stats
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ message: 'Error fetching templates', error: error.message });
    }
});

// Create new template
router.post('/', auth, async (req, res) => {
    try {
        const template = new Template(req.body);
        await template.save();
        res.status(201).json(template);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(400).json({ message: 'Error creating template', error: error.message });
    }
});

// Get template by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ message: 'Error fetching template', error: error.message });
    }
});

// Update template
router.put('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json(template);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(400).json({ message: 'Error updating template', error: error.message });
    }
});

// Toggle template status
router.patch('/:id/toggle-status', auth, async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Toggle the isActive status
        template.isActive = !template.isActive;
        
        // Save and wait for the result
        const updatedTemplate = await template.save();
        
        console.log('Template status updated:', {
            id: updatedTemplate._id,
            title: updatedTemplate.title,
            isActive: updatedTemplate.isActive
        });
        
        res.json(updatedTemplate);
    } catch (error) {
        console.error('Error toggling template status:', error);
        res.status(500).json({ 
            message: 'Error updating template status',
            error: error.message 
        });
    }
});

// Delete template
router.delete('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findByIdAndDelete(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Error deleting template', error: error.message });
    }
});

module.exports = router;
