const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Redis client for rate limiting
let redisClient;
let redisStore;

try {
    redisClient = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false
    });

    redisStore = new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    });

    redisClient.on('error', (err) => {
        console.warn('Redis rate limiter error:', err.message);
        redisStore = undefined; // Fall back to memory store
    });
} catch (error) {
    console.warn('Redis not available for rate limiting, using memory store');
    redisStore = undefined;
}

// General API rate limiter
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000, // limit each IP to 10000 requests per windowMs
    store: redisStore,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/health/detailed';
    }
});

// Strict limiter for node generation (more resource intensive)
const nodeGenerationLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // limit each IP to 100 node generations per 5 minutes
    store: redisStore,
    message: {
        error: 'Too many node generation requests. Please wait before generating more nodes.',
        retryAfter: '5 minutes',
        limit: 10,
        window: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise fall back to IP
        return req.user?.userId || req.ip;
    }
});

// Authentication rate limiter (stricter for login attempts)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 login attempts per windowMs
    store: redisStore,
    message: {
        error: 'Too many authentication attempts from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Workflow execution rate limiter
const workflowExecutionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // limit each user to 200 workflow executions per minute
    store: redisStore,
    message: {
        error: 'Too many workflow executions. Please wait before running more workflows.',
        retryAfter: '1 minute',
        limit: 20,
        window: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.userId || req.ip;
    }
});

// API key creation limiter
const apiKeyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // limit each user to 50 API key creations per hour
    store: redisStore,
    message: {
        error: 'Too many API key creation requests. Please wait before creating more keys.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.userId || req.ip;
    }
});

// Per-user rate limiter for expensive operations
const createPerUserLimiter = (maxRequests, windowMs, operation) => {
    return rateLimit({
        windowMs,
        max: maxRequests,
        store: redisStore,
        message: {
            error: `Too many ${operation} requests. Please wait before trying again.`,
            retryAfter: Math.ceil(windowMs / 60000) + ' minutes',
            limit: maxRequests,
            window: Math.ceil(windowMs / 60000) + ' minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            return `${operation}:${req.user?.userId || req.ip}`;
        }
    });
};

module.exports = {
    generalLimiter,
    nodeGenerationLimiter,
    authLimiter,
    workflowExecutionLimiter,
    apiKeyLimiter,
    createPerUserLimiter
};