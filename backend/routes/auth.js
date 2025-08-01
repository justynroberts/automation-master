const express = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');

const router = express.Router();

// Validation middleware
const validateRegistration = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required')
];

const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { email, password, firstName, lastName } = req.body;
        const result = await authService.register(email, password, firstName, lastName);

        res.status(201).json({
            message: 'User registered successfully',
            ...result
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(400).json({ 
            error: err.message || 'Registration failed' 
        });
    }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { email, password } = req.body;
        const result = await authService.login(email, password);

        res.json({
            message: 'Login successful',
            ...result
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(401).json({ 
            error: err.message || 'Login failed' 
        });
    }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const result = await authService.refreshAccessToken(refreshToken);

        res.json({
            message: 'Token refreshed successfully',
            ...result
        });
    } catch (err) {
        console.error('Token refresh error:', err);
        res.status(401).json({ 
            error: err.message || 'Token refresh failed' 
        });
    }
});

// Logout (client-side token removal, server doesn't maintain session state)
router.post('/logout', (req, res) => {
    res.json({ 
        message: 'Logout successful. Please remove tokens from client storage.' 
    });
});


module.exports = router;