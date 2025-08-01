const promClient = require('prom-client');
const { performanceLogger, errorLogger } = require('../utils/logger');

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
    app: 'llm-node-generator',
    environment: process.env.NODE_ENV || 'development'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code', 'user_id'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'user_id']
});

const nodeGenerationTotal = new promClient.Counter({
    name: 'node_generation_total',
    help: 'Total number of nodes generated',
    labelNames: ['provider', 'status', 'user_id']
});

const nodeGenerationDuration = new promClient.Histogram({
    name: 'node_generation_duration_seconds',
    help: 'Duration of node generation requests',
    labelNames: ['provider', 'status'],
    buckets: [1, 3, 5, 10, 15, 30, 60, 120]
});

const workflowExecutionTotal = new promClient.Counter({
    name: 'workflow_execution_total',
    help: 'Total number of workflow executions',
    labelNames: ['status', 'user_id']
});

const workflowExecutionDuration = new promClient.Histogram({
    name: 'workflow_execution_duration_seconds',
    help: 'Duration of workflow executions',
    labelNames: ['status', 'nodes_count'],
    buckets: [1, 5, 10, 30, 60, 120, 300, 600]
});

const sandboxExecutionTotal = new promClient.Counter({
    name: 'sandbox_execution_total',
    help: 'Total number of sandbox executions',
    labelNames: ['type', 'status']
});

const sandboxExecutionDuration = new promClient.Histogram({
    name: 'sandbox_execution_duration_seconds',
    help: 'Duration of sandbox executions',
    labelNames: ['type', 'status'],
    buckets: [0.5, 1, 2, 5, 10, 30, 60]
});

const databaseQueryDuration = new promClient.Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries',
    labelNames: ['operation', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

const activeUsers = new promClient.Gauge({
    name: 'active_users_total',
    help: 'Number of active users in the last 24 hours'
});

const errorTotal = new promClient.Counter({
    name: 'errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'endpoint', 'status_code']
});

const llmApiCalls = new promClient.Counter({
    name: 'llm_api_calls_total',
    help: 'Total number of LLM API calls',
    labelNames: ['provider', 'model', 'status']
});

const llmApiDuration = new promClient.Histogram({
    name: 'llm_api_duration_seconds',
    help: 'Duration of LLM API calls',
    labelNames: ['provider', 'model'],
    buckets: [1, 3, 5, 10, 15, 30, 60, 120]
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(nodeGenerationTotal);
register.registerMetric(nodeGenerationDuration);
register.registerMetric(workflowExecutionTotal);
register.registerMetric(workflowExecutionDuration);
register.registerMetric(sandboxExecutionTotal);
register.registerMetric(sandboxExecutionDuration);
register.registerMetric(databaseQueryDuration);
register.registerMetric(activeUsers);
register.registerMetric(errorTotal);
register.registerMetric(llmApiCalls);
register.registerMetric(llmApiDuration);

// Middleware to track HTTP requests
const trackHttpRequests = (req, res, next) => {
    const start = Date.now();
    
    // Track the original end method
    const originalEnd = res.end;
    
    res.end = function(...args) {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? req.route.path : req.path;
        const userId = req.user?.userId || 'anonymous';
        
        // Record metrics
        httpRequestDuration
            .labels(req.method, route, res.statusCode, userId)
            .observe(duration);
            
        httpRequestsTotal
            .labels(req.method, route, res.statusCode, userId)
            .inc();
        
        // Log performance
        performanceLogger.apiResponse(
            req.method,
            route,
            res.statusCode,
            Math.round(duration * 1000),
            userId
        );
        
        // Track errors
        if (res.statusCode >= 400) {
            errorTotal
                .labels('http_error', route, res.statusCode)
                .inc();
                
            if (res.statusCode >= 500) {
                errorLogger.appError(new Error(`HTTP ${res.statusCode} error`), {
                    method: req.method,
                    path: route,
                    statusCode: res.statusCode,
                    userId,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
            }
        }
        
        // Call the original end method
        originalEnd.apply(this, args);
    };
    
    next();
};

// Metrics collection functions
const metrics = {
    // Track node generation
    trackNodeGeneration: (provider, status, userId, duration) => {
        nodeGenerationTotal
            .labels(provider, status, userId)
            .inc();
            
        if (duration) {
            nodeGenerationDuration
                .labels(provider, status)
                .observe(duration);
        }
    },
    
    // Track workflow execution
    trackWorkflowExecution: (status, userId, duration, nodesCount = 0) => {
        workflowExecutionTotal
            .labels(status, userId)
            .inc();
            
        if (duration) {
            workflowExecutionDuration
                .labels(status, nodesCount.toString())
                .observe(duration);
        }
    },
    
    // Track sandbox execution
    trackSandboxExecution: (type, status, duration) => {
        sandboxExecutionTotal
            .labels(type, status)
            .inc();
            
        if (duration) {
            sandboxExecutionDuration
                .labels(type, status)
                .observe(duration);
        }
    },
    
    // Track database queries
    trackDatabaseQuery: (operation, table, duration) => {
        if (duration) {
            databaseQueryDuration
                .labels(operation, table)
                .observe(duration);
        }
    },
    
    // Track LLM API calls
    trackLlmApiCall: (provider, model, status, duration) => {
        llmApiCalls
            .labels(provider, model, status)
            .inc();
            
        if (duration) {
            llmApiDuration
                .labels(provider, model)
                .observe(duration);
        }
    },
    
    // Update active users count
    updateActiveUsers: (count) => {
        activeUsers.set(count);
    },
    
    // Track errors
    trackError: (type, endpoint, statusCode) => {
        errorTotal
            .labels(type, endpoint, statusCode)
            .inc();
    }
};

// Health check endpoint handler
const healthCheck = async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    };
    
    // Check database connection
    try {
        const { query } = require('../utils/database');
        await query('SELECT 1');
        health.database = 'connected';
    } catch (error) {
        health.database = 'disconnected';
        health.status = 'degraded';
    }
    
    // Check Redis connection (if available)
    try {
        const redis = require('redis');
        const client = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
        });
        await client.ping();
        health.redis = 'connected';
        client.quit();
    } catch (error) {
        health.redis = 'disconnected';
    }
    
    res.status(health.status === 'ok' ? 200 : 503).json(health);
};

// Metrics endpoint handler
const metricsEndpoint = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
};

module.exports = {
    trackHttpRequests,
    metrics,
    healthCheck,
    metricsEndpoint,
    register
};