const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Public test route
router.get('/public', (req, res) => {
    res.json({ message: 'Public route - accessible to everyone' });
});

// Protected test route
router.get('/protected', auth, (req, res) => {
    res.json({ 
        message: 'Protected route - only accessible with valid token',
        userId: req.user.userId 
    });
});

module.exports = router;
