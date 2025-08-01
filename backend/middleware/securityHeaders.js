const helmet = require('helmet');

// Security headers middleware
const securityHeaders = helmet({
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for React
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    
    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: {
        policy: "require-corp"
    },
    
    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: {
        policy: "same-origin"
    },
    
    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: {
        policy: "cross-origin"
    },
    
    // DNS Prefetch Control
    dnsPrefetchControl: {
        allow: false
    },
    
    // Frameguard
    frameguard: {
        action: 'deny'
    },
    
    // Hide Powered-By header
    hidePoweredBy: true,
    
    // HTTP Strict Transport Security
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    
    // IE No Open
    ieNoOpen: true,
    
    // No Sniff
    noSniff: true,
    
    // Origin Agent Cluster
    originAgentCluster: true,
    
    // Permitted Cross-Domain Policies
    permittedCrossDomainPolicies: {
        permittedPolicies: "none"
    },
    
    // Referrer Policy
    referrerPolicy: {
        policy: ["no-referrer", "strict-origin-when-cross-origin"]
    },
    
    // X-XSS-Protection
    xssFilter: true
});

// Additional custom security headers
const additionalHeaders = (req, res, next) => {
    // Prevent caching of sensitive endpoints
    if (req.path.includes('/api/auth') || req.path.includes('/api/generated-nodes')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.set('Surrogate-Control', 'no-store');
    }
    
    // Add custom security headers
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-Download-Options', 'noopen');
    res.set('X-Permitted-Cross-Domain-Policies', 'none');
    
    // Remove potentially revealing headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
};

// CORS configuration for production
const corsOptions = {
    origin: function (origin, callback) {
        // In production, specify allowed origins
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:5002',
            'http://localhost:5002',
            'http://127.0.0.1:5002'
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests) in development
        if (!origin && process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    maxAge: 86400 // Cache preflight for 24 hours
};

module.exports = {
    securityHeaders,
    additionalHeaders,
    corsOptions
};