const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            name,
            email,
            password,
            role: 'viewer' // Default role
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                settings: user.settings
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error in registration', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                settings: user.settings
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error in login', error: error.message });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            settings: user.settings
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update basic info
        if (name) user.name = name;
        if (email) user.email = email;

        // Update password if provided
        if (currentPassword && newPassword) {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            user.password = newPassword;
        }

        await user.save();

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            settings: user.settings
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
});

// Update settings
router.put('/settings', auth, async (req, res) => {
    try {
        const { settings } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.settings = { ...user.settings, ...settings };
        await user.save();

        res.json({ settings: user.settings });
    } catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
});

// Logout (optional - client-side token removal)
router.post('/logout', auth, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
