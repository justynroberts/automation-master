const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateApiToken, requireOwnership } = require('../middleware/auth');
const { query } = require('../utils/database');
const { getWorkflowEngine } = require('../services/workflowEngineManager');

const router = express.Router();

// All workflow routes require authentication
router.use(authenticateApiToken);

// Get all workflows for the authenticated user
router.get('/', async (req, res) => {
    try {
        const result = await query(`
            SELECT id, name, description, time_saved_minutes, cost_per_hour, tags, created_at, updated_at
            FROM workflows 
            WHERE user_id = $1 
            ORDER BY updated_at DESC
        `, [req.user.userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Get workflows error:', err);
        res.status(500).json({ error: 'Failed to fetch workflows' });
    }
});

// Get specific workflow by ID
router.get('/:id', requireOwnership('id', 'workflows'), async (req, res) => {
    try {
        const result = await query(`
            SELECT * FROM workflows WHERE id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get workflow error:', err);
        res.status(500).json({ error: 'Failed to fetch workflow' });
    }
});

// Create new workflow
router.post('/', [
    body('name').trim().isLength({ min: 1 }).withMessage('Workflow name is required'),
    body('description').optional().trim(),
    body('definition').isObject().withMessage('Workflow definition must be an object'),
    body('time_saved_minutes').optional().isInt({ min: 0 }).withMessage('Time saved must be a non-negative integer'),
    body('cost_per_hour').optional().isFloat({ min: 0 }).withMessage('Cost per hour must be a non-negative number'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { name, description, definition, time_saved_minutes, cost_per_hour, tags } = req.body;
        
        const result = await query(`
            INSERT INTO workflows (name, description, definition, time_saved_minutes, cost_per_hour, tags, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [name, description, JSON.stringify(definition), time_saved_minutes || 0, cost_per_hour || 0.00, tags || [], req.user.userId]);

        res.status(201).json({
            message: 'Workflow created successfully',
            workflow: result.rows[0]
        });
    } catch (err) {
        console.error('Create workflow error:', err);
        res.status(400).json({ error: 'Failed to create workflow' });
    }
});

// Update workflow
router.put('/:id', requireOwnership('id', 'workflows'), [
    body('name').optional().trim().isLength({ min: 1 }),
    body('description').optional().trim(),
    body('definition').optional().isObject(),
    body('time_saved_minutes').optional().isInt({ min: 0 }).withMessage('Time saved must be a non-negative integer'),
    body('cost_per_hour').optional().isFloat({ min: 0 }).withMessage('Cost per hour must be a non-negative number'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { name, description, definition, time_saved_minutes, cost_per_hour, tags } = req.body;
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updateFields.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (description !== undefined) {
            updateFields.push(`description = $${paramCount++}`);
            values.push(description);
        }
        if (definition !== undefined) {
            updateFields.push(`definition = $${paramCount++}`);
            values.push(JSON.stringify(definition));
        }
        if (time_saved_minutes !== undefined) {
            updateFields.push(`time_saved_minutes = $${paramCount++}`);
            values.push(time_saved_minutes);
        }
        if (cost_per_hour !== undefined) {
            updateFields.push(`cost_per_hour = $${paramCount++}`);
            values.push(cost_per_hour);
        }
        if (tags !== undefined) {
            updateFields.push(`tags = $${paramCount++}`);
            values.push(tags);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateFields.push(`updated_at = NOW()`);
        values.push(req.params.id);

        const result = await query(`
            UPDATE workflows 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `, values);

        res.json({
            message: 'Workflow updated successfully',
            workflow: result.rows[0]
        });
    } catch (err) {
        console.error('Update workflow error:', err);
        res.status(400).json({ error: 'Failed to update workflow' });
    }
});

// Delete workflow
router.delete('/:id', requireOwnership('id', 'workflows'), async (req, res) => {
    try {
        const result = await query(`
            DELETE FROM workflows WHERE id = $1
            RETURNING id
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        res.json({ message: 'Workflow deleted successfully' });
    } catch (err) {
        console.error('Delete workflow error:', err);
        res.status(500).json({ error: 'Failed to delete workflow' });
    }
});

// Execute workflow
router.post('/:id/execute', requireOwnership('id', 'workflows'), async (req, res) => {
    try {
        const { inputData } = req.body;

        // Get workflow definition
        const workflowResult = await query(`
            SELECT * FROM workflows WHERE id = $1
        `, [req.params.id]);

        if (workflowResult.rows.length === 0) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        const workflow = workflowResult.rows[0];

        // Create execution record
        const result = await query(`
            INSERT INTO executions (workflow_id, status, input_data)
            VALUES ($1, 'pending', $2)
            RETURNING *
        `, [req.params.id, JSON.stringify(inputData || {})]);

        const execution = result.rows[0];

        console.log(`🚀 Starting execution ${execution.id} for workflow ${req.params.id}`);

        // Use shared workflow engine instance
        const workflowEngine = getWorkflowEngine();
        
        try {
            // Check for user input requirements synchronously before starting async execution
            console.log('🔧 About to check user input requirements with inputData:', JSON.stringify(inputData, null, 2));
            await workflowEngine.checkUserInputRequirements(workflow, execution, inputData);
            
            // If no user input required, start async execution
            setImmediate(() => workflowEngine.executeWorkflow(execution, workflow));
            
            res.status(201).json({
                message: 'Execution started successfully',
                execution
            });
        } catch (userInputError) {
            if (userInputError.message === 'USER_INPUT_REQUIRED') {
                // Return specific error for frontend to handle
                return res.status(400).json({ 
                    message: 'USER_INPUT_REQUIRED',
                    userInputRequired: userInputError.userInputRequired 
                });
            }
            throw userInputError; // Re-throw other errors
        }
    } catch (err) {
        console.error('Execute workflow error:', err);
        res.status(500).json({ error: 'Failed to execute workflow' });
    }
});


module.exports = router;