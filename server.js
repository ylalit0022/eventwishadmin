const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load environment variables
require('dotenv').config();

const app = express();

// Import routes
const templateRoutes = require('./routes/templateRoutes');
const fileRoutes = require('./routes/fileRoutes');
const admobRoutes = require('./routes/admobRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const sharedWishesRoutes = require('./routes/sharedWishesRoutes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'client/build')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventwishes', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// API Routes - All routes are prefixed with /api
const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.use('/templates', templateRoutes);
apiRouter.use('/files', fileRoutes);
apiRouter.use('/admob', admobRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/shared-wishes', sharedWishesRoutes);

// Serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something broke!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
