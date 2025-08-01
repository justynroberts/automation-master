const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeTables } = require('./utils/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const workflowRoutes = require('./routes/workflows');
const executionRoutes = require('./routes/executions');
const aiRoutes = require('./routes/ai');
const generatedNodesRoutes = require('./routes/generatedNodes');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting (relaxed for development)
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000, // 10000 requests per minute for dev
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:5001', 'http://localhost:5000', 'http://localhost:5002', 'http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/generated-nodes', generatedNodesRoutes);
app.use('/api/config', require('./routes/config'));
app.use('/api/ai-assistant', require('./routes/aiAssistant'));
app.use('/api/prompts', require('./routes/prompts'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Global error handlers for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Don't exit in development, just log
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in development, just log
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Try to initialize database tables, but don't fail if DB is not available
        try {
            await initializeTables();
            console.log('✅ Database initialized successfully');
        } catch (dbError) {
            console.warn('⚠️ Database not available, starting server without DB:', dbError.message);
        }
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;