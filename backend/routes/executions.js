const express = require('express');
const WebSocket = require('ws');
const { authenticateApiToken, requireOwnership } = require('../middleware/auth');
const { query } = require('../utils/database');
const { getWorkflowEngine } = require('../services/workflowEngineManager');

const router = express.Router();

// All execution routes require authentication
router.use(authenticateApiToken);

// Get all executions for the authenticated user
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, status, workflow_id, timeframe, start_date, end_date } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE w.user_id = $1';
        let params = [req.user.userId];
        let paramCount = 2;

        if (status) {
            whereClause += ` AND e.status = $${paramCount++}`;
            params.push(status);
        }

        if (workflow_id) {
            whereClause += ` AND e.workflow_id = $${paramCount++}`;
            params.push(workflow_id);
        }

        // Add time filtering
        if (timeframe) {
            switch (timeframe) {
                case '24h':
                    whereClause += ` AND e.started_at >= NOW() - INTERVAL '24 hours'`;
                    break;
                case '7d':
                    whereClause += ` AND e.started_at >= NOW() - INTERVAL '7 days'`;
                    break;
                case '30d':
                    whereClause += ` AND e.started_at >= NOW() - INTERVAL '30 days'`;
                    break;
                case '90d':
                    whereClause += ` AND e.started_at >= NOW() - INTERVAL '90 days'`;
                    break;
                case 'custom':
                    if (start_date) {
                        whereClause += ` AND e.started_at >= $${paramCount++}`;
                        params.push(start_date);
                    }
                    if (end_date) {
                        whereClause += ` AND e.started_at <= $${paramCount++}`;
                        params.push(end_date);
                    }
                    break;
            }
        }

        const result = await query(`
            SELECT 
                e.*,
                w.name as workflow_name,
                w.description as workflow_description,
                w.time_saved_minutes,
                w.cost_per_hour
            FROM executions e
            JOIN workflows w ON e.workflow_id = w.id
            ${whereClause}
            ORDER BY e.started_at DESC
            LIMIT $${paramCount++} OFFSET $${paramCount++}
        `, [...params, limit, offset]);

        // Get total count for pagination
        const countResult = await query(`
            SELECT COUNT(*)
            FROM executions e
            JOIN workflows w ON e.workflow_id = w.id
            ${whereClause}
        `, params.slice(0, paramCount - 2));

        const totalCount = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalCount / limit);

        // Calculate savings for completed executions
        const completedExecutions = result.rows.filter(e => e.status === 'completed');
        const totalTimeSavedMinutes = completedExecutions.reduce((sum, e) => sum + (e.time_saved_minutes || 0), 0);
        const totalCostSaved = completedExecutions.reduce((sum, e) => {
            const timeSavedHours = (e.time_saved_minutes || 0) / 60;
            return sum + (timeSavedHours * (parseFloat(e.cost_per_hour) || 0));
        }, 0);

        // Get overall savings stats for the filtered timeframe
        const savingsResult = await query(`
            SELECT 
                COUNT(*) FILTER (WHERE e.status = 'completed') as completed_count,
                SUM(w.time_saved_minutes) FILTER (WHERE e.status = 'completed') as total_time_saved_minutes,
                SUM((w.time_saved_minutes::float / 60) * w.cost_per_hour) FILTER (WHERE e.status = 'completed') as total_cost_saved
            FROM executions e
            JOIN workflows w ON e.workflow_id = w.id
            ${whereClause}
        `, params.slice(0, paramCount - 2));

        const savings = savingsResult.rows[0];

        res.json({
            executions: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },
            savings: {
                total_executions_completed: parseInt(savings.completed_count) || 0,
                total_time_saved_minutes: parseInt(savings.total_time_saved_minutes) || 0,
                total_time_saved_hours: Math.round(((parseInt(savings.total_time_saved_minutes) || 0) / 60) * 100) / 100,
                total_cost_saved: Math.round((parseFloat(savings.total_cost_saved) || 0) * 100) / 100
            }
        });
    } catch (err) {
        console.error('Get executions error:', err);
        res.status(500).json({ error: 'Failed to fetch executions' });
    }
});

// Get execution details
router.get('/:id', async (req, res) => {
    try {
        const result = await query(`
            SELECT e.*, w.name as workflow_name, w.user_id
            FROM executions e
            JOIN workflows w ON e.workflow_id = w.id
            WHERE e.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Execution not found' });
        }

        const execution = result.rows[0];

        // Check if user owns the workflow
        if (execution.user_id !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(execution);
    } catch (err) {
        console.error('Get execution error:', err);
        res.status(500).json({ error: 'Failed to fetch execution' });
    }
});

// Get execution logs
router.get('/:id/logs', async (req, res) => {
    try {
        // First verify user owns this execution
        const executionResult = await query(`
            SELECT e.id, w.user_id
            FROM executions e
            JOIN workflows w ON e.workflow_id = w.id
            WHERE e.id = $1
        `, [req.params.id]);

        if (executionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Execution not found' });
        }

        if (executionResult.rows[0].user_id !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get logs
        const logsResult = await query(`
            SELECT * FROM execution_logs
            WHERE execution_id = $1
            ORDER BY timestamp ASC
        `, [req.params.id]);

        res.json(logsResult.rows);
    } catch (err) {
        console.error('Get execution logs error:', err);
        res.status(500).json({ error: 'Failed to fetch execution logs' });
    }
});

// Get node-specific logs
router.get('/:id/nodes/:nodeId/logs', async (req, res) => {
    try {
        // First verify user owns this execution
        const executionResult = await query(`
            SELECT e.id, w.user_id
            FROM executions e
            JOIN workflows w ON e.workflow_id = w.id
            WHERE e.id = $1
        `, [req.params.id]);

        if (executionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Execution not found' });
        }

        if (executionResult.rows[0].user_id !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get node logs
        const nodeLogsResult = await query(`
            SELECT * FROM node_logs
            WHERE execution_id = $1 AND node_id = $2
            ORDER BY executed_at DESC
        `, [req.params.id, req.params.nodeId]);

        const executionLogsResult = await query(`
            SELECT * FROM execution_logs
            WHERE execution_id = $1 AND node_id = $2
            ORDER BY timestamp ASC
        `, [req.params.id, req.params.nodeId]);

        res.json({
            nodeLogs: nodeLogsResult.rows,
            executionLogs: executionLogsResult.rows
        });
    } catch (err) {
        console.error('Get node logs error:', err);
        res.status(500).json({ error: 'Failed to fetch node logs' });
    }
});

// Route moved to workflows.js

// Cancel running execution
router.post('/:id/cancel', async (req, res) => {
    try {
        // First verify user owns this execution
        const executionResult = await query(`
            SELECT e.id, e.status, w.user_id
            FROM executions e
            JOIN workflows w ON e.workflow_id = w.id
            WHERE e.id = $1
        `, [req.params.id]);

        if (executionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Execution not found' });
        }

        const execution = executionResult.rows[0];

        if (execution.user_id !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!['pending', 'running'].includes(execution.status)) {
            return res.status(400).json({ error: 'Execution cannot be cancelled' });
        }

        // Update execution status
        await query(`
            UPDATE executions 
            SET status = 'cancelled', completed_at = NOW()
            WHERE id = $1
        `, [req.params.id]);

        // TODO: Cancel the actual execution job here

        res.json({ message: 'Execution cancelled successfully' });
    } catch (err) {
        console.error('Cancel execution error:', err);
        res.status(500).json({ error: 'Failed to cancel execution' });
    }
});

// Get execution engine stats (for monitoring)
router.get('/stats', async (req, res) => {
    try {
        const workflowEngine = getWorkflowEngine();
        const stats = workflowEngine.getExecutionStats();
        res.json(stats);
    } catch (err) {
        console.error('Get execution stats error:', err);
        res.status(500).json({ error: 'Failed to fetch execution stats' });
    }
});

module.exports = router;