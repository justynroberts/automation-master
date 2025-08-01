const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'workflow_automation',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
    console.log('📊 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
    process.exit(-1);
});

// Query helper function
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('🔍 Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (err) {
        console.error('❌ Query error:', err);
        throw err;
    }
};

// Transaction helper
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Initialize database tables
const initializeTables = async () => {
    const createTablesQuery = `
        -- Create extension for UUID generation
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- API tokens for programmatic access
        CREATE TABLE IF NOT EXISTS api_tokens (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            last_used_at TIMESTAMP,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- Workflows table
        CREATE TABLE IF NOT EXISTS workflows (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            definition JSONB NOT NULL,
            time_saved_minutes INTEGER DEFAULT 0,
            cost_per_hour DECIMAL(10,2) DEFAULT 0.00,
            tags TEXT[] DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE
        );

        -- Executions table
        CREATE TABLE IF NOT EXISTS executions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            started_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP,
            input_data JSONB,
            output_data JSONB,
            error_message TEXT
        );

        -- Node execution logs
        CREATE TABLE IF NOT EXISTS node_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
            node_id VARCHAR(255) NOT NULL,
            node_type VARCHAR(100) NOT NULL,
            status VARCHAR(50) NOT NULL,
            input_data JSONB,
            output_data JSONB,
            stdout_logs TEXT,
            stderr_logs TEXT,
            exit_code INTEGER,
            error_message TEXT,
            execution_time_ms INTEGER,
            memory_usage_mb INTEGER,
            executed_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP
        );

        -- Live log streaming
        CREATE TABLE IF NOT EXISTS execution_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
            node_id VARCHAR(255) NOT NULL,
            log_level VARCHAR(20) NOT NULL,
            message TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT NOW(),
            source VARCHAR(50)
        );

        -- Generated nodes table for LLM-created custom nodes
        CREATE TABLE IF NOT EXISTS generated_nodes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100) DEFAULT 'Custom',
            icon VARCHAR(50) DEFAULT 'box',
            node_definition JSONB NOT NULL,
            ui_config JSONB NOT NULL,
            config JSONB DEFAULT '{"fields": [], "description": "No configuration required"}',
            execution_code TEXT NOT NULL,
            input_schema JSONB NOT NULL,
            output_schema JSONB NOT NULL,
            version INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT true,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Generated node versions for tracking updates
        CREATE TABLE IF NOT EXISTS generated_node_versions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            node_id UUID REFERENCES generated_nodes(id) ON DELETE CASCADE,
            version_number INTEGER NOT NULL,
            node_definition JSONB NOT NULL,
            ui_config JSONB NOT NULL,
            config JSONB DEFAULT '{"fields": [], "description": "No configuration required"}',
            execution_code TEXT NOT NULL,
            input_schema JSONB NOT NULL,
            output_schema JSONB NOT NULL,
            change_description TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE CASCADE
        );

        -- Add savings columns to existing workflows table if not exists
        ALTER TABLE workflows 
        ADD COLUMN IF NOT EXISTS time_saved_minutes INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS cost_per_hour DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

        -- Add config column to existing generated_nodes table if not exists
        ALTER TABLE generated_nodes 
        ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{"fields": [], "description": "No configuration required"}';

        -- Add config column to existing generated_node_versions table if not exists  
        ALTER TABLE generated_node_versions 
        ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{"fields": [], "description": "No configuration required"}';

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
        CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON executions(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_execution_logs_execution_id ON execution_logs(execution_id);
        CREATE INDEX IF NOT EXISTS idx_node_logs_execution_id ON node_logs(execution_id);
        CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_generated_nodes_user_id ON generated_nodes(user_id);
        CREATE INDEX IF NOT EXISTS idx_generated_nodes_category ON generated_nodes(category);
        CREATE INDEX IF NOT EXISTS idx_generated_node_versions_node_id ON generated_node_versions(node_id);
    `;

    try {
        await query(createTablesQuery);
        console.log('✅ Database tables initialized successfully');
    } catch (err) {
        console.error('❌ Failed to initialize database tables:', err);
        throw err;
    }
};

module.exports = {
    pool,
    query,
    transaction,
    initializeTables
};