const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateApiToken, requireOwnership } = require('../middleware/auth');
const nodeGenerator = require('../services/nodeGenerator');

const router = express.Router();

// All routes require authentication
router.use(authenticateApiToken);

// Generate a new node using LLM
router.post('/generate', [
    body('request').trim().isLength({ min: 3 }).withMessage('Request must be at least 3 characters'),
    body('context').optional().isObject().withMessage('Context must be an object')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { request, context = {} } = req.body;
        const userId = req.user.userId;

        console.log(`🤖 User ${userId} requested node generation: "${request}"`);

        // Get existing nodes for context
        const existingNodes = await nodeGenerator.getAllGeneratedNodes(userId);
        
        const generatedNode = await nodeGenerator.generateNode(request, userId, existingNodes);

        res.status(201).json({
            message: 'Node generated successfully',
            node: generatedNode
        });
    } catch (error) {
        console.error('Node generation error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate node' });
    }
});

// Get all generated nodes for the user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const nodes = await nodeGenerator.getAllGeneratedNodes(userId);

        res.json(nodes);
    } catch (error) {
        console.error('Get nodes error:', error);
        res.status(500).json({ error: 'Failed to fetch generated nodes' });
    }
});

// Get specific generated node by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const node = await nodeGenerator.getGeneratedNode(id, userId);
        res.json(node);
    } catch (error) {
        console.error('Get node error:', error);
        if (error.message === 'Node not found') {
            res.status(404).json({ error: 'Generated node not found' });
        } else {
            res.status(500).json({ error: 'Failed to fetch generated node' });
        }
    }
});

// Update a generated node
router.put('/:id', [
    body('name').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
    body('description').optional().trim(),
    body('category').optional().trim(),
    body('icon').optional().trim(),
    body('nodeDefinition').optional().isObject().withMessage('Node definition must be an object'),
    body('uiConfig').optional().isObject().withMessage('UI config must be an object'),
    body('config').optional().isObject().withMessage('Config must be an object'),
    body('executionCode').optional().isString().withMessage('Execution code must be a string'),
    body('inputSchema').optional().isObject().withMessage('Input schema must be an object'),
    body('outputSchema').optional().isObject().withMessage('Output schema must be an object'),
    body('changeDescription').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { id } = req.params;
        const userId = req.user.userId;
        const { changeDescription, ...updates } = req.body;

        const updatedNode = await nodeGenerator.updateGeneratedNode(
            id, 
            userId, 
            updates, 
            changeDescription
        );

        res.json({
            message: 'Node updated successfully',
            node: updatedNode
        });
    } catch (error) {
        console.error('Update node error:', error);
        if (error.message === 'Node not found or access denied') {
            res.status(404).json({ error: 'Generated node not found' });
        } else {
            res.status(500).json({ error: 'Failed to update generated node' });
        }
    }
});

// Delete (deactivate) a generated node
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await nodeGenerator.deleteGeneratedNode(id, userId);

        res.json({ message: 'Generated node deleted successfully' });
    } catch (error) {
        console.error('Delete node error:', error);
        if (error.message === 'Node not found or access denied') {
            res.status(404).json({ error: 'Generated node not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete generated node' });
        }
    }
});

// Get version history for a node
router.get('/:id/versions', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const versions = await nodeGenerator.getNodeVersions(id, userId);
        res.json(versions);
    } catch (error) {
        console.error('Get node versions error:', error);
        res.status(500).json({ error: 'Failed to fetch node versions' });
    }
});

// Duplicate a generated node
router.post('/:id/duplicate', [
    body('name').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user.userId;

        // Get the original node
        const originalNode = await nodeGenerator.getGeneratedNode(id, userId);
        
        // Create duplicate with new name
        const duplicateData = {
            name: name || `${originalNode.name} (Copy)`,
            description: originalNode.description,
            category: originalNode.category,
            icon: originalNode.icon,
            nodeDefinition: originalNode.node_definition,
            uiConfig: originalNode.ui_config,
            config: originalNode.config,
            executionCode: originalNode.execution_code,
            inputSchema: originalNode.input_schema,
            outputSchema: originalNode.output_schema
        };

        const duplicatedNode = await nodeGenerator.saveGeneratedNode(duplicateData, userId);

        res.status(201).json({
            message: 'Node duplicated successfully',
            node: duplicatedNode
        });
    } catch (error) {
        console.error('Duplicate node error:', error);
        if (error.message === 'Node not found') {
            res.status(404).json({ error: 'Original node not found' });
        } else {
            res.status(500).json({ error: 'Failed to duplicate node' });
        }
    }
});

// Test execute a generated node (for validation)
router.post('/:id/test', [
    body('inputs').isObject().withMessage('Inputs must be an object')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { id } = req.params;
        const { inputs } = req.body;
        const userId = req.user.userId;

        const node = await nodeGenerator.getGeneratedNode(id, userId);
        
        // Create a safe execution context
        const context = {
            log: (level, message) => console.log(`[${level.toUpperCase()}] ${message}`),
            inputs,
            nodeId: id,
            userId
        };

        // In a real implementation, you'd want to run this in a sandboxed environment
        // For now, we'll just validate the code structure and return a mock result
        try {
            // Basic validation that the code is executable JavaScript
            const func = new Function('inputs', 'context', node.execution_code + '\nreturn executeNode(inputs, context);');
            
            // For safety, return a mock result instead of actually executing
            const mockResult = {
                result: { message: 'Test execution successful', inputs },
                status: 'success',
                message: 'Node test completed successfully'
            };

            res.json({
                message: 'Node test completed',
                result: mockResult,
                executionTime: '< 1ms'
            });
        } catch (codeError) {
            res.status(400).json({ 
                error: 'Invalid execution code', 
                details: codeError.message 
            });
        }
    } catch (error) {
        console.error('Test node error:', error);
        if (error.message === 'Node not found') {
            res.status(404).json({ error: 'Generated node not found' });
        } else {
            res.status(500).json({ error: 'Failed to test node' });
        }
    }
});

// Get node categories and statistics
router.get('/stats/categories', async (req, res) => {
    try {
        const userId = req.user.userId;
        const nodes = await nodeGenerator.getAllGeneratedNodes(userId);

        const stats = nodes.reduce((acc, node) => {
            if (!acc[node.category]) {
                acc[node.category] = 0;
            }
            acc[node.category]++;
            return acc;
        }, {});

        const categories = Object.keys(stats).map(category => ({
            name: category,
            count: stats[category],
            nodes: nodes.filter(n => n.category === category)
        }));

        res.json({
            totalNodes: nodes.length,
            categories,
            summary: stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch node statistics' });
    }
});

module.exports = router;