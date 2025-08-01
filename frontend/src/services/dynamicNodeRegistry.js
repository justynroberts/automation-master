import { generatedNodesAPI } from './api';

class DynamicNodeRegistry {
    constructor() {
        this.generatedNodes = new Map();
        this.listeners = [];
    }

    // Load all generated nodes from backend
    async loadGeneratedNodes() {
        try {
            const response = await generatedNodesAPI.getGeneratedNodes();
            const nodes = response.data;
            
            // Clear existing generated nodes
            this.generatedNodes.clear();
            
            // Register each generated node
            nodes.forEach(node => {
                this.registerGeneratedNode(node);
            });
            
            // Notify listeners
            this.notifyListeners();
            
            console.log(`📦 Loaded ${nodes.length} generated nodes`);
            return nodes;
        } catch (error) {
            console.error('❌ Failed to load generated nodes:', error);
            throw error;
        }
    }

    // Register a single generated node
    registerGeneratedNode(nodeData) {
        const nodeConfig = this.convertToWorkflowNode(nodeData);
        this.generatedNodes.set(nodeData.id, nodeConfig);
        console.log(`✅ Registered generated node: ${nodeData.name}`);
    }

    // Convert generated node to workflow node format
    convertToWorkflowNode(nodeData) {
        console.log('🔧 convertToWorkflowNode processing:', {
            nodeId: nodeData.id,
            name: nodeData.name,
            hasConfig: !!nodeData.config,
            configType: typeof nodeData.config,
            configRaw: nodeData.config,
            configFields: nodeData.config?.fields?.length || 0
        });

        return {
            id: `generated_${nodeData.id}`,
            type: 'generatedNode',
            name: nodeData.name,
            description: nodeData.description,
            category: nodeData.category || 'Generated',
            icon: nodeData.icon || 'box',
            
            // Workflow engine properties
            inputs: this.extractInputs(nodeData.input_schema),
            outputs: this.extractOutputs(nodeData.output_schema),
            
            // UI configuration
            formFields: nodeData.ui_config?.formFields || [],
            config: nodeData.config || { fields: [], description: 'No configuration required' },
            
            // Execution
            execute: this.createExecuteFunction(nodeData),
            
            // Metadata
            generatedNodeId: nodeData.id,
            version: nodeData.version,
            isGenerated: true,
            
            // Visual styling
            style: {
                backgroundColor: this.getCategoryColor(nodeData.category),
                borderColor: this.getCategoryBorderColor(nodeData.category),
                color: '#ffffff'
            }
        };
    }

    // Extract inputs from JSON schema
    extractInputs(inputSchema) {
        if (!inputSchema || !inputSchema.properties) return [];
        
        return Object.entries(inputSchema.properties).map(([key, schema]) => ({
            name: key,
            type: this.mapSchemaTypeToInputType(schema.type),
            required: inputSchema.required?.includes(key) || false,
            description: schema.description || '',
            default: schema.default
        }));
    }

    // Extract outputs from JSON schema
    extractOutputs(outputSchema) {
        if (!outputSchema || !outputSchema.properties) return [];
        
        return Object.entries(outputSchema.properties).map(([key, schema]) => ({
            name: key,
            type: schema.type,
            description: schema.description || ''
        }));
    }

    // Map JSON schema types to form input types
    mapSchemaTypeToInputType(schemaType) {
        const typeMap = {
            'string': 'text',
            'number': 'number',
            'integer': 'number',
            'boolean': 'toggle',
            'object': 'json',
            'array': 'json'
        };
        return typeMap[schemaType] || 'text';
    }

    // Create execution function for generated node
    createExecuteFunction(nodeData) {
        return async (inputs, context) => {
            try {
                // In a real implementation, this would execute the generated code
                // For now, we'll call the test endpoint
                const response = await generatedNodesAPI.testNode(nodeData.id, inputs);
                return response.data.result;
            } catch (error) {
                console.error(`❌ Generated node execution failed:`, error);
                throw new Error(`Generated node "${nodeData.name}" execution failed: ${error.message}`);
            }
        };
    }

    // Get category-specific colors
    getCategoryColor(category) {
        const colors = {
            'Infrastructure': '#8b5cf6', // Purple
            'Data': '#3b82f6',          // Blue
            'Communication': '#10b981',  // Green
            'Custom': '#f59e0b',        // Amber
            'Generated': '#ec4899'      // Pink
        };
        return colors[category] || colors['Generated'];
    }

    getCategoryBorderColor(category) {
        const colors = {
            'Infrastructure': '#a78bfa',
            'Data': '#60a5fa',
            'Communication': '#34d399',
            'Custom': '#fbbf24',
            'Generated': '#f472b6'
        };
        return colors[category] || colors['Generated'];
    }

    // Get all generated nodes for workflow palette
    getAllGeneratedNodes() {
        return Array.from(this.generatedNodes.values());
    }

    // Get generated nodes by category
    getGeneratedNodesByCategory() {
        const nodesByCategory = {};
        
        this.generatedNodes.forEach(node => {
            const category = node.category || 'Generated';
            if (!nodesByCategory[category]) {
                nodesByCategory[category] = [];
            }
            nodesByCategory[category].push(node);
        });
        
        return nodesByCategory;
    }
    
    // Clear all generated nodes
    clearGeneratedNodes() {
        console.log('🧹 Clearing all generated nodes from registry');
        this.generatedNodes.clear();
        this.notifyListeners();
    }

    // Get specific generated node
    getGeneratedNode(nodeId) {
        const node = this.generatedNodes.get(nodeId);
        console.log('🔍 getGeneratedNode debug:', {
            requestedId: nodeId,
            foundNode: !!node,
            nodeKeys: node ? Object.keys(node) : [],
            hasConfig: !!node?.config,
            configKeys: node?.config ? Object.keys(node.config) : [],
            configFieldsCount: node?.config?.fields?.length || 0
        });
        return node;
    }

    // Remove generated node
    removeGeneratedNode(nodeId) {
        const removed = this.generatedNodes.delete(nodeId);
        if (removed) {
            this.notifyListeners();
            console.log(`🗑️ Removed generated node: ${nodeId}`);
        }
        return removed;
    }

    // Add listener for node changes
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Remove listener
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    // Notify all listeners of changes
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.getAllGeneratedNodes());
            } catch (error) {
                console.error('❌ Listener error:', error);
            }
        });
    }

    // Refresh nodes from backend
    async refresh() {
        return await this.loadGeneratedNodes();
    }
}

// Create singleton instance
const dynamicNodeRegistry = new DynamicNodeRegistry();

export default dynamicNodeRegistry;