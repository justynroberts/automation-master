const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateApiToken } = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

// All user routes require authentication
router.use(authenticateApiToken);

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const profile = await authService.getUserProfile(req.user.userId);
        res.json(profile);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(404).json({ error: err.message || 'Profile not found' });
    }
});

// Update user profile
router.put('/profile', [
    body('email').optional().isEmail().normalizeEmail(),
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const updates = req.body;
        const updatedProfile = await authService.updateUserProfile(req.user.userId, updates);

        res.json({
            message: 'Profile updated successfully',
            profile: updatedProfile
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(400).json({ error: err.message || 'Profile update failed' });
    }
});

// Create API token
router.post('/tokens', [
    body('name').trim().isLength({ min: 1 }).withMessage('Token name is required'),
    body('expiresIn').optional().isInt({ min: 1, max: 365 }).withMessage('Expiration must be between 1-365 days')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { name, expiresIn } = req.body;
        const token = await authService.createApiToken(req.user.userId, name, expiresIn);

        res.status(201).json({
            message: 'API token created successfully',
            token
        });
    } catch (err) {
        console.error('Create token error:', err);
        res.status(400).json({ error: err.message || 'Token creation failed' });
    }
});

// List user's API tokens
router.get('/tokens', async (req, res) => {
    try {
        const tokens = await authService.getUserApiTokens(req.user.userId);
        res.json(tokens);
    } catch (err) {
        console.error('List tokens error:', err);
        res.status(500).json({ error: 'Failed to list tokens' });
    }
});

// Delete API token
router.delete('/tokens/:tokenId', async (req, res) => {
    try {
        const { tokenId } = req.params;
        await authService.deleteApiToken(req.user.userId, tokenId);

        res.json({ message: 'Token deleted successfully' });
    } catch (err) {
        console.error('Delete token error:', err);
        res.status(404).json({ error: err.message || 'Token not found' });
    }
});

module.exports = router;