const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');

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
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File type validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
        
        // Web files
        'text/html',
        'text/css',
        'application/javascript',
        'application/json',
        
        // Videos
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Supported files: Images, PDFs, Office documents, CSV, Text files, and Videos.'), false);
    }
};

// Error handling middleware for multer
const uploadMiddleware = (req, res, next) => {
    const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB limit
        }
    }).single('file');

    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    success: false,
                    message: 'File size cannot exceed 5MB'
                });
            }
            return res.status(400).json({ 
                success: false,
                message: err.message
            });
        } else if (err) {
            // An unknown error occurred
            return res.status(400).json({ 
                success: false,
                message: err.message
            });
        }
        // Everything went fine
        next();
    });
};

// Get all files
router.get('/', async (req, res) => {
    try {
        const files = await File.find().sort({ createdAt: -1 });
        console.log('Files found:', files.length); // Debug log
        res.json({
            success: true,
            message: 'Files retrieved successfully',
            data: {
                files,
                total: files.length
            }
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching files',
            error: error.message
        });
    }
});

// Upload a file
router.post('/upload', uploadMiddleware, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const file = new File({
            originalname: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        await file.save();
        console.log('File saved:', file.originalname); // Debug log
        
        res.status(201).json({ 
            success: true,
            message: 'File uploaded successfully',
            data: file
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file',
            error: error.message
        });
    }
});

// Download a file
router.get('/download/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        res.download(file.path, file.originalname);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({
            success: false,
            message: 'Error downloading file',
            error: error.message
        });
    }
});

// Delete a file
router.delete('/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Delete file from storage
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // Delete file document from database
        await file.deleteOne();
        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file',
            error: error.message
        });
    }
});

module.exports = router;
