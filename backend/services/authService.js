const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../utils/database');

class AuthService {
    // Register new user
    async register(email, password, firstName, lastName) {
        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            throw new Error('User already exists with this email');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const result = await query(`
            INSERT INTO users (email, password_hash, first_name, last_name)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, first_name, last_name, created_at
        `, [email, passwordHash, firstName, lastName]);

        const user = result.rows[0];
        return this.generateTokens(user);
    }

    // Login user
    async login(email, password) {
        const result = await query(`
            SELECT id, email, password_hash, first_name, last_name, is_active
            FROM users WHERE email = $1
        `, [email]);

        if (result.rows.length === 0) {
            throw new Error('Invalid credentials');
        }

        const user = result.rows[0];

        if (!user.is_active) {
            throw new Error('Account is deactivated');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        return this.generateTokens(user);
    }

    // Generate JWT tokens
    generateTokens(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        });

        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name
            },
            accessToken,
            refreshToken
        };
    }

    // Refresh access token
    async refreshAccessToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            // Verify user still exists and is active
            const result = await query(`
                SELECT id, email, first_name, last_name, is_active
                FROM users WHERE id = $1 AND is_active = true
            `, [decoded.userId]);

            if (result.rows.length === 0) {
                throw new Error('User not found or inactive');
            }

            const user = result.rows[0];
            return this.generateTokens(user);
        } catch (err) {
            throw new Error('Invalid refresh token');
        }
    }

    // Create API token
    async createApiToken(userId, name, expiresIn = null) {
        // Generate random token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Calculate expiration date
        let expiresAt = null;
        if (expiresIn) {
            expiresAt = new Date();
            expiresAt.setTime(expiresAt.getTime() + (expiresIn * 24 * 60 * 60 * 1000)); // days to milliseconds
        }

        // Save token to database
        const result = await query(`
            INSERT INTO api_tokens (user_id, token_hash, name, expires_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, created_at, expires_at
        `, [userId, tokenHash, name, expiresAt]);

        return {
            ...result.rows[0],
            token // Only return the actual token once
        };
    }

    // List user's API tokens
    async getUserApiTokens(userId) {
        const result = await query(`
            SELECT id, name, created_at, last_used_at, expires_at
            FROM api_tokens
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [userId]);

        return result.rows;
    }

    // Delete API token
    async deleteApiToken(userId, tokenId) {
        const result = await query(`
            DELETE FROM api_tokens
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `, [tokenId, userId]);

        if (result.rows.length === 0) {
            throw new Error('Token not found');
        }

        return true;
    }

    // Get user profile
    async getUserProfile(userId) {
        const result = await query(`
            SELECT id, email, first_name, last_name, created_at
            FROM users WHERE id = $1 AND is_active = true
        `, [userId]);

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        return result.rows[0];
    }

    // Update user profile
    async updateUserProfile(userId, updates) {
        const { firstName, lastName, email } = updates;
        
        // Check if email is already taken by another user
        if (email) {
            const existingUser = await query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, userId]
            );

            if (existingUser.rows.length > 0) {
                throw new Error('Email already in use');
            }
        }

        const result = await query(`
            UPDATE users 
            SET first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                email = COALESCE($3, email),
                updated_at = NOW()
            WHERE id = $4 AND is_active = true
            RETURNING id, email, first_name, last_name, updated_at
        `, [firstName, lastName, email, userId]);

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        return result.rows[0];
    }
}

module.exports = new AuthService();