const { OpenAI } = require('openai');
const axios = require('axios');
const { query } = require('../utils/database');
const llmService = require('./llmService');
const fs = require('fs');
const path = require('path');

class NodeGeneratorService {
    constructor() {
        this.llmProvider = process.env.LLM_PROVIDER || 'mock'; // 'openai', 'claude', 'ollama', 'mock'
        
        // OpenAI configuration
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'demo-key',
        });
        
        // Ollama configuration
        this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.ollamaModel = process.env.OLLAMA_MODEL || 'llama2';
        
        // Claude configuration
        this.claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
        
        // Node templates for consistency
        this.nodeTemplates = {
            basic: {
                nodeDefinition: {
                    type: "custom",
                    resizable: true,
                    draggable: true,
                    selectable: true
                },
                uiConfig: {
                    formFields: [],
                    layout: "vertical",
                    styling: {
                        backgroundColor: "#1a1a1a",
                        borderColor: "#404040",
                        textColor: "#ffffff"
                    }
                },
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                },
                outputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        };
    }

    loadSuperPrompts() {
        const promptsPath = path.join(__dirname, '../config/prompts.json');
        
        // Default prompts if file doesn't exist
        const defaultPrompts = {
            nodeGeneration: {
                system: `You are an expert workflow node generator. Create complete, functional workflow nodes based on user requests.

CRITICAL: Return ONLY valid JSON. Do not include any explanations, comments, or text outside the JSON object.

OUTPUT FORMAT (JSON ONLY):
{
  "name": "Node Name",
  "description": "Clear description of what this node does",
  "category": "Infrastructure|Data|Communication|Custom",
  "icon": "icon-name",
  "nodeDefinition": {
    "type": "custom",
    "resizable": true,
    "draggable": true
  },
  "uiConfig": {
    "formFields": [
      {
        "name": "fieldName",
        "type": "text|number|select|textarea|file|toggle",
        "label": "Field Label",
        "required": true,
        "placeholder": "Placeholder text",
        "options": ["opt1", "opt2"]
      }
    ]
  },
  "config": {
    "fields": [
      {
        "name": "configParam",
        "type": "text|number|select|textarea|toggle|file",
        "label": "Configuration Parameter",
        "description": "Description of what this parameter does",
        "defaultValue": "default_value",
        "required": false,
        "options": ["option1", "option2"],
        "placeholder": "Supports variables like {{previous}}, {{input}}, {{env.NODE_ENV}}"
      }
    ],
    "description": "Configuration options that can be set in the workflow editor. Text fields support variable placeholders."
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "fieldName": {
        "type": "string|number|boolean|object|array",
        "description": "Field description"
      }
    },
    "required": ["requiredField"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "object", "description": "Operation result" },
      "status": { "type": "string", "description": "Execution status" }
    }
  },
  "executionCode": "// JavaScript execution code\\nconst executeNode = async (inputs, context, config) => {\\n  // Access config: config.configParam\\n  // Implementation\\n  return { result: inputs, status: 'success' };\\n};"
}

REQUIREMENTS:
1. Generate nodes that follow established patterns
2. Include comprehensive input/output schemas  
3. Create user-friendly form configurations
4. Write secure, sandboxed execution code
5. Ensure proper error handling
6. Support variable placeholders in config fields
7. Return ONLY JSON - no explanations or comments

VARIABLE SUPPORT:
- Text and textarea fields automatically support variables like {{previous}}, {{input}}, {{env.VAR}}
- Use placeholder text to show users they can use variables
- Variables are processed at runtime before execution
- Common variables: {{previous}} (previous step output), {{input}} (workflow input), {{env.NODE_ENV}} (environment)

EXECUTION CODE CONSTRAINTS:
- The code runs in a restricted sandbox environment
- Only console.log() and console.error() are available (no console.info, console.warn, etc.)
- No access to: process, global, Buffer, require, setTimeout, setInterval
- No file system or network access
- Must use async/await for asynchronous operations
- Always return a plain object (will be JSON serialized)
- Handle all errors with try/catch blocks
- Do not use external dependencies or libraries

EXAMPLE EXECUTION CODE:
const executeNode = async (inputs, context, config) => {
  try {
    // Access configuration values from the UI
    // Variables in config are already processed ({{previous}} -> actual values)
    const { configParam } = inputs; // Already contains processed variables
    
    console.log('Processing with config:', configParam);
    
    // Return plain objects only
    return {
      success: true,
      result: 'your result',
      data: { /* your data */ }
    };
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error(\`Execution failed: \${error.message}\`);
  }
};`,
                
                user: `Create a workflow node for: "{request}"

Make it production-ready with:
1. Intuitive user interface
2. Comprehensive input validation
3. Clear error messages
4. Helpful documentation
5. Consistent with platform patterns

Focus on usability and reliability. Return only the JSON object.`
            }
        };

        try {
            if (fs.existsSync(promptsPath)) {
                return JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
            } else {
                // Create config directory if it doesn't exist
                const configDir = path.dirname(promptsPath);
                if (!fs.existsSync(configDir)) {
                    fs.mkdirSync(configDir, { recursive: true });
                }
                // Save default prompts
                fs.writeFileSync(promptsPath, JSON.stringify(defaultPrompts, null, 2));
                return defaultPrompts;
            }
        } catch (error) {
            console.error('Failed to load super prompts, using defaults:', error);
            return defaultPrompts;
        }
    }

    async generateNode(userRequest, userId, existingNodes = []) {
        try {
            // SECURITY FIX: Validate and sanitize input
            if (!userRequest || typeof userRequest !== 'string') {
                throw new Error('Invalid user request');
            }

            if (!userId || typeof userId !== 'string') {
                throw new Error('Invalid user ID');
            }

            // Sanitize request - remove potentially dangerous content
            const sanitizedRequest = this.sanitizeUserRequest(userRequest);
            
            // Check request length
            if (sanitizedRequest.length > 5000) {
                throw new Error('Request too long (maximum 5000 characters)');
            }

            // Load super prompts
            const prompts = this.loadSuperPrompts();
            const systemPrompt = prompts.nodeGeneration.system;
            const userPrompt = prompts.nodeGeneration.user.replace('{request}', sanitizedRequest);

            console.log(`🤖 Generating node using ${this.llmProvider} for request:`, sanitizedRequest);

            let generatedContent;

            // Use centralized LLM service
            if (llmService.isConfigured()) {
                generatedContent = await llmService.generateCompletion(userPrompt, {
                    systemPrompt,
                    temperature: 0.3,
                    maxTokens: 2000
                });
            } else {
                console.log('📝 LLM not configured, using mock response');
                return this.generateMockNode(sanitizedRequest, userId);
            }

            const nodeData = this.parseGeneratedNode(generatedContent);
            console.log('🔍 Raw parsed node data config:', JSON.stringify(nodeData.config, null, 2));
            const validatedNodeData = this.validateNodeData(nodeData);
            console.log('🔍 Validated node data config:', JSON.stringify(validatedNodeData.config, null, 2));
            return await this.saveGeneratedNode(validatedNodeData, userId);
        } catch (error) {
            console.error('❌ Node generation failed:', error);
            throw new Error(`Failed to generate node: ${error.message}`);
        }
    }

    sanitizeUserRequest(request) {
        // Remove potentially dangerous patterns
        let sanitized = request
            .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/data:/gi, '') // Remove data: protocol
            .replace(/eval\s*\(/gi, '') // Remove eval calls
            .replace(/Function\s*\(/gi, '') // Remove Function constructor
            .replace(/require\s*\(/gi, '') // Remove require calls
            .replace(/import\s+/gi, '') // Remove import statements
            .trim();

        return sanitized;
    }

    validateNodeData(nodeData) {
        // Handle both camelCase and snake_case field names
        const executionCode = nodeData.executionCode || nodeData.execution_code;
        const inputSchema = nodeData.inputSchema || nodeData.input_schema;
        const outputSchema = nodeData.outputSchema || nodeData.output_schema;
        const nodeDefinition = nodeData.nodeDefinition || nodeData.node_definition;
        const uiConfig = nodeData.uiConfig || nodeData.ui_config;
        const config = nodeData.config || {};

        // Validate required fields
        const requiredFields = [
            { key: 'name', value: nodeData.name },
            { key: 'description', value: nodeData.description },
            { key: 'category', value: nodeData.category },
            { key: 'executionCode', value: executionCode },
            { key: 'inputSchema', value: inputSchema },
            { key: 'outputSchema', value: outputSchema }
        ];

        for (const field of requiredFields) {
            if (!field.value) {
                throw new Error(`Missing required field: ${field.key}`);
            }
        }

        // Validate and sanitize execution code
        const sanitizedCode = this.sanitizeExecutionCode(executionCode);
        
        return {
            name: this.sanitizeString(nodeData.name, 255),
            description: this.sanitizeString(nodeData.description, 1000),
            category: this.sanitizeString(nodeData.category, 100),
            icon: nodeData.icon || 'box',
            nodeDefinition: nodeDefinition || { type: 'custom', resizable: true, draggable: true },
            uiConfig: uiConfig || { formFields: [] },
            config: config || { fields: [], description: 'No configuration required' },
            executionCode: sanitizedCode,
            inputSchema: inputSchema,
            outputSchema: outputSchema
        };
    }

    sanitizeExecutionCode(code) {
        // Check for dangerous patterns in execution code
        const dangerousPatterns = [
            /require\s*\(/g,
            /import\s+/g,
            /eval\s*\(/g,
            /Function\s*\(/g,
            /process\.exit/g,
            /child_process/g,
            /fs\.writeFile/g,
            /fs\.unlink/g,
            /fs\.rmdir/g,
            /exec\s*\(/g,
            /spawn\s*\(/g,
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(code)) {
                console.warn(`Dangerous pattern detected in execution code: ${pattern}`);
                // Replace with safe comment
                code = code.replace(pattern, '// REMOVED_UNSAFE_OPERATION');
            }
        }

        return code;
    }

    sanitizeString(str, maxLength) {
        if (typeof str !== 'string') {
            return '';
        }
        
        return str
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[<>'"&]/g, '') // Remove dangerous characters
            .trim()
            .substring(0, maxLength);
    }

    async generateWithOpenAI(systemPrompt, userPrompt) {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
            throw new Error('OpenAI API key not configured');
        }

        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        return completion.choices[0].message.content;
    }

    async generateWithClaude(systemPrompt, userPrompt) {
        if (!this.claudeApiKey) {
            throw new Error('Claude API key not configured');
        }

        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-sonnet-20240229',
            max_tokens: 2000,
            temperature: 0.3,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.claudeApiKey,
                'anthropic-version': '2023-06-01'
            }
        });

        return response.data.content[0].text;
    }

    async generateWithOllama(systemPrompt, userPrompt) {
        try {
            const response = await axios.post(`${this.ollamaBaseUrl}/api/chat`, {
                model: this.ollamaModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                stream: false,
                options: {
                    temperature: 0.3,
                    top_p: 0.9
                }
            });

            return response.data.message.content;
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Ollama server not running. Please start Ollama with: ollama serve');
            }
            throw error;
        }
    }

    buildSystemPrompt(existingNodes) {
        return `You are an expert workflow node generator. Create complete, functional workflow nodes based on user requests.

EXISTING NODE PATTERNS:
${existingNodes.map(node => `- ${node.name}: ${node.description}`).join('\n')}

REQUIREMENTS:
1. Generate nodes that follow established patterns
2. Include comprehensive input/output schemas
3. Create user-friendly form configurations
4. Write secure, sandboxed execution code
5. Ensure proper error handling

OUTPUT FORMAT (JSON):
{
  "name": "Node Name",
  "description": "Clear description of what this node does",
  "category": "Infrastructure|Data|Communication|Custom",
  "icon": "icon-name",
  "nodeDefinition": {
    "type": "custom",
    "resizable": true,
    "draggable": true
  },
  "uiConfig": {
    "formFields": [
      {
        "name": "fieldName",
        "type": "text|number|select|textarea|file|toggle",
        "label": "Field Label",
        "required": true,
        "placeholder": "Placeholder text",
        "options": ["opt1", "opt2"] // for select type
      }
    ]
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "fieldName": {
        "type": "string|number|boolean|object|array",
        "description": "Field description"
      }
    },
    "required": ["requiredField"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "object", "description": "Operation result" },
      "status": { "type": "string", "description": "Execution status" }
    }
  },
  "executionCode": "// JavaScript execution code\\nconst executeNode = async (inputs, context) => {\\n  // Implementation\\n  return { result: inputs, status: 'success' };\\n};"
}

SECURITY RULES:
- No file system access outside sandbox
- No network calls without explicit permission
- All inputs must be validated
- Include proper error handling`;
    }

    buildUserPrompt(userRequest) {
        return `Create a workflow node for: "${userRequest}"

Make it production-ready with:
1. Intuitive user interface
2. Comprehensive input validation
3. Clear error messages
4. Helpful documentation
5. Consistent with platform patterns

Focus on usability and reliability.`;
    }

    generateMockNode(userRequest, userId) {
        // Generate a mock node based on common patterns
        const nodeName = this.extractNodeName(userRequest);
        const category = this.extractCategory(userRequest);
        
        const mockNode = {
            name: nodeName,
            description: `Auto-generated node for ${userRequest}`,
            category: category,
            icon: this.getIconForCategory(category),
            nodeDefinition: {
                type: "custom",
                resizable: true,
                draggable: true,
                selectable: true
            },
            uiConfig: {
                formFields: this.generateMockFields(userRequest),
                layout: "vertical"
            },
            inputSchema: this.generateMockInputSchema(userRequest),
            outputSchema: {
                type: "object",
                properties: {
                    result: { type: "object", description: "Operation result" },
                    status: { type: "string", description: "Execution status" },
                    message: { type: "string", description: "Status message" }
                }
            },
            executionCode: this.generateMockExecutionCode(userRequest)
        };

        return this.saveGeneratedNode(mockNode, userId);
    }

    extractNodeName(userRequest) {
        const request = userRequest.toLowerCase();
        if (request.includes('terraform')) return 'Terraform Manager';
        if (request.includes('docker')) return 'Docker Controller';
        if (request.includes('database')) return 'Database Manager';
        if (request.includes('api')) return 'API Caller';
        if (request.includes('email')) return 'Email Sender';
        if (request.includes('slack')) return 'Slack Notifier';
        if (request.includes('file')) return 'File Processor';
        if (request.includes('aws')) return 'AWS Resource Manager';
        return 'Custom Node';
    }

    extractCategory(userRequest) {
        const request = userRequest.toLowerCase();
        if (request.includes('terraform') || request.includes('aws') || request.includes('docker')) return 'Infrastructure';
        if (request.includes('database') || request.includes('file') || request.includes('data')) return 'Data';
        if (request.includes('email') || request.includes('slack') || request.includes('notification')) return 'Communication';
        return 'Custom';
    }

    getIconForCategory(category) {
        const icons = {
            'Infrastructure': 'server',
            'Data': 'database',
            'Communication': 'message-circle',
            'Custom': 'box'
        };
        return icons[category] || 'box';
    }

    generateMockFields(userRequest) {
        const request = userRequest.toLowerCase();
        const fields = [];

        // Common fields based on request type
        if (request.includes('terraform')) {
            fields.push(
                { name: 'workspace', type: 'text', label: 'Terraform Workspace', required: true },
                { name: 'action', type: 'select', label: 'Action', options: ['plan', 'apply', 'destroy'], required: true },
                { name: 'variables', type: 'textarea', label: 'Variables (JSON)', placeholder: '{"var1": "value1"}' }
            );
        } else if (request.includes('docker')) {
            fields.push(
                { name: 'image', type: 'text', label: 'Docker Image', required: true },
                { name: 'command', type: 'text', label: 'Command', placeholder: 'Optional command to run' },
                { name: 'environment', type: 'textarea', label: 'Environment Variables', placeholder: 'KEY=value' }
            );
        } else if (request.includes('api')) {
            fields.push(
                { name: 'url', type: 'text', label: 'API URL', required: true },
                { name: 'method', type: 'select', label: 'HTTP Method', options: ['GET', 'POST', 'PUT', 'DELETE'], required: true },
                { name: 'headers', type: 'textarea', label: 'Headers (JSON)', placeholder: '{"Authorization": "Bearer token"}' },
                { name: 'body', type: 'textarea', label: 'Request Body', placeholder: 'JSON payload' }
            );
        } else {
            // Generic fields
            fields.push(
                { name: 'input', type: 'text', label: 'Input', required: true },
                { name: 'options', type: 'textarea', label: 'Configuration', placeholder: 'JSON configuration' }
            );
        }

        return fields;
    }

    generateMockInputSchema(userRequest) {
        const request = userRequest.toLowerCase();
        const schema = {
            type: "object",
            properties: {},
            required: []
        };

        if (request.includes('terraform')) {
            schema.properties = {
                workspace: { type: "string", description: "Terraform workspace name" },
                action: { type: "string", enum: ["plan", "apply", "destroy"], description: "Terraform action to perform" },
                variables: { type: "object", description: "Terraform variables" }
            };
            schema.required = ["workspace", "action"];
        } else if (request.includes('api')) {
            schema.properties = {
                url: { type: "string", format: "uri", description: "API endpoint URL" },
                method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"], description: "HTTP method" },
                headers: { type: "object", description: "Request headers" },
                body: { type: "object", description: "Request body" }
            };
            schema.required = ["url", "method"];
        } else {
            schema.properties = {
                input: { type: "string", description: "Primary input" },
                options: { type: "object", description: "Configuration options" }
            };
            schema.required = ["input"];
        }

        return schema;
    }

    generateMockExecutionCode(userRequest) {
        const request = userRequest.toLowerCase();
        
        if (request.includes('terraform')) {
            return `const executeNode = async (inputs, context) => {
  const { workspace, action, variables } = inputs;
  
  try {
    // Validate inputs
    if (!workspace || !action) {
      throw new Error('Workspace and action are required');
    }
    
    // Simulate terraform execution
    const commands = [
      \`terraform workspace select \${workspace}\`,
      \`terraform \${action}\`
    ];
    
    if (variables && Object.keys(variables).length > 0) {
      const varArgs = Object.entries(variables)
        .map(([key, value]) => \`-var="\${key}=\${value}"\`)
        .join(' ');
      commands[1] += \` \${varArgs}\`;
    }
    
    context.log('info', \`Executing: \${commands.join(' && ')}\`);
    
    // Mock execution result
    const result = {
      workspace,
      action,
      resources: action === 'destroy' ? [] : ['aws_instance.web', 'aws_security_group.web'],
      output: \`Terraform \${action} completed successfully\`
    };
    
    return {
      result,
      status: 'success',
      message: \`Terraform \${action} completed for workspace \${workspace}\`
    };
  } catch (error) {
    context.log('error', \`Terraform execution failed: \${error.message}\`);
    throw error;
  }
};`;
        } else if (request.includes('api')) {
            return `const executeNode = async (inputs, context) => {
  const { url, method, headers = {}, body } = inputs;
  
  try {
    // Validate URL
    new URL(url);
    
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    context.log('info', \`Making \${method} request to \${url}\`);
    
    // Mock API response
    const response = {
      status: 200,
      statusText: 'OK',
      data: { message: 'API call successful', timestamp: new Date().toISOString() }
    };
    
    return {
      result: response,
      status: 'success',
      message: \`\${method} request to \${url} completed successfully\`
    };
  } catch (error) {
    context.log('error', \`API request failed: \${error.message}\`);
    throw error;
  }
};`;
        }
        
        return `const executeNode = async (inputs, context) => {
  const { input, options = {} } = inputs;
  
  try {
    context.log('info', \`Processing input: \${input}\`);
    
    // Process the input based on configuration
    const result = {
      input,
      processed: true,
      timestamp: new Date().toISOString(),
      ...options
    };
    
    return {
      result,
      status: 'success',
      message: 'Node executed successfully'
    };
  } catch (error) {
    context.log('error', \`Execution failed: \${error.message}\`);
    throw error;
  }
};`;
    }

    parseGeneratedNode(content) {
        try {
            console.log('📄 Parsing content length:', content.length);
            
            // Clean up the content - remove markdown code blocks if present
            let cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
            
            // Remove any leading/trailing non-JSON text
            cleanContent = cleanContent.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
            
            // Handle cases where execution code contains backticks or quotes
            cleanContent = cleanContent.replace(
                /"executionCode":\s*`([^`]*)`/g,
                (match, code) => `"executionCode": ${JSON.stringify(code)}`
            );
            
            // Extract JSON by finding first { and matching closing }
            const firstBrace = cleanContent.indexOf('{');
            if (firstBrace === -1) {
                console.error('❌ No opening brace found');
                throw new Error('No JSON object found in response');
            }
            
            // Find matching closing brace by counting - handle strings properly
            let braceCount = 0;
            let jsonEnd = -1;
            let inString = false;
            let escaped = false;
            
            for (let i = firstBrace; i < cleanContent.length; i++) {
                const char = cleanContent[i];
                
                if (escaped) {
                    escaped = false;
                    continue;
                }
                
                if (char === '\\') {
                    escaped = true;
                    continue;
                }
                
                if (char === '"') {
                    inString = !inString;
                    continue;
                }
                
                if (!inString) {
                    if (char === '{') {
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            jsonEnd = i;
                            break;
                        }
                    }
                }
            }
            
            if (jsonEnd === -1) {
                console.error('❌ No matching closing brace found');
                throw new Error('Incomplete JSON object in response');
            }
            
            let jsonStr = cleanContent.substring(firstBrace, jsonEnd + 1);
            
            // Additional cleanup for common formatting issues
            jsonStr = jsonStr
                .replace(/,\s*}/g, '}')  // Remove trailing commas before }
                .replace(/,\s*]/g, ']') // Remove trailing commas before ]
                .replace(/\n\s*\/\/[^\n]*/g, '') // Remove line comments
                .replace(/\s+/g, ' '); // Normalize whitespace
            
            console.log('🔧 Cleaned JSON length:', jsonStr.length);
            
            const parsed = JSON.parse(jsonStr);
            console.log('✅ Successfully parsed node:', parsed.name);
            
            return parsed;
        } catch (error) {
            console.error('❌ Failed to parse generated node:', error.message);
            console.error('📄 Raw content preview:');
            console.error('First 500 chars:', content.substring(0, 500));
            console.error('Last 500 chars:', content.substring(Math.max(0, content.length - 500)));
            
            // Try to find JSON manually as fallback
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    console.log('🔄 Attempting fallback JSON extraction...');
                    const fallbackJson = jsonMatch[0]
                        .replace(/,\s*}/g, '}')
                        .replace(/,\s*]/g, ']');
                    return JSON.parse(fallbackJson);
                }
            } catch (fallbackError) {
                console.error('❌ Fallback parsing also failed:', fallbackError.message);
            }
            
            throw new Error('Invalid node format generated - JSON parsing failed');
        }
    }

    async saveGeneratedNode(nodeData, userId) {
        try {
            const result = await query(`
                INSERT INTO generated_nodes (
                    name, description, category, icon, node_definition,
                    ui_config, config, execution_code, input_schema, output_schema, user_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `, [
                nodeData.name,
                nodeData.description,
                nodeData.category,
                nodeData.icon,
                JSON.stringify(nodeData.nodeDefinition),
                JSON.stringify(nodeData.uiConfig),
                JSON.stringify(nodeData.config),
                nodeData.executionCode,
                JSON.stringify(nodeData.inputSchema),
                JSON.stringify(nodeData.outputSchema),
                userId
            ]);

            const savedNode = result.rows[0];
            
            // Save initial version
            await query(`
                INSERT INTO generated_node_versions (
                    node_id, version_number, node_definition, ui_config, config,
                    execution_code, input_schema, output_schema, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                savedNode.id,
                1,
                JSON.stringify(nodeData.nodeDefinition),
                JSON.stringify(nodeData.uiConfig),
                JSON.stringify(nodeData.config),
                nodeData.executionCode,
                JSON.stringify(nodeData.inputSchema),
                JSON.stringify(nodeData.outputSchema),
                userId
            ]);

            console.log('✅ Generated node saved:', savedNode.name);
            return savedNode;
        } catch (error) {
            console.error('❌ Failed to save generated node:', error);
            throw error;
        }
    }

    async getAllGeneratedNodes(userId) {
        try {
            const result = await query(`
                SELECT id, name, description, category, icon, version, is_active, created_at, updated_at,
                       node_definition, ui_config, config, execution_code, input_schema, output_schema
                FROM generated_nodes 
                WHERE user_id = $1 AND is_active = true
                ORDER BY updated_at DESC
            `, [userId]);

            console.log('🔍 getAllGeneratedNodes returning:', {
                count: result.rows.length,
                nodes: result.rows.map(node => ({
                    id: node.id,
                    name: node.name,
                    hasConfig: !!node.config,
                    configType: typeof node.config,
                    configFields: node.config?.fields?.length || 0,
                    configData: node.config
                }))
            });

            return result.rows;
        } catch (error) {
            console.error('❌ Failed to fetch generated nodes:', error);
            throw error;
        }
    }

    async getGeneratedNode(nodeId, userId) {
        try {
            const result = await query(`
                SELECT * FROM generated_nodes 
                WHERE id = $1 AND user_id = $2 AND is_active = true
            `, [nodeId, userId]);

            if (result.rows.length === 0) {
                throw new Error('Node not found');
            }

            return result.rows[0];
        } catch (error) {
            console.error('❌ Failed to fetch generated node:', error);
            throw error;
        }
    }

    async updateGeneratedNode(nodeId, userId, updates, changeDescription = '') {
        try {
            // Get current node for versioning
            const currentNode = await this.getGeneratedNode(nodeId, userId);
            const newVersion = currentNode.version + 1;

            const updateFields = [];
            const values = [];
            let paramCount = 1;

            if (updates.name !== undefined) {
                updateFields.push(`name = $${paramCount++}`);
                values.push(updates.name);
            }
            if (updates.description !== undefined) {
                updateFields.push(`description = $${paramCount++}`);
                values.push(updates.description);
            }
            if (updates.category !== undefined) {
                updateFields.push(`category = $${paramCount++}`);
                values.push(updates.category);
            }
            if (updates.icon !== undefined) {
                updateFields.push(`icon = $${paramCount++}`);
                values.push(updates.icon);
            }
            if (updates.nodeDefinition !== undefined) {
                updateFields.push(`node_definition = $${paramCount++}`);
                values.push(JSON.stringify(updates.nodeDefinition));
            }
            if (updates.uiConfig !== undefined) {
                updateFields.push(`ui_config = $${paramCount++}`);
                values.push(JSON.stringify(updates.uiConfig));
            }
            if (updates.config !== undefined) {
                updateFields.push(`config = $${paramCount++}`);
                values.push(JSON.stringify(updates.config));
            }
            if (updates.executionCode !== undefined) {
                updateFields.push(`execution_code = $${paramCount++}`);
                values.push(updates.executionCode);
            }
            if (updates.inputSchema !== undefined) {
                updateFields.push(`input_schema = $${paramCount++}`);
                values.push(JSON.stringify(updates.inputSchema));
            }
            if (updates.outputSchema !== undefined) {
                updateFields.push(`output_schema = $${paramCount++}`);
                values.push(JSON.stringify(updates.outputSchema));
            }

            updateFields.push(`version = $${paramCount++}`);
            values.push(newVersion);
            updateFields.push(`updated_at = NOW()`);

            values.push(nodeId);

            const result = await query(`
                UPDATE generated_nodes 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
                RETURNING *
            `, [...values, userId]);

            if (result.rows.length === 0) {
                throw new Error('Node not found or access denied');
            }

            // Save version history
            await query(`
                INSERT INTO generated_node_versions (
                    node_id, version_number, node_definition, ui_config, config,
                    execution_code, input_schema, output_schema, change_description, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                nodeId,
                newVersion,
                JSON.stringify(updates.nodeDefinition || currentNode.node_definition),
                JSON.stringify(updates.uiConfig || currentNode.ui_config),
                JSON.stringify(updates.config || currentNode.config),
                updates.executionCode || currentNode.execution_code,
                JSON.stringify(updates.inputSchema || currentNode.input_schema),
                JSON.stringify(updates.outputSchema || currentNode.output_schema),
                changeDescription,
                userId
            ]);

            return result.rows[0];
        } catch (error) {
            console.error('❌ Failed to update generated node:', error);
            throw error;
        }
    }

    async deleteGeneratedNode(nodeId, userId) {
        try {
            const result = await query(`
                UPDATE generated_nodes 
                SET is_active = false, updated_at = NOW()
                WHERE id = $1 AND user_id = $2
                RETURNING id
            `, [nodeId, userId]);

            if (result.rows.length === 0) {
                throw new Error('Node not found or access denied');
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Failed to delete generated node:', error);
            throw error;
        }
    }

    async getNodeVersions(nodeId, userId) {
        try {
            const result = await query(`
                SELECT gn.name, gnv.*
                FROM generated_node_versions gnv
                JOIN generated_nodes gn ON gnv.node_id = gn.id
                WHERE gnv.node_id = $1 AND gn.user_id = $2
                ORDER BY gnv.version_number DESC
            `, [nodeId, userId]);

            return result.rows;
        } catch (error) {
            console.error('❌ Failed to fetch node versions:', error);
            throw error;
        }
    }
}

module.exports = new NodeGeneratorService();