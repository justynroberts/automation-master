const WorkflowEngine = require('./workflowEngine');

// Singleton WorkflowEngine instance
let workflowEngineInstance = null;

const getWorkflowEngine = () => {
    if (!workflowEngineInstance) {
        workflowEngineInstance = new WorkflowEngine();
        console.log('🏭 Created shared WorkflowEngine instance');
    }
    return workflowEngineInstance;
};

module.exports = {
    getWorkflowEngine
};