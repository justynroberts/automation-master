const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};

// Add colors to winston
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Define format for file logs (without colors)
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Define transports
const transports = [
    // Console transport
    new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format
    }),
    
    // File transport for errors
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/combined.log'),
        format: fileFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 10
    })
];

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    transports,
    exitOnError: false
});

// Security logging functions
const securityLogger = {
    // Log authentication events
    authEvent: (event, userId, ip, userAgent, details = {}) => {
        logger.info('AUTH_EVENT', {
            event,
            userId,
            ip,
            userAgent: userAgent?.substring(0, 200), // Truncate user agent
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // Log authorization failures
    authFailure: (reason, userId, ip, resource, details = {}) => {
        logger.warn('AUTH_FAILURE', {
            reason,
            userId,
            ip,
            resource,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // Log suspicious activities
    suspicious: (activity, userId, ip, details = {}) => {
        logger.warn('SUSPICIOUS_ACTIVITY', {
            activity,
            userId,
            ip,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // Log security violations
    violation: (violation, userId, ip, details = {}) => {
        logger.error('SECURITY_VIOLATION', {
            violation,
            userId,
            ip,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // Log node generation events
    nodeGeneration: (event, userId, nodeId, details = {}) => {
        logger.info('NODE_GENERATION', {
            event,
            userId,
            nodeId,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // Log workflow execution events
    workflowExecution: (event, userId, workflowId, executionId, details = {}) => {
        logger.info('WORKFLOW_EXECUTION', {
            event,
            userId,
            workflowId,
            executionId,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
};

// Performance logging
const performanceLogger = {
    // Log API response times
    apiResponse: (method, path, statusCode, responseTime, userId) => {
        logger.http('API_RESPONSE', {
            method,
            path,
            statusCode,
            responseTime: `${responseTime}ms`,
            userId,
            timestamp: new Date().toISOString()
        });
    },
    
    // Log database query performance
    dbQuery: (operation, table, duration, rowCount) => {
        logger.debug('DB_QUERY', {
            operation,
            table,
            duration: `${duration}ms`,
            rowCount,
            timestamp: new Date().toISOString()
        });
    },
    
    // Log LLM API calls
    llmCall: (provider, model, tokens, duration, userId) => {
        logger.info('LLM_CALL', {
            provider,
            model,
            tokens,
            duration: `${duration}ms`,
            userId,
            timestamp: new Date().toISOString()
        });
    }
};

// Error logging with context
const errorLogger = {
    // Log application errors with context
    appError: (error, context = {}) => {
        logger.error('APPLICATION_ERROR', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            context,
            timestamp: new Date().toISOString()
        });
    },
    
    // Log validation errors
    validationError: (field, value, rule, userId) => {
        logger.warn('VALIDATION_ERROR', {
            field,
            value: typeof value === 'string' ? value.substring(0, 100) : value,
            rule,
            userId,
            timestamp: new Date().toISOString()
        });
    },
    
    // Log rate limit violations
    rateLimitViolation: (ip, endpoint, limit, userId) => {
        logger.warn('RATE_LIMIT_VIOLATION', {
            ip,
            endpoint,
            limit,
            userId,
            timestamp: new Date().toISOString()
        });
    }
};

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = {
    logger,
    securityLogger,
    performanceLogger,
    errorLogger
};