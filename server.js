const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

// Load environment variables
require('dotenv').config();

// Set mongoose options
mongoose.set('strictQuery', true); // Fix deprecation warning

const app = express();

// Import routes

const fileRoutes = require('./routes/fileRoutes');
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
//app.use(express.static(path.join(__dirname, 'client/build')));

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventwishes', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

connectDB();

// API Routes - All routes are prefixed with /api
const apiRouter = express.Router();

// API routes
apiRouter.use('/files', fileRoutes);
apiRouter.use('/admob-ads', adMobRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/shared-wishes', sharedWishesRoutes);
apiRouter.use('/shared-wishes/export', sharedWishesExportRoutes);
apiRouter.use('/templates', templateRoutes);

// Mount API router
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

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {},
    });
});

// Catch-all route for React app
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
// });

// Start server with better error handling
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port or kill the process using this port.`);
        process.exit(1);
    } else {
        console.error('Server error:', err.message);
        process.exit(1);
    }
});

// Handle process errors
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err.message);
    // Close server & exit process
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    // Close server & exit process
    server.close(() => process.exit(1));
});
