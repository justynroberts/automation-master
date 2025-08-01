const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// Simple auth routes without database for now
app.post('/api/auth/login', (req, res) => {
    res.json({ 
        message: 'Login endpoint ready',
        user: { id: '1', email: 'demo@example.com' },
        accessToken: 'demo-token'
    });
});

app.post('/api/auth/register', (req, res) => {
    res.json({ 
        message: 'Register endpoint ready',
        user: { id: '1', email: req.body.email },
        accessToken: 'demo-token'
    });
});

// Simple workflows endpoint
app.get('/api/workflows', (req, res) => {
    res.json([]);
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Simple server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;