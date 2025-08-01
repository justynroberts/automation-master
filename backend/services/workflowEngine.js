const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { query } = require('../utils/database');
const SandboxEngine = require('./sandboxEngine');

class WorkflowEngine {
    constructor() {
        this.sandbox = new SandboxEngine();
        this.activeExecutions = new Map(); // Track active executions
        this.executionQueue = []; // Queue for pending executions
        this.maxConcurrentExecutions = 5; // Limit concurrent executions
        this.isProcessingQueue = false;
        this.lastExecutionTime = 0; // Track last execution time to prevent rapid fire
        this.minExecutionInterval = 50; // Minimum 50ms between executions
        this.nodeHandlers = {
            manual: this.handleManualNode.bind(this),
            file: this.handleFileNode.bind(this),
            webhook: this.handleWebhookNode.bind(this),
            timer: this.handleTimerNode.bind(this),
            javascript: this.handleJavaScriptNode.bind(this),
            python: this.handlePythonNode.bind(this),
            bash: this.handleBashNode.bind(this),
            ansible: this.handleAnsibleNode.bind(this),
            condition: this.handleConditionNode.bind(this),
            loop: this.handleLoopNode.bind(this),
            merge: this.handleMergeNode.bind(this),
            filter: this.handleFilterNode.bind(this),
            api: this.handleApiNode.bind(this),
            email: this.handleEmailNode.bind(this),
            database: this.handleDatabaseNode.bind(this),
            generatedNode: this.handleGeneratedNode.bind(this),
            output: this.handleOutputNode.bind(this),
            input: this.handleInputNode.bind(this),
            apiPost: this.handleApiPostNode.bind(this),
            apiGet: this.handleApiGetNode.bind(this),
            slackOutput: this.handleSlackOutputNode.bind(this),
            screenOutput: this.handleScreenOutputNode.bind(this),
            transform: this.handleTransformNode.bind(this),
            userInput: this.handleUserInputNode.bind(this),
            script: this.handleScriptNode.bind(this)
        };
    }

    async executeWorkflow(execution, workflow) {
        // Add to queue instead of executing immediately
        return this.queueExecution(execution, workflow);
    }

    async queueExecution(execution, workflow) {
        // Queuing execution for processing
        
        // Throttle rapid consecutive executions
        const now = Date.now();
        const timeSinceLastExecution = now - this.lastExecutionTime;
        
        if (timeSinceLastExecution < this.minExecutionInterval) {
            const delay = this.minExecutionInterval - timeSinceLastExecution;
            // Throttling execution to prevent overwhelming
            setTimeout(() => this.queueExecution(execution, workflow), delay);
            return execution;
        }
        
        this.lastExecutionTime = now;
        
        // Check if we're at the limit
        if (this.activeExecutions.size >= this.maxConcurrentExecutions) {
            this.executionQueue.push({ execution, workflow });
            await query(`
                UPDATE executions 
                SET status = 'pending'
                WHERE id = $1
            `, [execution.id]);
            // Execution queued for later processing
            
            // Process queue after a short delay to prevent overwhelming
            setTimeout(() => this.processQueue(), 100);
            return execution;
        }

        // Execute immediately (don't await to allow quick consecutive executions)
        this.executeWorkflowInternal(execution, workflow).catch(error => {
            console.error(`Execution ${execution.id} failed:`, error);
        });
        
        return execution;
    }

    async processQueue() {
        if (this.isProcessingQueue || this.executionQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        
        while (this.executionQueue.length > 0 && this.activeExecutions.size < this.maxConcurrentExecutions) {
            const { execution, workflow } = this.executionQueue.shift();
            // Starting queued execution
            // Don't await here - let executions run concurrently
            this.executeWorkflowInternal(execution, workflow).catch(error => {
                console.error(`Queued execution ${execution.id} failed:`, error);
            });
        }

        this.isProcessingQueue = false;
    }

    async executeWorkflowInternal(execution, workflow) {
        const executionId = execution.id;
        
        try {
            // Track active execution
            this.activeExecutions.set(executionId, { 
                startTime: Date.now(), 
                execution, 
                workflow 
            });

            // Processing workflow execution
            
            // Update status to running
            await query(`
                UPDATE executions 
                SET status = 'running'
                WHERE id = $1
            `, [executionId]);

            await this.logExecution(execution.id, 'system', 'info', 'Workflow execution started');

            const definition = workflow.definition;
            
            // Enhanced workflow validation
            if (!definition) {
                throw new Error('Workflow definition is missing');
            }
            
            const nodes = definition.nodes || [];
            const edges = definition.edges || [];
            
            if (nodes.length === 0) {
                throw new Error('Workflow has no nodes defined');
            }
            
            // Validate each node has required properties
            for (const node of nodes) {
                if (!node.id) {
                    throw new Error('Node missing required ID property');
                }
                if (!node.type) {
                    throw new Error(`Node ${node.id} missing required type property`);
                }
                if (!this.nodeHandlers[node.type]) {
                    throw new Error(`Unsupported node type: ${node.type} in node ${node.id}`);
                }
            }
            
            // Workflow validation passed

            // Build execution context
            const context = {
                executionId: execution.id,
                workflowId: workflow.id,
                inputData: execution.input_data || {},
                results: {},
                userId: workflow.user_id,
                workflow: workflow // Add workflow reference for step name resolution
            };

            // Sort nodes by execution order (topological sort would be better)
            const sortedNodes = this.sortNodesByDependencies(nodes, edges);

            // Process each node
            for (const node of sortedNodes) {
                // Processing node
                
                await this.logExecution(execution.id, node.id, 'info', 
                    `Processing ${node.type} node: ${node.data.label || node.id}`);

                const startTime = Date.now();

                try {
                    const result = await this.executeNode(node, context);
                    const executionTime = Date.now() - startTime;

                    // Store result in context
                    context.results[node.id] = result;
                    
                    // Track the last executed node for {{previous}} variable
                    context.lastExecutedNode = node.id;

                    // Create node log entry
                    await query(`
                        INSERT INTO node_logs (execution_id, node_id, node_type, status, input_data, output_data, execution_time_ms, executed_at, completed_at)
                        VALUES ($1, $2, $3, 'completed', $4, $5, $6, NOW(), NOW())
                    `, [
                        execution.id,
                        node.id,
                        node.type,
                        JSON.stringify(node.data),
                        JSON.stringify(result),
                        executionTime
                    ]);

                    await this.logExecution(execution.id, node.id, 'info', 
                        `Completed ${node.type} node successfully (${executionTime}ms)`);

                } catch (nodeError) {
                    const executionTime = Date.now() - startTime;
                    
                    // Log node execution failure
                    console.error(`Node execution failed - ${node.type} (${node.id}):`, nodeError.message);
                    
                    await query(`
                        INSERT INTO node_logs (execution_id, node_id, node_type, status, input_data, error_message, execution_time_ms, executed_at, completed_at)
                        VALUES ($1, $2, $3, 'failed', $4, $5, $6, NOW(), NOW())
                    `, [
                        execution.id,
                        node.id,
                        node.type,
                        JSON.stringify(node.data),
                        nodeError.message,
                        executionTime
                    ]);

                    await this.logExecution(execution.id, node.id, 'error', 
                        `Node failed: ${nodeError.message}`);

                    throw new Error(`Node ${node.id} (${node.type}) failed: ${nodeError.message}`);
                }
            }

            // Mark execution as completed
            await query(`
                UPDATE executions 
                SET status = 'completed', completed_at = NOW(), output_data = $2
                WHERE id = $1
            `, [execution.id, JSON.stringify({ 
                result: 'Workflow completed successfully', 
                nodesProcessed: nodes.length,
                results: context.results
            })]);

            await this.logExecution(execution.id, 'system', 'info', 
                `Workflow execution completed successfully. Processed ${nodes.length} nodes.`);

            console.log(`Execution ${executionId} completed successfully`);

        } catch (error) {
            console.error(`Execution ${executionId} failed:`, error);
            
            // Mark execution as failed
            await query(`
                UPDATE executions 
                SET status = 'failed', completed_at = NOW(), error_message = $2
                WHERE id = $1
            `, [executionId, error.message]);

            await this.logExecution(executionId, 'system', 'error', 
                `Workflow execution failed: ${error.message}`);
        } finally {
            // Clean up active execution tracking
            this.activeExecutions.delete(executionId);
            // Cleaned up execution resources
            
            // Process next item in queue
            setImmediate(() => this.processQueue());
        }
    }

    async executeNode(node, context) {
        let nodeType = node.type;
        
        // Handle script nodes with specific script types
        if (node.type === 'script' && node.data && node.data.scriptType) {
            nodeType = node.data.scriptType;
        }
        
        // Handle input nodes with specific input types
        if (node.type === 'input' && node.data && node.data.inputType) {
            nodeType = node.data.inputType;
        }
        
        // Handle logic nodes with specific logic types
        if (node.type === 'logic' && node.data && node.data.logicType) {
            nodeType = node.data.logicType;
        }
        
        // Handle output nodes with specific output types
        if (node.type === 'output' && node.data && node.data.outputType) {
            nodeType = node.data.outputType;
        }
        
        const handler = this.nodeHandlers[nodeType];
        if (!handler) {
            throw new Error(`Unknown node type: ${nodeType} (original type: ${node.type})`);
        }
        return await handler(node, context);
    }

    sortNodesByDependencies(nodes, edges) {
        // Simple ordering - start with nodes that have no incoming edges
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        const incomingEdges = new Map();
        
        // Count incoming edges for each node
        nodes.forEach(node => incomingEdges.set(node.id, 0));
        edges.forEach(edge => {
            incomingEdges.set(edge.target, (incomingEdges.get(edge.target) || 0) + 1);
        });

        // Sort by incoming edge count (nodes with no dependencies first)
        return nodes.sort((a, b) => {
            return incomingEdges.get(a.id) - incomingEdges.get(b.id);
        });
    }

    async logExecution(executionId, nodeId, level, message) {
        await query(`
            INSERT INTO execution_logs (execution_id, node_id, log_level, message, source)
            VALUES ($1, $2, $3, $4, 'engine')
        `, [executionId, nodeId, level, message]);
    }

    // Node handlers
    async handleManualNode(node, context) {
        const data = node.data || {};
        return {
            type: 'manual',
            message: data.message || 'Manual step completed',
            userInput: data.userInput || null
        };
    }

    async handleFileNode(node, context) {
        const data = node.data || {};
        const filePath = data.filePath;
        
        if (!filePath) {
            throw new Error('File path not specified');
        }

        try {
            const content = await fs.readFile(filePath, 'utf8');
            return {
                type: 'file',
                filePath,
                size: content.length,
                content: content.substring(0, 1000) // First 1000 chars
            };
        } catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    async handleWebhookNode(node, context) {
        const data = node.data || {};
        return {
            type: 'webhook',
            endpoint: data.endpoint || '/webhook',
            method: data.method || 'POST',
            status: 'configured'
        };
    }

    async handleTimerNode(node, context) {
        const data = node.data || {};
        const delay = parseInt(data.delay) || 1000;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return {
            type: 'timer',
            delay,
            triggeredAt: new Date().toISOString()
        };
    }

    async handleJavaScriptNode(node, context) {
        const data = node.data || {};
        const code = data.script || data.code || 'console.log("No code provided");';
        
        try {
            const dockerAvailable = await this.sandbox.checkDockerAvailable();
            
            if (dockerAvailable) {
                const result = await this.sandbox.executeInSandbox('javascript', code, {
                    results: context.results,
                    input: context.inputData
                });
                
                return {
                    type: 'javascript',
                    result: result.stdout,
                    stderr: result.stderr,
                    sandboxed: true,
                    code: code.substring(0, 200) + '...'
                };
            } else {
                // SECURITY FIX: Remove unsafe fallback execution
                throw new Error('JavaScript execution requires Docker sandboxing. Please configure Docker or disable JavaScript nodes.');
            }
        } catch (error) {
            throw new Error(`JavaScript execution failed: ${error.message}`);
        }
    }

    async handlePythonNode(node, context) {
        const data = node.data || {};
        const code = data.script || data.code || 'print("Hello from Python")';
        
        try {
            const dockerAvailable = await this.sandbox.checkDockerAvailable();
            
            if (dockerAvailable) {
                const result = await this.sandbox.executeInSandbox('python', code, {
                    results: context.results,
                    input: context.inputData
                });
                
                return {
                    type: 'python',
                    stdout: result.stdout,
                    stderr: result.stderr,
                    sandboxed: true,
                    code: code.substring(0, 200) + '...'
                };
            } else {
                // SECURITY FIX: Remove unsafe fallback execution
                throw new Error('Python execution requires Docker sandboxing. Please configure Docker or disable Python nodes.');
            }
        } catch (error) {
            throw new Error(`Python execution failed: ${error.message}`);
        }
    }

    async handleBashNode(node, context) {
        const data = node.data || {};
        const command = data.script || data.command || 'echo "Hello from Bash"';
        
        try {
            const dockerAvailable = await this.sandbox.checkDockerAvailable();
            
            if (dockerAvailable) {
                const result = await this.sandbox.executeInSandbox('bash', command, {
                    results: context.results,
                    input: context.inputData
                });
                
                return {
                    type: 'bash',
                    command,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    exitCode: result.exitCode,
                    sandboxed: true
                };
            } else {
                // SECURITY FIX: Remove unsafe fallback execution
                throw new Error('Bash execution requires Docker sandboxing. Please configure Docker or disable Bash nodes.');
            }
        } catch (error) {
            throw new Error(`Bash execution failed: ${error.message}`);
        }
    }

    async handleAnsibleNode(node, context) {
        const data = node.data || {};
        const playbookType = data.playbookType || 'inline';
        const inventoryType = data.inventoryType || 'inline';
        
        try {
            // Executing Ansible playbook
            
            // Create temporary directory for ansible files
            const tempDir = `/tmp/workflow-sandbox/ansible-${context.executionId}-${Date.now()}`;
            await fs.mkdir(tempDir, { recursive: true });
            
            let playbookPath;
            let inventoryPath;
            
            // Handle playbook source
            switch (playbookType) {
                case 'inline':
                    playbookPath = path.join(tempDir, 'playbook.yml');
                    const playbookContent = data.playbook || `---
- name: Default Playbook
  hosts: all
  tasks:
    - name: Hello World
      debug:
        msg: "Hello from Ansible!"`;
                    await fs.writeFile(playbookPath, playbookContent);
                    break;
                    
                case 'file':
                    playbookPath = data.playbookPath;
                    if (!playbookPath) {
                        throw new Error('Playbook file path is required');
                    }
                    // Verify file exists
                    await fs.access(playbookPath);
                    break;
                    
                case 'git':
                    const gitRepo = data.gitRepo;
                    const gitBranch = data.gitBranch || 'main';
                    const playbookFile = data.playbookFile || 'site.yml';
                    
                    if (!gitRepo) {
                        throw new Error('Git repository URL is required');
                    }
                    
                    // Clone repository
                    const repoDir = path.join(tempDir, 'repo');
                    await new Promise((resolve, reject) => {
                        exec(`git clone --branch ${gitBranch} --depth 1 ${gitRepo} ${repoDir}`, (error, stdout, stderr) => {
                            if (error) {
                                reject(new Error(`Git clone failed: ${error.message}`));
                                return;
                            }
                            resolve();
                        });
                    });
                    
                    playbookPath = path.join(repoDir, playbookFile);
                    // Verify playbook exists in repo
                    await fs.access(playbookPath);
                    break;
                    
                default:
                    throw new Error(`Unknown playbook type: ${playbookType}`);
            }
            
            // Handle inventory
            switch (inventoryType) {
                case 'inline':
                    inventoryPath = path.join(tempDir, 'inventory.ini');
                    const hosts = data.hosts || 'localhost';
                    const inventoryContent = hosts.split('\n').join('\n');
                    await fs.writeFile(inventoryPath, inventoryContent);
                    break;
                    
                case 'file':
                    inventoryPath = data.inventoryPath;
                    if (!inventoryPath) {
                        throw new Error('Inventory file path is required');
                    }
                    // Verify file exists
                    await fs.access(inventoryPath);
                    break;
                    
                case 'dynamic':
                    inventoryPath = data.dynamicInventory || 'localhost';
                    break;
                    
                default:
                    throw new Error(`Unknown inventory type: ${inventoryType}`);
            }
            
            // Build ansible-playbook command
            const ansibleCmd = ['ansible-playbook'];
            
            // Add inventory
            ansibleCmd.push('-i', inventoryPath);
            
            // Add SSH user
            if (data.sshUser) {
                ansibleCmd.push('-u', data.sshUser);
            }
            
            // Add SSH key
            if (data.sshKeyPath) {
                ansibleCmd.push('--private-key', data.sshKeyPath);
            }
            
            // Add become (sudo)
            if (data.become === 'true') {
                ansibleCmd.push('--become');
            }
            
            // Add verbosity
            const verbosity = parseInt(data.verbosity) || 0;
            if (verbosity > 0) {
                ansibleCmd.push('-' + 'v'.repeat(verbosity));
            }
            
            // Add check mode (dry run)
            if (data.checkMode === 'true') {
                ansibleCmd.push('--check');
            }
            
            // Add tags
            if (data.tags) {
                ansibleCmd.push('--tags', data.tags);
            }
            
            // Add skip tags
            if (data.skipTags) {
                ansibleCmd.push('--skip-tags', data.skipTags);
            }
            
            // Add extra variables
            if (data.extraVars) {
                try {
                    const vars = JSON.parse(data.extraVars);
                    const varString = Object.entries(vars)
                        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
                        .join(' ');
                    ansibleCmd.push('--extra-vars', varString);
                } catch (error) {
                    console.warn('Invalid extra vars JSON, skipping');
                }
            }
            
            // Add context variables
            if (context.results || context.inputData) {
                const contextVars = {
                    ...context.inputData,
                    workflow_results: context.results,
                    execution_id: context.executionId
                };
                
                const contextVarString = Object.entries(contextVars)
                    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
                    .join(' ');
                ansibleCmd.push('--extra-vars', contextVarString);
            }
            
            // Add playbook path
            ansibleCmd.push(playbookPath);
            
            const command = ansibleCmd.join(' ');
            // Executing Ansible command
            
            // Execute ansible-playbook
            return new Promise((resolve, reject) => {
                exec(command, {
                    cwd: tempDir,
                    timeout: (data.timeout || 300) * 1000, // Default 5 minutes
                    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
                }, async (error, stdout, stderr) => {
                    try {
                        // Clean up temp directory
                        await fs.rm(tempDir, { recursive: true, force: true });
                    } catch (cleanupError) {
                        console.warn('Failed to cleanup temp directory:', cleanupError.message);
                    }
                    
                    if (error) {
                        reject(new Error(`Ansible execution failed: ${error.message}\nStderr: ${stderr}`));
                        return;
                    }
                    
                    // Parse ansible output for task results
                    const taskResults = [];
                    const lines = stdout.split('\n');
                    let currentTask = null;
                    
                    for (const line of lines) {
                        if (line.startsWith('TASK [')) {
                            const taskMatch = line.match(/TASK \[(.*?)\]/);
                            if (taskMatch) {
                                currentTask = taskMatch[1];
                            }
                        } else if (line.includes('ok:') || line.includes('changed:') || line.includes('failed:')) {
                            const statusMatch = line.match(/(ok|changed|failed): \[(.*?)\]/);
                            if (statusMatch && currentTask) {
                                taskResults.push({
                                    task: currentTask,
                                    host: statusMatch[2],
                                    status: statusMatch[1]
                                });
                            }
                        }
                    }
                    
                    resolve({
                        type: 'ansible',
                        playbookType,
                        inventoryType,
                        command,
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                        taskResults,
                        checkMode: data.checkMode === 'true',
                        exitCode: 0
                    });
                });
            });
            
        } catch (error) {
            throw new Error(`Ansible execution failed: ${error.message}`);
        }
    }

    async handleConditionNode(node, context) {
        const data = node.data || {};
        const condition = data.condition || 'true';
        
        try {
            // SECURITY FIX: Use sandboxed execution for condition evaluation
            const dockerAvailable = await this.sandbox.checkDockerAvailable();
            
            if (dockerAvailable) {
                const code = `
                    const context = arguments[0];
                    const input = arguments[1];
                    return ${condition};
                `;
                
                const result = await this.sandbox.executeInSandbox('javascript', code, {
                    results: context.results,
                    input: context.inputData
                });
                
                const conditionResult = JSON.parse(result.stdout || 'false');
                
                return {
                    type: 'condition',
                    condition,
                    result: Boolean(conditionResult),
                    branch: conditionResult ? 'true' : 'false',
                    sandboxed: true
                };
            } else {
                // SECURITY FIX: Safe condition evaluation without Function constructor
                // Only allow simple comparisons for now
                const safeConditions = /^[a-zA-Z0-9_\.\s><!=&|()'"]+$/;
                if (!safeConditions.test(condition)) {
                    throw new Error('Condition contains unsafe characters. Use simple comparisons only when Docker is not available.');
                }
                
                // Very basic evaluation - in production, use a proper expression parser
                const result = condition === 'true' || condition === '1';
                
                return {
                    type: 'condition',
                    condition,
                    result: Boolean(result),
                    branch: result ? 'true' : 'false',
                    sandboxed: false,
                    warning: 'Basic condition evaluation without sandboxing'
                };
            }
        } catch (error) {
            throw new Error(`Condition evaluation failed: ${error.message}`);
        }
    }

    async handleLoopNode(node, context) {
        const data = node.data || {};
        const iterations = parseInt(data.iterations) || 1;
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            results.push({
                iteration: i + 1,
                timestamp: new Date().toISOString()
            });
        }
        
        return {
            type: 'loop',
            iterations,
            results
        };
    }

    async handleMergeNode(node, context) {
        const data = node.data || {};
        const inputKeys = data.inputKeys || [];
        const mergedData = {};
        
        inputKeys.forEach(key => {
            if (context.results[key]) {
                mergedData[key] = context.results[key];
            }
        });
        
        return {
            type: 'merge',
            mergedKeys: inputKeys,
            data: mergedData
        };
    }

    async handleFilterNode(node, context) {
        const data = node.data || {};
        const filterCondition = data.filter || 'true';
        
        return {
            type: 'filter',
            condition: filterCondition,
            passed: true, // Simplified for now
            filtered: []
        };
    }

    async handleApiNode(node, context) {
        const data = node.data || {};
        const url = data.url;
        const method = data.method || 'GET';
        
        if (!url) {
            throw new Error('API URL not specified');
        }

        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(url, { method });
            const responseData = await response.text();
            
            return {
                type: 'api',
                url,
                method,
                status: response.status,
                response: responseData.substring(0, 500) // Truncated
            };
        } catch (error) {
            throw new Error(`API call failed: ${error.message}`);
        }
    }

    async handleEmailNode(node, context) {
        const data = node.data || {};
        
        return {
            type: 'email',
            to: data.to || 'user@example.com',
            subject: data.subject || 'Workflow Notification',
            body: data.body || 'Email sent from workflow',
            status: 'sent' // Simulated for now
        };
    }

    async handleDatabaseNode(node, context) {
        const data = node.data || {};
        const operation = data.operation || 'select';
        
        return {
            type: 'database',
            operation,
            table: data.table || 'workflows',
            status: 'completed',
            rowsAffected: 1
        };
    }

    async handleGeneratedNode(node, context) {
        const data = node.data || {};
        // Executing generated node
        
        try {
            // Get the generated node details from database
            const nodeGenerator = require('./nodeGenerator');
            const generatedNodeId = data.generatedNodeId;
            
            // Processing generated node data
            
            if (!generatedNodeId) {
                throw new Error('Generated node ID not found in node data');
            }
            
            // Get the node definition from database
            let result;
            try {
                result = await nodeGenerator.getGeneratedNode(generatedNodeId, context.userId);
            } catch (error) {
                throw new Error(`Generated node ${generatedNodeId} not found in database. Please regenerate the node or remove it from the workflow.`);
            }
            
            if (!result) {
                throw new Error(`Generated node ${generatedNodeId} not found in database. Please regenerate the node or remove it from the workflow.`);
            }
            
            // Get the execution code
            const executionCode = result.execution_code;
            if (!executionCode) {
                throw new Error('No execution code found for generated node');
            }
            
            // Prepare execution context with inputs from node configuration
            const nodeInputs = {};
            const config = result.config || { fields: [] };
            
            // Extract configured values from node data and process variables
            if (config.fields && Array.isArray(config.fields)) {
                config.fields.forEach(field => {
                    const fieldKey = `config_${field.name}`;
                    if (data[fieldKey] !== undefined) {
                        // Process variable placeholders in the field value
                        const rawValue = data[fieldKey];
                        const processedValue = this.processPlaceholders(rawValue, context);
                        nodeInputs[field.name] = processedValue;
                    } else if (field.defaultValue !== undefined) {
                        // Process variables in default values too
                        const processedDefault = this.processPlaceholders(field.defaultValue, context);
                        nodeInputs[field.name] = processedDefault;
                    }
                });
            }
            
            // Prepared generated node inputs
            
            // Execute the generated code in sandbox
            const dockerAvailable = await this.sandbox.checkDockerAvailable();
            
            if (dockerAvailable) {
                // Prepare the execution context
                const executionContext = {
                    inputs: nodeInputs,
                    results: context.results,
                    nodeId: node.id,
                    generatedNodeId: generatedNodeId
                };
                
                // Execute in JavaScript sandbox (most generated nodes will be JavaScript)
                const result = await this.sandbox.executeInSandbox('javascript', executionCode, executionContext);
                
                return {
                    type: 'generatedNode',
                    nodeId: generatedNodeId,
                    nodeName: result.name || data.label || 'Generated Node',
                    inputs: nodeInputs,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    sandboxed: true,
                    executionTime: result.executionTime || 0
                };
            } else {
                throw new Error('Generated node execution requires Docker sandboxing');
            }
            
        } catch (error) {
            console.error('Generated node execution failed:', error);
            throw new Error(`Generated node execution failed: ${error.message}`);
        }
    }

    async handleInputNode(node, context) {
        // Input nodes provide initial data to the workflow
        // Processing input node
        
        const data = node.data || {};
        return {
            type: 'input',
            data: data.config || {},
            inputType: data.inputType || 'manual'
        };
    }

    async handleOutputNode(node, context) {
        // Output nodes just pass through the data from previous nodes
        // Processing output node
        
        // Get the results from the previous node (if connected)
        // Avoid using the node's own ID to prevent circular references
        const results = { ...context.results };
        delete results[node.id]; // Remove any self-reference
        
        // If there's only one previous result, return just that
        const resultKeys = Object.keys(results);
        const finalData = resultKeys.length === 1 ? results[resultKeys[0]] : results;
        
        return {
            type: 'output',
            data: finalData,
            message: 'Workflow completed successfully'
        };
    }

    // Add queue management methods
    getExecutionStats() {
        return {
            activeExecutions: this.activeExecutions.size,
            queuedExecutions: this.executionQueue.length,
            maxConcurrentExecutions: this.maxConcurrentExecutions,
            activeExecutionIds: Array.from(this.activeExecutions.keys()),
            sandboxStats: this.sandbox.getStats()
        };
    }

    async cancelExecution(executionId) {
        // Remove from queue if pending
        this.executionQueue = this.executionQueue.filter(item => item.execution.id !== executionId);
        
        // If actively running, it will be cleaned up in the finally block
        if (this.activeExecutions.has(executionId)) {
            console.log(`Cancellation requested for execution ${executionId}`);
            return true;
        }
        
        return false;
    }

    async handleApiPostNode(node, context) {
        const data = node.data || {};
        let url = data.url;
        const timeout = (data.timeout || 30) * 1000;

        // Processing API POST request

        if (!url) {
            throw new Error('API URL not specified');
        }

        // Process placeholders in URL
        url = this.processPlaceholders(url, context);

        let headers, body;
        
        try {
            // Parse headers with error handling
            const headersTemplate = data.headers || '{"Content-Type": "application/json"}';
            const processedHeaders = this.processPlaceholders(headersTemplate, context);
            // Processing API headers
            
            // Check if processed headers is empty or only whitespace
            if (!processedHeaders || processedHeaders.trim() === '') {
                console.warn('Empty headers after processing, using default');
                headers = { 'Content-Type': 'application/json' };
            } else {
                headers = JSON.parse(processedHeaders);
            }
        } catch (error) {
            console.error('Headers JSON parse error:', error.message);
            
            // Try to provide helpful error context
            const processed = this.processPlaceholders(data.headers || '{}', context);
            if (processed.includes('{{')) {
                throw new Error(`Headers contain unresolved variables: ${processed}. Check that all variables exist and have values.`);
            }
            throw new Error(`Invalid JSON in headers: ${error.message}. Processed value: "${processed}"`);
        }

        try {
            // Parse body with error handling
            const bodyTemplate = data.body || '{}';
            const processedBody = this.processPlaceholders(bodyTemplate, context);
            // Processing API body
            
            // Check if processed body is empty or only whitespace
            if (!processedBody || processedBody.trim() === '') {
                console.warn('Empty body after processing, using empty object');
                body = {};
            } else {
                // Check for variable patterns in the body template
                const variableMatches = bodyTemplate.match(/{{[^}]+}}/g);
                
                if (variableMatches && variableMatches.length === 1) {
                    // Single variable - handle specially to avoid JSON stringification
                    const singleVarMatch = bodyTemplate.trim().match(/^{{([^}]+)}}$/);
                    if (singleVarMatch) {
                        // Body is just a single variable - resolve it directly without string processing
                        const variablePath = singleVarMatch[1];
                        const variables = this.buildVariableContext(context);
                        const resolved = this.resolveVariablePath(variablePath, variables, context);
                        
                        if (resolved !== null && resolved !== undefined) {
                            // Use the resolved value directly - no string conversion needed
                            body = resolved;
                            // Keep body as is if it's already an object/array
                            // It will be stringified when making the request
                        } else {
                            throw new Error(`Unresolved variable in body: ${bodyTemplate}`);
                        }
                    } else {
                        // Single variable but with surrounding text - use normal processing
                        if (typeof processedBody === 'string') {
                            body = JSON.parse(processedBody);
                        } else {
                            body = processedBody;
                        }
                    }
                } else if (variableMatches && variableMatches.length > 1) {
                    // Multiple variables detected - this often causes JSON parsing issues
                    throw new Error(`Body template contains multiple variables: ${variableMatches.join(', ')}. This can cause JSON parsing issues when variables contain arrays or objects. Consider using a single variable or wrap variables in a JSON structure.`);
                } else {
                    // No variables or complex template - use normal processing
                    if (typeof processedBody === 'string') {
                        body = JSON.parse(processedBody);
                    } else {
                        body = processedBody;
                    }
                }
            }
        } catch (error) {
            console.error('Body JSON parse error:', error.message);
            
            // Provide helpful error messages for common issues
            const originalTemplate = data.body || '{}';
            
            if (processed.includes('{{{') || processed.includes('}}}')) {
                throw new Error(`Invalid variable syntax: Use {{variable}} not {{{variable}}}. Found: ${originalTemplate}`);
            }
            if (processed.includes('{{')) {
                const truncatedForError = typeof processed === 'string' && processed.length > 500 
                    ? processed.substring(0, 500) + '... [TRUNCATED]' 
                    : processed;
                throw new Error(`Request body contains unresolved variables: ${truncatedForError}. Check that all variables exist and have values.`);
            }
            
            const truncatedForError = typeof processed === 'string' && processed.length > 500 
                ? processed.substring(0, 500) + '... [TRUNCATED]' 
                : processed;
            throw new Error(`Invalid JSON in request body: ${error.message}. Processed value: "${truncatedForError}"`);
        }

        try {
            const fetch = (await import('node-fetch')).default;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            // Don't stringify if body is already a string (e.g., raw JSON)
            const requestBody = typeof body === 'string' ? body : JSON.stringify(body);
            
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: requestBody,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            let responseData = await response.text();
            
            // Try to parse JSON responses
            let parsedResponse = responseData;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try {
                    parsedResponse = JSON.parse(responseData);
                } catch (parseError) {
                    console.warn('Failed to parse JSON response:', parseError.message);
                    // Keep as string if JSON parsing fails
                }
            }
            
            return {
                type: 'apiPost',
                url,
                method: 'POST',
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                response: parsedResponse,
                rawResponse: responseData.substring(0, 1000), // Keep truncated raw text for debugging
                success: response.ok
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`API POST request timed out after ${timeout/1000} seconds`);
            }
            throw new Error(`API POST request failed: ${error.message}`);
        }
    }

    async handleApiGetNode(node, context) {
        const data = node.data || {};
        let url = data.url;
        const timeout = (data.timeout || 30) * 1000;

        if (!url) {
            throw new Error('API URL not specified');
        }

        // Process placeholders in URL
        url = this.processPlaceholders(url, context);

        let headers, params;
        
        try {
            // Parse headers with error handling
            const headersTemplate = data.headers || '{"Content-Type": "application/json"}';
            const processedHeaders = this.processPlaceholders(headersTemplate, context);
            
            // Check if processed headers is empty or only whitespace
            if (!processedHeaders || processedHeaders.trim() === '') {
                console.warn('Empty headers after processing, using default');
                headers = { 'Content-Type': 'application/json' };
            } else {
                headers = JSON.parse(processedHeaders);
            }
        } catch (error) {
            console.error('Headers JSON parse error:', error.message);
            
            // Try to provide helpful error context
            const processed = this.processPlaceholders(data.headers || '{}', context);
            if (processed.includes('{{')) {
                throw new Error(`Headers contain unresolved variables: ${processed}. Check that all variables exist and have values.`);
            }
            throw new Error(`Invalid JSON in headers: ${error.message}. Processed value: "${processed}"`);
        }

        try {
            // Parse params with error handling
            const paramsTemplate = data.params || '{}';
            const processedParams = this.processPlaceholders(paramsTemplate, context);
            
            // Check if processed params is empty or only whitespace
            if (!processedParams || processedParams.trim() === '') {
                console.warn('Empty params after processing, using empty object');
                params = {};
            } else {
                params = JSON.parse(processedParams);
            }
        } catch (error) {
            console.error('Params JSON parse error:', error.message);
            
            // Try to provide helpful error context
            const processed = this.processPlaceholders(data.params || '{}', context);
            if (processed.includes('{{')) {
                throw new Error(`Query parameters contain unresolved variables: ${processed}. Check that all variables exist and have values.`);
            }
            throw new Error(`Invalid JSON in query parameters: ${error.message}. Processed value: "${processed}"`);
        }

        try {
            const fetch = (await import('node-fetch')).default;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            // Build URL with query parameters
            const urlObj = new URL(url);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    urlObj.searchParams.append(key, String(value));
                }
            });

            const response = await fetch(urlObj.toString(), {
                method: 'GET',
                headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            let responseData = await response.text();
            
            // Try to parse JSON responses
            let parsedResponse = responseData;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try {
                    parsedResponse = JSON.parse(responseData);
                } catch (parseError) {
                    console.warn('Failed to parse JSON response:', parseError.message);
                    // Keep as string if JSON parsing fails
                }
            }
            
            return {
                type: 'apiGet',
                url: urlObj.toString(),
                method: 'GET',
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                response: parsedResponse,
                rawResponse: responseData.substring(0, 1000), // Keep truncated raw text for debugging
                success: response.ok
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`API GET request timed out after ${timeout/1000} seconds`);
            }
            throw new Error(`API GET request failed: ${error.message}`);
        }
    }

    async handleSlackOutputNode(node, context) {
        const data = node.data || {};
        const webhookUrl = data.webhookUrl;
        let message = data.message;
        const channel = data.channel;
        const username = data.username || 'Workflow Bot';
        const iconEmoji = data.iconEmoji || ':robot_face:';

        if (!webhookUrl) {
            throw new Error('Slack webhook URL not specified');
        }

        if (!message) {
            throw new Error('Slack message not specified');
        }

        // Process placeholders in message
        message = this.processPlaceholders(message, context);

        try {
            const fetch = (await import('node-fetch')).default;
            
            const payload = {
                text: message,
                username,
                icon_emoji: iconEmoji
            };

            if (channel) {
                payload.channel = channel;
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            
            return {
                type: 'slackOutput',
                status: response.status,
                statusText: response.statusText,
                message: message,
                channel: channel || 'default',
                username,
                response: responseText,
                success: response.ok
            };
        } catch (error) {
            throw new Error(`Slack message failed: ${error.message}`);
        }
    }

    async handleScreenOutputNode(node, context) {
        const data = node.data || {};
        let message = data.message;
        const title = data.title || 'Screen Output';
        const format = data.format || 'text';
        const level = data.level || 'info';
        const includeTimestamp = data.includeTimestamp || false;

        if (!message) {
            throw new Error('Screen output message not specified');
        }

        // Process placeholders in message and title
        message = this.processPlaceholders(message, context);
        const processedTitle = this.processPlaceholders(title, context);

        // Format the message based on the specified format
        let formattedMessage = message;
        try {
            switch (format) {
                case 'json':
                    if (typeof message === 'object') {
                        formattedMessage = JSON.stringify(message, null, 2);
                    } else {
                        // Try to parse as JSON if it's a string
                        const parsed = JSON.parse(message);
                        formattedMessage = JSON.stringify(parsed, null, 2);
                    }
                    break;
                case 'table':
                    // Simple table formatting for objects
                    if (typeof message === 'object') {
                        if (Array.isArray(message)) {
                            formattedMessage = this.formatAsTable(message);
                        } else {
                            formattedMessage = this.formatAsTable([message]);
                        }
                    }
                    break;
                case 'markdown':
                case 'text':
                default:
                    formattedMessage = String(message);
                    break;
            }
        } catch (error) {
            // If formatting fails, use original message
            formattedMessage = String(message);
        }

        // Create the output object
        const output = {
            type: 'screenOutput',
            title: processedTitle,
            message: formattedMessage,
            originalMessage: message,
            format,
            level,
            timestamp: includeTimestamp ? new Date().toISOString() : null,
            display: {
                console: true,
                execution_log: true
            }
        };

        // Log to console with appropriate level
        const logPrefix = `[${processedTitle}]`;
        switch (level) {
            case 'error':
                console.error(logPrefix, formattedMessage);
                break;
            case 'warning':
                console.warn(logPrefix, formattedMessage);
                break;
            case 'success':
                console.log(`✅ ${logPrefix}`, formattedMessage);
                break;
            case 'info':
            default:
                console.log(logPrefix, formattedMessage);
                break;
        }

        return output;
    }

    // Helper method to format arrays as simple tables
    formatAsTable(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return 'No data to display';
        }

        // Get all unique keys from all objects
        const allKeys = [...new Set(data.flatMap(obj => typeof obj === 'object' ? Object.keys(obj) : []))];
        
        if (allKeys.length === 0) {
            return data.map(item => String(item)).join('\n');
        }

        // Create header
        const header = allKeys.join(' | ');
        const separator = allKeys.map(() => '---').join(' | ');
        
        // Create rows
        const rows = data.map(item => {
            if (typeof item !== 'object') {
                return String(item);
            }
            return allKeys.map(key => String(item[key] || '')).join(' | ');
        });

        return [header, separator, ...rows].join('\n');
    }

    async handleTransformNode(node, context) {
        const data = node.data || {};
        let inputData = data.inputData || '{{previous}}';
        const transformType = data.transformType || 'jq';
        const expression = data.expression || '.';
        const outputVariable = data.outputVariable || 'transformed';

        // Process the input data placeholder
        const processedInput = this.processPlaceholders(inputData, context);

        let parsedInput;
        try {
            // If processedInput is already an object, use it directly
            // Only try to parse as JSON if it's actually a string that looks like JSON
            if (typeof processedInput === 'string' && (processedInput.trim().startsWith('{') || processedInput.trim().startsWith('['))) {
                try {
                    parsedInput = JSON.parse(processedInput);
                } catch {
                    // If JSON parsing fails, use as-is
                    parsedInput = processedInput;
                }
            } else {
                // Use the input as-is (could be an object, number, boolean, etc.)
                parsedInput = processedInput;
            }
        } catch (error) {
            throw new Error(`Failed to parse input data: ${error.message}`);
        }

        let result;

        try {
            switch (transformType) {
                case 'jq':
                    result = this.applyJQTransform(parsedInput, expression);
                    break;
                case 'jsonpath':
                    result = this.applyJSONPathTransform(parsedInput, expression);
                    break;
                case 'javascript':
                    result = this.applyJavaScriptTransform(parsedInput, expression);
                    break;
                case 'template':
                    result = this.applyTemplateTransform(parsedInput, expression, context);
                    break;
                default:
                    throw new Error(`Unsupported transform type: ${transformType}`);
            }
        } catch (error) {
            throw new Error(`Transform failed: ${error.message}`);
        }

        const output = {
            type: 'transform',
            transformType,
            expression,
            inputData: parsedInput,
            outputVariable,
            result // Also include in result for backward compatibility
        };
        
        // Set the output variable
        output[outputVariable] = result;
        
        return output;
    }

    // JQ-like transformations using JavaScript
    applyJQTransform(data, expression) {
        console.log('🔧 Applying jq transform:', expression, 'to:', data);
        
        try {
            // Simple jq-like operations
            switch (expression.trim()) {
                case '.':
                    return data;
                case 'keys':
                case '.keys':
                    if (typeof data === 'object' && data !== null) {
                        return Array.isArray(data) ? 
                            data.map((_, i) => i) : 
                            Object.keys(data);
                    }
                    return [];
                case 'length':
                case '.length':
                    if (Array.isArray(data)) return data.length;
                    if (typeof data === 'object' && data !== null) return Object.keys(data).length;
                    if (typeof data === 'string') return data.length;
                    return 0;
                case 'type':
                case '.type':
                    if (data === null) return 'null';
                    if (Array.isArray(data)) return 'array';
                    return typeof data;
                case 'reverse':
                case '.reverse':
                    if (Array.isArray(data)) return [...data].reverse();
                    return data;
                case 'sort':
                case '.sort':
                    if (Array.isArray(data)) return [...data].sort();
                    return data;
                default:
                    // Handle pipe operations like .field | length
                    if (expression.includes('|')) {
                        return this.applyPipeTransform(data, expression);
                    }
                    // Handle array operations like .[0] or .field[0]
                    if (expression.includes('[') && expression.includes(']')) {
                        return this.getArrayProperty(data, expression);
                    }
                    // Handle property access like .field or .field.subfield
                    if (expression.startsWith('.')) {
                        return this.getNestedProperty(data, expression.substring(1));
                    }
                    // Handle array element access like .users[] or .users[].name
                    if (expression.includes('[]')) {
                        const parts = expression.split('[]');
                        if (parts.length === 2) {
                            const arrayPath = parts[0].substring(1); // Remove leading dot
                            const propertyAfter = parts[1];
                            
                            const arrayData = arrayPath ? this.getNestedProperty(data, arrayPath) : data;
                            if (Array.isArray(arrayData)) {
                                if (propertyAfter.startsWith('.')) {
                                    // Extract property from each element: .users[].name
                                    const propName = propertyAfter.substring(1);
                                    return arrayData.map(item => this.getNestedProperty(item, propName));
                                } else {
                                    // Just return the array: .users[]
                                    return arrayData;
                                }
                            }
                        }
                        return undefined;
                    }
                    throw new Error(`Unsupported jq expression: ${expression}`);
            }
        } catch (error) {
            throw new Error(`JQ transform error: ${error.message}`);
        }
    }

    // JSONPath transformations (simplified)
    applyJSONPathTransform(data, path) {
        console.log('🔧 Applying JSONPath transform:', path, 'to:', data);
        
        // Simple JSONPath support
        if (path === '$') return data;
        if (path.startsWith('$.')) {
            return this.getNestedProperty(data, path.substring(2));
        }
        
        throw new Error(`Unsupported JSONPath expression: ${path}`);
    }

    // JavaScript transformations (sandboxed)
    applyJavaScriptTransform(data, code) {
        console.log('🔧 Applying JavaScript transform:', code, 'to:', data);
        
        try {
            // Create a safe context
            const context = {
                data,
                JSON,
                Math,
                Object,
                Array,
                String,
                Number,
                Boolean,
                console: {
                    log: (...args) => console.log('Transform JS:', ...args)
                }
            };
            
            // Simple evaluation - in production, use a proper sandbox
            const func = new Function('context', `
                with(context) {
                    const data = context.data;
                    return (${code});
                }
            `);
            
            return func(context);
        } catch (error) {
            throw new Error(`JavaScript transform error: ${error.message}`);
        }
    }

    // Template transformations
    applyTemplateTransform(data, template, workflowContext) {
        // Create enhanced context with the data
        const enhancedContext = {
            ...workflowContext,
            data,
            transform: { input: data }
        };
        
        return this.processPlaceholders(template, enhancedContext);
    }

    // Helper to get nested properties
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    // Helper to get array properties
    getArrayProperty(obj, expression) {
        const match = expression.match(/^\.?([^[]*)\[(\d+)\](.*)$/);
        if (!match) throw new Error(`Invalid array expression: ${expression}`);
        
        const [, path, index, remaining] = match;
        let current = path ? this.getNestedProperty(obj, path) : obj;
        
        if (!Array.isArray(current)) {
            throw new Error(`Property is not an array: ${path || 'root'}`);
        }
        
        current = current[parseInt(index)];
        
        if (remaining) {
            return this.getNestedProperty(current, remaining.substring(1));
        }
        
        return current;
    }

    // Helper for pipe operations
    applyPipeTransform(data, expression) {
        const parts = expression.split('|').map(p => p.trim());
        let result = data;
        
        for (const part of parts) {
            result = this.applyJQTransform(result, part);
        }
        
        return result;
    }

    // Helper method to process placeholders in strings
    processPlaceholders(template, context) {
        if (typeof template !== 'string') {
            return template;
        }

        // Build comprehensive variable context
        const variables = this.buildVariableContext(context);

        // First, check for malformed brackets and provide helpful error
        if (template.includes('{{{') || template.includes('}}}')) {
            console.warn(`Found malformed variable brackets in: ${template}`);
            console.warn(`Use {{variable}} not {{{variable}}}`);
        }

        // Special case: if the entire template is a single variable, return the raw value
        const singleVarMatch = template.trim().match(/^{{([^}]+)}}$/);
        if (singleVarMatch) {
            const path = singleVarMatch[1].trim();
            const resolved = this.resolveVariablePath(path, variables, context);
            return resolved !== null && resolved !== undefined ? resolved : template;
        }

        // Process all types of placeholders
        const result = template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            try {
                // Handle different variable patterns
                const resolved = this.resolveVariablePath(path.trim(), variables, context);
                
                // If resolved value is null or undefined, keep the placeholder
                if (resolved === null || resolved === undefined) {
                    console.warn(`Variable ${path.trim()} resolved to null/undefined, keeping placeholder`);
                    
                    // Check if this might be a common error
                    if (path.trim() === 'previous' && !context.lastExecutedNode) {
                        console.warn(`Hint: {{previous}} is null because no previous step has been executed yet`);
                    }
                    
                    return match;
                }
                
                // Smart JSON value formatting
                return this.formatValueForJSON(resolved, template, match);
            } catch (error) {
                console.warn(`Variable resolution failed for ${path}:`, error.message);
                
                // Provide hints for common issues
                if (path.includes('.') && !path.startsWith('env.') && !path.startsWith('context.')) {
                    console.warn(`Hint: For step outputs, try {{steps.stepName.property}} or {{results.nodeId.property}}`);
                }
                
                return match;
            }
        });

        return result;
    }

    // Smart JSON value formatter
    formatValueForJSON(value, template, placeholder) {
        // If the template looks like JSON (contains braces and quotes)
        const isJSONContext = template.includes('{') && template.includes('"');
        
        if (!isJSONContext) {
            // Not JSON context, just return as string
            return String(value);
        }

        // Check if the placeholder is in a JSON string value position
        // Look for patterns like "key": "{{variable}}" or "{{variable}}"
        const beforePlaceholder = template.substring(0, template.indexOf(placeholder));
        const afterPlaceholder = template.substring(template.indexOf(placeholder) + placeholder.length);
        
        // More robust detection: check if we're between quotes
        // Pattern: "some text {{variable}} more text"
        const lastQuote = beforePlaceholder.lastIndexOf('"');
        const nextQuote = afterPlaceholder.indexOf('"');
        const lastColon = beforePlaceholder.lastIndexOf(':');
        const lastOpenBrace = beforePlaceholder.lastIndexOf('{');
        
        // We're in a string value if:
        // 1. There's a quote before the placeholder
        // 2. There's a quote after the placeholder  
        // 3. The quote before is after the last colon
        // 4. OR we're directly inside quotes like "{{var}}"
        const isDirectlyQuoted = beforePlaceholder.endsWith('"') && afterPlaceholder.startsWith('"');
        const isInQuotedString = lastQuote > Math.max(lastColon, lastOpenBrace) && nextQuote !== -1;
        
        if (isDirectlyQuoted || isInQuotedString) {
            // We're in a JSON string value, return the raw value (quotes already present)
            return String(value);
        } else {
            // We're in a JSON property value position, need to format appropriately
            if (typeof value === 'string') {
                // String values need quotes in JSON
                return `"${value.replace(/"/g, '\\"')}"`;
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                // Numbers and booleans don't need quotes
                return String(value);
            } else if (typeof value === 'object') {
                // Objects should be stringified
                return JSON.stringify(value);
            } else {
                // Default to quoted string
                return `"${String(value).replace(/"/g, '\\"')}"`;
            }
        }
    }

    async handleUserInputNode(node, context) {
        const data = node.data || {};
        const fields = data.fields || [];
        const title = data.title || 'User Input Required';
        const description = data.description || '';
        
        console.log('🔧 User Input Node - Raw data:', JSON.stringify(data, null, 2));
        console.log('🔧 User Input Node - Fields:', fields.length);

        // Check if we have input data from the form submission
        const userInputData = context.inputData?.userInput || context.userInput;
        
        if (userInputData) {
            // We have user input, process it
            console.log('🔧 User Input Node - Received input:', userInputData);
            
            // Validate required fields
            const errors = [];
            fields.forEach(field => {
                if (field.required && (!userInputData[field.name] || userInputData[field.name].trim() === '')) {
                    errors.push(`${field.label || field.name} is required`);
                }
            });
            
            if (errors.length > 0) {
                throw new Error(`Validation failed: ${errors.join(', ')}`);
            }
            
            // Return the user input data
            return {
                type: 'userInput',
                title,
                description,
                fields,
                userInput: userInputData,
                ...userInputData // Make each field available as a top-level property
            };
        } else {
            // No user input yet - this should trigger the modal
            // This is handled by the frontend when it detects a userInput node
            const error = new Error('USER_INPUT_REQUIRED');
            error.userInputRequired = {
                nodeId: node.id,
                title,
                description,
                fields
            };
            throw error;
        }
    }

    // Check if workflow requires user input before starting execution
    async checkUserInputRequirements(workflow, execution, inputData) {
        const definition = workflow.definition;
        if (!definition || !definition.nodes) {
            return; // No nodes to check
        }

        // Find all user input nodes
        const userInputNodes = definition.nodes.filter(node => node.type === 'userInput');
        
        if (userInputNodes.length === 0) {
            return; // No user input nodes
        }

        console.log(`🔍 Found ${userInputNodes.length} user input node(s), checking requirements...`);

        // Check each user input node
        for (const node of userInputNodes) {
            const data = node.data || {};
            const fields = data.fields || [];
            const title = data.title || 'User Input Required';
            const description = data.description || '';
            
            // Check if we have input data for this node
            const userInputData = inputData?.userInput;
            
            console.log(`🔧 Debug - Node ${node.id}:`, {
                inputData,
                userInputData,
                userInputDataType: typeof userInputData,
                userInputDataKeys: userInputData ? Object.keys(userInputData) : 'N/A',
                isUndefined: userInputData === undefined,
                isNull: userInputData === null,
                isEmpty: userInputData && Object.keys(userInputData).length === 0
            });
            
            // More explicit check - if userInput is missing or empty, require input
            if (!userInputData || userInputData === null || userInputData === undefined || 
                (typeof userInputData === 'object' && Object.keys(userInputData).length === 0)) {
                // No user input provided - throw error for frontend to handle
                const error = new Error('USER_INPUT_REQUIRED');
                error.userInputRequired = {
                    nodeId: node.id,
                    title,
                    description,
                    fields
                };
                console.log(`❌ User input required for node ${node.id}: ${title}`);
                throw error;
            }
            
            // Validate required fields if input data is provided
            const errors = [];
            fields.forEach(field => {
                if (field.required && (!userInputData[field.name] || userInputData[field.name].trim() === '')) {
                    errors.push(`${field.label || field.name} is required`);
                }
            });
            
            if (errors.length > 0) {
                const error = new Error('USER_INPUT_REQUIRED');
                error.userInputRequired = {
                    nodeId: node.id,
                    title,
                    description,
                    fields,
                    validationErrors: errors
                };
                console.log(`❌ User input validation failed for node ${node.id}: ${errors.join(', ')}`);
                throw error;
            }
            
            console.log(`✅ User input validated for node ${node.id}: ${title}`);
        }
        
        console.log(`✅ All user input requirements satisfied`);
    }

    // Build comprehensive variable context
    buildVariableContext(context) {
        // Get the previous step result from the lastExecutedNode tracked in context
        const previousStepResult = context.lastExecutedNode && context.results[context.lastExecutedNode] 
            ? context.results[context.lastExecutedNode] 
            : null;

        // Building variable context for template processing

        return {
            input: context.inputData || {},
            previous: previousStepResult,  // Don't default to empty object
            results: context.results || {},
            context: {
                executionId: context.executionId,
                workflowId: context.workflowId,
                userId: context.userId,
                timestamp: new Date().toISOString(),
                stepIndex: Object.keys(context.results || {}).length
            },
            env: process.env,
            steps: this.buildStepsContext(context)
        };
    }

    // Build steps context with friendly names
    buildStepsContext(context) {
        const stepsContext = {};
        
        if (context.workflow && context.workflow.definition && context.workflow.definition.nodes) {
            context.workflow.definition.nodes.forEach(node => {
                if (context.results[node.id]) {
                    const stepName = (node.data?.label || `step_${node.id.substring(0, 8)}`)
                        .replace(/\s+/g, '_')
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, '');
                    
                    const nodeResult = context.results[node.id];
                    
                    // Create step context with correct property mapping
                    const stepContext = { ...nodeResult };
                    
                    // Smart result mapping based on node type
                    if (node.type === 'transform') {
                        // For transform nodes, 'result' should be the actual transformed data
                        stepContext.result = nodeResult.result || nodeResult[nodeResult.outputVariable] || nodeResult;
                    } else {
                        // For other nodes, 'result' is the entire node result
                        stepContext.result = nodeResult;
                    }
                    
                    // For API nodes, ensure 'response' property is easily accessible
                    if (node.type === 'apiGet' || node.type === 'apiPost') {
                        stepContext.response = nodeResult.response;
                    }
                    
                    stepsContext[stepName] = stepContext;
                }
            });
        }
        
        return stepsContext;
    }

    // Resolve variable path with dot notation support
    resolveVariablePath(path, variables, context) {
        const parts = path.split('.');
        
        // Handle single-part paths like {{previous}}, {{input}}, etc.
        if (parts.length === 1) {
            const singlePart = parts[0];
            switch (singlePart) {
                case 'previous':
                    // Smart handling for transform nodes - return the actual result instead of metadata
                    if (variables.previous && variables.previous.type === 'transform') {
                        return variables.previous.result || variables.previous[variables.previous.outputVariable] || variables.previous;
                    }
                    
                    return variables.previous;
                case 'input':
                    return variables.input;
                case 'results':
                    return variables.results;
                case 'steps':
                    return variables.steps;
                case 'context':
                    return variables.context;
                case 'env':
                    return variables.env;
                default:
                    // Check if it's a direct variable
                    if (variables.hasOwnProperty(singlePart)) {
                        return variables[singlePart];
                    }
                    return null;
            }
        }
        
        if (parts.length < 2) {
            return null;
        }

        const [source, ...pathParts] = parts;
        
        // Get the base object
        let value;
        switch (source) {
            case 'input':
                value = variables.input;
                break;
            case 'previous':
                value = variables.previous;
                break;
            case 'results':
                // Handle results.nodeId.property pattern
                if (pathParts.length >= 2) {
                    const nodeId = pathParts[0];
                    value = variables.results[nodeId];
                    pathParts.shift(); // Remove nodeId from path
                }
                break;
            case 'steps':
                // Handle steps.stepName.property pattern
                if (pathParts.length >= 2) {
                    const stepName = pathParts[0];
                    value = variables.steps[stepName];
                    pathParts.shift(); // Remove stepName from path
                }
                break;
            case 'context':
                value = variables.context;
                break;
            case 'env':
                value = variables.env;
                break;
            default:
                return null;
        }

        // Traverse the remaining path
        for (const part of pathParts) {
            if (value === null || value === undefined) {
                return null;
            }
            
            // Handle array indices
            if (Array.isArray(value) && /^\d+$/.test(part)) {
                value = value[parseInt(part, 10)];
            } else if (typeof value === 'object') {
                value = value[part];
            } else {
                return null;
            }
        }

        // Convert non-primitive values to JSON for template insertion
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }

        return String(value);
    }

    async handleScriptNode(node, context) {
        const data = node.data || {};
        const scriptType = data.scriptType || 'javascript';
        const code = data.code || data.script || '';
        
        if (!code) {
            throw new Error('Script code not specified');
        }

        console.log(`🔧 Executing ${scriptType} script:`, code.substring(0, 100) + '...');

        try {
            // Use the sandbox for script execution
            const dockerAvailable = await this.sandbox.checkDockerAvailable();
            
            if (dockerAvailable) {
                const result = await this.sandbox.executeInSandbox(scriptType, code, {
                    results: context.results,
                    input: context.inputData,
                    previous: context.results[context.lastExecutedNode] || null
                });
                
                return {
                    type: 'script',
                    scriptType,
                    code: code.substring(0, 200), // Truncated for logging
                    stdout: result.stdout,
                    stderr: result.stderr,
                    exitCode: result.exitCode,
                    executionTime: result.executionTime,
                    sandboxed: true
                };
            } else {
                // Fallback: basic JavaScript execution (no Docker)
                if (scriptType === 'javascript') {
                    const variables = this.buildVariableContext(context);
                    
                    // Create a safe execution environment
                    const sandbox = {
                        console: {
                            log: (...args) => console.log('Script:', ...args)
                        },
                        JSON,
                        Math,
                        Object,
                        Array,
                        String,
                        Number,
                        Boolean,
                        Date,
                        // Provide workflow context
                        input: variables.input,
                        previous: variables.previous,
                        results: variables.results,
                        context: variables.context
                    };
                    
                    // Execute the script in a limited context
                    const func = new Function('sandbox', `
                        with(sandbox) {
                            return (function() {
                                ${code}
                            })();
                        }
                    `);
                    
                    const result = func(sandbox);
                    
                    return {
                        type: 'script',
                        scriptType,
                        code: code.substring(0, 200),
                        result: result,
                        sandboxed: false,
                        warning: 'Script executed without Docker sandboxing'
                    };
                } else {
                    throw new Error(`Script type '${scriptType}' requires Docker sandboxing`);
                }
            }
        } catch (error) {
            throw new Error(`Script execution failed: ${error.message}`);
        }
    }

}

module.exports = WorkflowEngine;