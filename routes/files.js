const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const auth = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// File type validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/html',
        'text/css',
        'application/javascript',
        'application/json'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, documents, and text files are allowed.'), false);
    }
};

// Configure multer with limits
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get all files with pagination and search
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';

        const query = {
            originalname: { $regex: search, $options: 'i' }
        };

        const total = await File.countDocuments(query);
        const files = await File.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('uploadedBy', 'name email');

        res.json({
            files,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload a file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const file = new File({
            originalname: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadedBy: req.user._id
        });

        await file.save();
        res.status(201).json(file);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Download a file
router.get('/download/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.download(file.path, file.originalname);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a file
router.delete('/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Delete file from storage
        fs.unlink(file.path, async (err) => {
            if (err) {
                console.error('Error deleting file from storage:', err);
            }
            // Delete file from database
            await file.remove();
            res.json({ message: 'File deleted successfully' });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
