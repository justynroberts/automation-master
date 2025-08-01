const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../utils/database');

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    });
};

// Middleware to authenticate both JWT tokens and API keys
const authenticateApiToken = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    // If no API key provided, fall back to JWT authentication
    if (!apiKey) {
        return authenticateToken(req, res, next);
    }

    try {
        const tokenHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        const result = await query(`
            SELECT t.*, u.email, u.is_active, u.first_name, u.last_name
            FROM api_tokens t
            JOIN users u ON t.user_id = u.id
            WHERE t.token_hash = $1 AND u.is_active = true
            AND (t.expires_at IS NULL OR t.expires_at > NOW())
        `, [tokenHash]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        const tokenData = result.rows[0];

        // Update last used timestamp
        await query(`
            UPDATE api_tokens SET last_used_at = NOW() WHERE id = $1
        `, [tokenData.id]);

        // Set user data in request
        req.user = {
            userId: tokenData.user_id,
            email: tokenData.email,
            firstName: tokenData.first_name,
            lastName: tokenData.last_name
        };

        next();
    } catch (err) {
        console.error('API token authentication error:', err);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

// Middleware to require user ownership of resource
const requireOwnership = (resourceIdParam = 'id', resourceTable = 'workflows') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[resourceIdParam];
            const userId = req.user.userId;

            // SECURITY FIX: Validate table name to prevent SQL injection
            const allowedTables = ['workflows', 'generated_nodes', 'executions', 'api_tokens'];
            if (!allowedTables.includes(resourceTable)) {
                console.error('Invalid table name in requireOwnership:', resourceTable);
                return res.status(500).json({ error: 'Invalid resource type' });
            }

            const result = await query(`
                SELECT user_id FROM ${resourceTable} WHERE id = $1
            `, [resourceId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Resource not found' });
            }

            if (result.rows[0].user_id !== userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            next();
        } catch (err) {
            console.error('Ownership check error:', err);
            return res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

module.exports = {
    authenticateToken,
    authenticateApiToken,
    requireOwnership
};