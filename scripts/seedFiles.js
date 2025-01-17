require('dotenv').config();
const mongoose = require('mongoose');
const File = require('../models/File');
const fs = require('fs');
const path = require('path');

// Set Mongoose options
mongoose.set('strictQuery', true);

// MongoDB connection with proper error handling
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    seedFiles();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

const demoFiles = [
    {
        originalname: 'sample-image.jpg',
        filename: 'sample-image-1234567890.jpg',
        path: 'uploads/sample-image-1234567890.jpg',
        size: 1024 * 100, // 100KB
        mimetype: 'image/jpeg'
    },
    {
        originalname: 'document.pdf',
        filename: 'document-1234567890.pdf',
        path: 'uploads/document-1234567890.pdf',
        size: 1024 * 500, // 500KB
        mimetype: 'application/pdf'
    },
    {
        originalname: 'presentation.pptx',
        filename: 'presentation-1234567890.pptx',
        path: 'uploads/presentation-1234567890.pptx',
        size: 1024 * 1024, // 1MB
        mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    },
    {
        originalname: 'spreadsheet.xlsx',
        filename: 'spreadsheet-1234567890.xlsx',
        path: 'uploads/spreadsheet-1234567890.xlsx',
        size: 1024 * 300, // 300KB
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    {
        originalname: 'code.js',
        filename: 'code-1234567890.js',
        path: 'uploads/code-1234567890.js',
        size: 1024 * 5, // 5KB
        mimetype: 'application/javascript'
    }
];

async function seedFiles() {
    try {
        // Clear existing files
        await File.deleteMany({});
        console.log('Cleared existing files');

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Create dummy files in uploads directory and insert records
        for (const fileData of demoFiles) {
            try {
                // Create physical file
                const filePath = path.join(__dirname, '..', fileData.path);
                const dirPath = path.dirname(filePath);
                
                // Create directory if it doesn't exist
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
                
                fs.writeFileSync(filePath, `This is a demo file: ${fileData.originalname}`);
                console.log(`Created file: ${filePath}`);

                // Create database record
                const file = new File(fileData);
                await file.save();
                console.log(`Inserted file record: ${fileData.originalname}`);
            } catch (error) {
                console.error(`Error processing file ${fileData.originalname}:`, error);
            }
        }

        console.log('Demo files seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding files:', error);
        process.exit(1);
    }
}
