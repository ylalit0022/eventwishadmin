const express = require('express');
const router = express.Router();
const SharedFile = require('../models/SharedFile');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Get all shared files
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const searchRegex = new RegExp(search, 'i');

        const query = {
            $or: [
                { filename: searchRegex },
                { description: searchRegex }
            ]
        };

        const [files, total] = await Promise.all([
            SharedFile.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            SharedFile.countDocuments(query)
        ]);

        res.json({
            files,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (err) {
        console.error('Error getting shared files:', err);
        res.status(500).json({ message: 'Error getting shared files' });
    }
});

// Upload new file
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const sharedFile = new SharedFile({
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            description: req.body.description || ''
        });

        await sharedFile.save();
        res.status(201).json(sharedFile);
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

// Get file by ID
router.get('/:id', async (req, res) => {
    try {
        const file = await SharedFile.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        res.json(file);
    } catch (err) {
        console.error('Error getting file:', err);
        res.status(500).json({ message: 'Error getting file' });
    }
});

// Update file details
router.put('/:id', async (req, res) => {
    try {
        const file = await SharedFile.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        res.json(file);
    } catch (err) {
        console.error('Error updating file:', err);
        res.status(500).json({ message: 'Error updating file' });
    }
});

// Delete file
router.delete('/:id', async (req, res) => {
    try {
        const file = await SharedFile.findByIdAndDelete(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error('Error deleting file:', err);
        res.status(500).json({ message: 'Error deleting file' });
    }
});

module.exports = router;
