const express = require('express');
const router = express.Router();
const SharedFile = require('../models/SharedFile');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/shared';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
        // Store fileName in request object to use it later
        req.generatedFileName = fileName;
        cb(null, fileName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

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

// Helper function to format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get all shared files
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const searchRegex = new RegExp(search, 'i');

        const query = {
            $or: [
                { fileName: searchRegex },
                { description: searchRegex }
            ]
        };

        const [files, total] = await Promise.all([
            SharedFile.find(query)
                .select('_id fileName originalName size mimeType owner description createdAt')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            SharedFile.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                files: files.map(file => ({
                    _id: file._id,
                    fileName: file.originalName, // Use originalName for display
                    downloadName: file.fileName, // Keep generated name for download
                    size: file.size,
                    mimeType: file.mimeType,
                    owner: file.owner,
                    description: file.description,
                    createdAt: file.createdAt
                })),
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page)
            }
        });
    } catch (err) {
        console.error('Error getting shared files:', err);
        res.status(500).json({ 
            success: false,
            message: 'Error getting shared files' 
        });
    }
});

// Export shared files
router.get('/export', async (req, res) => {
    try {
        const { filter } = req.query;
        let query = {};

        // Apply date filter if provided
        if (filter) {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            switch (filter) {
                case 'today':
                    query.createdAt = {
                        $gte: startOfDay,
                        $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
                    };
                    break;
                case 'week': {
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);
                    query.createdAt = {
                        $gte: startOfWeek,
                        $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
                    };
                    break;
                }
                case 'month': {
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    query.createdAt = {
                        $gte: startOfMonth,
                        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
                    };
                    break;
                }
                // For 'all' or no filter, don't add date constraints
            }
        }

        const files = await SharedFile.find(query)
            .select('fileName originalName size mimeType owner description createdAt')
            .sort({ createdAt: -1 });

        const fields = [
            'fileName',
            'originalName',
            'size',
            'mimeType',
            'owner',
            'description',
            'createdAt'
        ];

        const formattedData = files.map(file => ({
            fileName: file.fileName,
            originalName: file.originalName,
            size: formatFileSize(file.size),
            mimeType: file.mimeType,
            owner: file.owner,
            description: file.description || '',
            createdAt: file.createdAt.toISOString()
        }));

        const csv = convertToCSV(formattedData, fields);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=shared-files-${filter || 'all'}-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting shared files:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting shared files',
            error: error.message
        });
    }
});

// Upload new file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }

        const sharedFile = new SharedFile({
            fileName: req.generatedFileName, // Use the generated file name
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimeType: req.file.mimetype,
            owner: req.body.owner || 'admin@eventwishes.com', // Default owner or get from auth
            description: req.body.description || ''
        });

        const savedFile = await sharedFile.save();
        
        res.status(201).json({
            success: true,
            data: savedFile
        });
    } catch (err) {
        console.error('Error uploading file:', err);
        // If file was saved but document creation failed, clean up the file
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error('Error cleaning up file:', unlinkErr);
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Error uploading file',
            error: err.message
        });
    }
});

// Download file
router.get('/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ 
                success: false,
                message: 'File ID is required' 
            });
        }

        const file = await SharedFile.findById(id);
        
        if (!file) {
            return res.status(404).json({ 
                success: false,
                message: 'File not found' 
            });
        }

        // Check if file exists on disk
        if (!fs.existsSync(file.path)) {
            return res.status(404).json({ 
                success: false,
                message: 'File not found on disk' 
            });
        }

        // Set headers for file download
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        
        // Stream the file instead of loading it all into memory
        const fileStream = fs.createReadStream(file.path);
        fileStream.pipe(res);

        // Handle stream errors
        fileStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            if (!res.headersSent) {
                res.status(500).json({ 
                    success: false,
                    message: 'Error streaming file' 
                });
            }
        });
    } catch (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false,
                message: 'Error downloading file',
                error: err.message 
            });
        }
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
            return res.status(404).json({ 
                success: false,
                message: 'File not found' 
            });
        }
        
        res.json({
            success: true,
            data: file
        });
    } catch (err) {
        console.error('Error updating file:', err);
        res.status(500).json({ 
            success: false,
            message: 'Error updating file' 
        });
    }
});

// Delete file
router.delete('/:id', async (req, res) => {
    try {
        const file = await SharedFile.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ 
                success: false,
                message: 'File not found' 
            });
        }

        // Delete the physical file first
        if (file.path) {
            await fs.promises.unlink(file.path);
        }

        // Then delete the database record
        await file.deleteOne();

        res.json({ 
            success: true,
            message: 'File deleted successfully' 
        });
    } catch (err) {
        console.error('Error deleting file:', err);
        res.status(500).json({ 
            success: false,
            message: 'Error deleting file' 
        });
    }
});

module.exports = router;
