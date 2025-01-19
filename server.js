const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const csv = require('csv-parser');
const upload = require('multer')({ dest: 'uploads/' });

// Load environment variables
require('dotenv').config();

// Set mongoose options
mongoose.set('strictQuery', true); // Fix deprecation warning

const app = express();

// Import routes

const fileRoutes = require('./routes/fileRoutes');
const sharedFileRoutes = require('./routes/sharedFileRoutes');
const adMobRoutes = require('./routes/adMobRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const sharedWishesRoutes = require('./routes/sharedWishesRoutes');
const sharedWishesExportRoutes = require('./routes/sharedWishesExportRoutes');
const templateRoutes = require('./routes/templateRoutes');

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false, // Since we're not using cookies/sessions
    optionsSuccessStatus: 204,
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Add logging

// Handle JSON parsing errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload',
            error: err.message
        });
    }
    next();
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ylalit0022:jBRgqv6BBfj2lYaG@cluster0.3d1qt.mongodb.net/eventwishes?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Test the connection by listing collections
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// API Routes - All routes are prefixed with /api
const apiRouter = express.Router();

// Mount routes on the API router
apiRouter.use('/files', fileRoutes);
apiRouter.use('/shared-files', sharedFileRoutes);
apiRouter.use('/admob-ads', adMobRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/shared-wishes', sharedWishesRoutes);
apiRouter.use('/shared-wishes/export', sharedWishesExportRoutes);
apiRouter.use('/templates', templateRoutes);

// Mount the API router at /api
app.use('/api', apiRouter);

// API documentation route
apiRouter.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'EventWishes Admin Panel API',
        endpoints: {
            templates: '/api/templates',
            files: '/api/files',
            admob: '/api/admob-ads',
            dashboard: '/api/dashboard',
            sharedWishes: '/api/shared-wishes',
        },
    });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Connect to MongoDB before starting server
connectDB().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('API Routes:');
        console.log('- /api/templates');
        console.log('- /api/files');
        console.log('- /api/admob-ads');
        console.log('- /api/dashboard');
        console.log('- /api/shared-wishes');
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

// Handle process errors
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err.message);
    // Close server & exit process
    app.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    // Close server & exit process
    app.close(() => process.exit(1));
});
