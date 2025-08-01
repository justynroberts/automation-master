# Node Development Guide

## 🎯 Overview

This guide provides comprehensive instructions for adding new node types to the Workflow Automation Platform. It covers both frontend UI components and backend execution handlers.

## 📋 Table of Contents

1. [Node Architecture](#node-architecture)
2. [Adding a New Node Type](#adding-a-new-node-type)
3. [Frontend Development](#frontend-development)
4. [Backend Development](#backend-development)
5. [Testing Nodes](#testing-nodes)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

## 🏗️ Node Architecture

### Node Structure

Every node in the system consists of:

```javascript
{
  id: "unique-uuid",           // Auto-generated
  type: "node-category",       // input, script, logic, output, ansible
  data: {
    label: "Node Name",        // Display name
    description: "Purpose",    // Node description
    // Type-specific configuration
    nodeType: "specific-type", // e.g., "slack" for output nodes
    // ... other configuration fields
  },
  order: 0                     // Position in sequence
}
```

### Node Categories

1. **Input Nodes**: Data sources and triggers
2. **Script Nodes**: Code execution (JS, Python, Bash, etc.)
3. **Logic Nodes**: Control flow and data transformation
4. **Output Nodes**: Actions and destinations
5. **Custom Nodes**: Special-purpose integrations (e.g., Ansible)

## 🆕 Adding a New Node Type

### Step 1: Plan Your Node

**Define the node purpose:**
- What does it do?
- What inputs does it need?
- What outputs does it produce?
- What external dependencies are required?

**Example: Slack Node**
- Purpose: Send messages to Slack channels
- Inputs: Message text, channel, webhook URL
- Outputs: Success/failure status, message ID
- Dependencies: Slack webhook API

### Step 2: Update Node Configuration

Add your node to the palette in `SequenceWorkflowCanvas.js`:

```javascript
const nodeTypes = [
    // ... existing nodes
    { 
        type: 'slack', 
        label: 'Slack Message', 
        icon: MessageSquare, 
        color: '#4A154B', 
        description: 'Send messages to Slack channels' 
    }
];
```

### Step 3: Add Default Data

Update `getDefaultStepData()` in `SequenceWorkflowCanvas.js`:

```javascript
const getDefaultStepData = (type) => {
    switch (type) {
        // ... existing cases
        case 'slack':
            return { 
                webhookUrl: '', 
                channel: '#general', 
                message: '',
                username: 'Workflow Bot'
            };
        default:
            return {};
    }
};
```

## 🎨 Frontend Development

### Adding UI Configuration

Update `EnhancedNodeEditor.js` to add your node's configuration fields:

```javascript
const renderNodeSpecificFields = () => {
    switch (node.type) {
        // ... existing cases
        case 'slack':
            return renderSlackFields();
        default:
            return null;
    }
};

const renderSlackFields = () => (
    <>
        <FieldContainer>
            <Label required>Webhook URL</Label>
            <StyledInput
                type="password"
                value={formData.webhookUrl}
                onChange={(value) => handleChange('webhookUrl', value)}
                placeholder="https://hooks.slack.com/services/..."
            />
        </FieldContainer>

        <FieldContainer>
            <Label>Channel</Label>
            <StyledInput
                value={formData.channel}
                onChange={(value) => handleChange('channel', value)}
                placeholder="#general"
            />
        </FieldContainer>

        <FieldContainer>
            <Label required>Message</Label>
            <StyledTextarea
                value={formData.message}
                onChange={(value) => handleChange('message', value)}
                placeholder="Enter your message here..."
                rows={4}
            />
        </FieldContainer>

        <FieldContainer>
            <Label>Bot Username</Label>
            <StyledInput
                value={formData.username}
                onChange={(value) => handleChange('username', value)}
                placeholder="Workflow Bot"
            />
        </FieldContainer>
    </>
);
```

### Field Components

Use the provided styled components for consistency:

- **`StyledInput`**: Text, email, password, number inputs
- **`StyledSelect`**: Dropdown selections
- **`StyledTextarea`**: Multi-line text input
- **`Label`**: Field labels with optional required indicator
- **`FieldContainer`**: Wrapper with consistent spacing

### Validation

Add client-side validation if needed:

```javascript
const validateSlackNode = (data) => {
    const errors = [];
    
    if (!data.webhookUrl) {
        errors.push('Webhook URL is required');
    }
    
    if (!data.message) {
        errors.push('Message is required');
    }
    
    if (data.webhookUrl && !data.webhookUrl.startsWith('https://hooks.slack.com/')) {
        errors.push('Invalid Slack webhook URL');
    }
    
    return errors;
};
```

## ⚙️ Backend Development

### Adding Node Handler

Update `WorkflowEngine.js` to register your handler:

```javascript
this.nodeHandlers = {
    // ... existing handlers
    slack: this.handleSlackNode.bind(this)
};
```

### Implementing the Handler

Add the handler method to `WorkflowEngine` class:

```javascript
async handleSlackNode(node, context) {
    const data = node.data || {};
    const { webhookUrl, channel, message, username } = data;
    
    // Validation
    if (!webhookUrl) {
        throw new Error('Slack webhook URL is required');
    }
    
    if (!message) {
        throw new Error('Message is required');
    }
    
    try {
        console.log(`📢 Sending Slack message to ${channel}`);
        
        // Process message template with context variables
        const processedMessage = this.processTemplate(message, context);
        
        // Prepare Slack payload
        const payload = {
            text: processedMessage,
            channel: channel || '#general',
            username: username || 'Workflow Bot',
            icon_emoji: ':robot_face:'
        };
        
        // Dynamic import for node-fetch
        const { default: fetch } = await import('node-fetch');
        
        // Send to Slack
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            timeout: 10000 // 10 second timeout
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Slack API error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.text();
        
        return {
            type: 'slack',
            channel,
            message: processedMessage,
            username,
            result,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        throw new Error(`Slack message failed: ${error.message}`);
    }
}
```

### Template Processing

Add helper method for template variable replacement:

```javascript
processTemplate(template, context) {
    if (!template) return '';
    
    let processed = template;
    
    // Replace context variables
    const variables = {
        ...context.inputData,
        ...context.results,
        execution_id: context.executionId,
        workflow_id: context.workflowId,
        timestamp: new Date().toISOString()
    };
    
    // Replace {{variable}} placeholders
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        processed = processed.replace(regex, String(value));
    }
    
    return processed;
}
```

### Error Handling

Implement comprehensive error handling:

```javascript
async handleSlackNode(node, context) {
    try {
        // ... implementation
    } catch (error) {
        // Log error for debugging
        console.error(`Slack node error:`, error);
        
        // Provide helpful error messages
        if (error.code === 'ENOTFOUND') {
            throw new Error('Network error: Unable to reach Slack API');
        }
        
        if (error.code === 'ECONNRESET') {
            throw new Error('Connection timeout: Slack API request timed out');
        }
        
        // Re-throw with context
        throw new Error(`Slack integration failed: ${error.message}`);
    }
}
```

### Async Operations

For long-running operations, consider timeouts and cancellation:

```javascript
async handleLongRunningNode(node, context) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
        const result = await fetch(url, {
            signal: controller.signal,
            // ... other options
        });
        
        clearTimeout(timeout);
        return result;
        
    } catch (error) {
        clearTimeout(timeout);
        
        if (error.name === 'AbortError') {
            throw new Error('Operation timed out after 30 seconds');
        }
        
        throw error;
    }
}
```

## 🧪 Testing Nodes

### Unit Testing the Handler

Create test file `tests/nodes/slackNode.test.js`:

```javascript
const WorkflowEngine = require('../../services/workflowEngine');

describe('Slack Node Handler', () => {
    let engine;
    
    beforeEach(() => {
        engine = new WorkflowEngine();
    });
    
    test('should send slack message successfully', async () => {
        const node = {
            data: {
                webhookUrl: 'https://hooks.slack.com/services/test',
                channel: '#test',
                message: 'Test message',
                username: 'Test Bot'
            }
        };
        
        const context = {
            executionId: 'test-execution',
            workflowId: 'test-workflow',
            inputData: {},
            results: {}
        };
        
        // Mock fetch
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('ok')
        });
        
        const result = await engine.handleSlackNode(node, context);
        
        expect(result.type).toBe('slack');
        expect(result.channel).toBe('#test');
        expect(result.message).toBe('Test message');
    });
    
    test('should fail with missing webhook URL', async () => {
        const node = {
            data: {
                message: 'Test message'
            }
        };
        
        const context = {};
        
        await expect(engine.handleSlackNode(node, context))
            .rejects.toThrow('Slack webhook URL is required');
    });
});
```

### Integration Testing

Test the complete flow:

```javascript
describe('Slack Node Integration', () => {
    test('should execute slack node in workflow', async () => {
        const workflow = {
            definition: {
                nodes: [{
                    id: 'slack-1',
                    type: 'slack',
                    data: {
                        webhookUrl: process.env.TEST_SLACK_WEBHOOK,
                        channel: '#test',
                        message: 'Integration test message'
                    }
                }]
            }
        };
        
        const execution = await engine.executeWorkflow(execution, workflow);
        
        expect(execution.status).toBe('completed');
        expect(execution.results['slack-1']).toBeDefined();
    });
});
```

### Manual Testing

1. **Create test workflow** with your new node
2. **Configure node** with test data
3. **Execute workflow** and verify results
4. **Check logs** for errors or warnings
5. **Test edge cases** (missing data, network errors, etc.)

## 🎯 Best Practices

### 1. Configuration Design

**Keep it simple:**
- Minimize required fields
- Provide sensible defaults
- Use clear field names and descriptions

**Progressive disclosure:**
- Show basic options first
- Hide advanced options behind toggles
- Group related fields together

### 2. Error Handling

**Be specific:**
- Provide clear error messages
- Include helpful context
- Suggest solutions when possible

**Fail gracefully:**
- Don't crash the entire workflow
- Log errors for debugging
- Allow retry mechanisms

### 3. Performance

**Optimize for speed:**
- Use timeouts for external calls
- Implement connection pooling
- Cache frequently used data

**Resource management:**
- Clean up temporary files
- Close connections properly
- Monitor memory usage

### 4. Security

**Validate inputs:**
- Sanitize user data
- Validate URLs and paths
- Prevent injection attacks

**Protect secrets:**
- Use password fields for sensitive data
- Don't log sensitive information
- Support environment variables

### 5. Documentation

**Code documentation:**
- Comment complex logic
- Document function parameters
- Include usage examples

**User documentation:**
- Clear field descriptions
- Configuration examples
- Troubleshooting tips

## 📝 Examples

### Example 1: Simple HTTP API Node

```javascript
// Frontend Configuration
case 'http':
    return (
        <>
            <FieldContainer>
                <Label required>URL</Label>
                <StyledInput
                    value={formData.url}
                    onChange={(value) => handleChange('url', value)}
                    placeholder="https://api.example.com/endpoint"
                />
            </FieldContainer>
            
            <FieldContainer>
                <Label>Method</Label>
                <StyledSelect
                    value={formData.method}
                    onChange={(value) => handleChange('method', value)}
                >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                </StyledSelect>
            </FieldContainer>
        </>
    );

// Backend Handler
async handleHttpNode(node, context) {
    const { url, method = 'GET', headers = {}, body } = node.data;
    
    const { default: fetch } = await import('node-fetch');
    
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
        timeout: 30000
    });
    
    const result = await response.text();
    
    return {
        type: 'http',
        url,
        method,
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: result
    };
}
```

### Example 2: File Processing Node

```javascript
// Frontend Configuration
case 'csv':
    return (
        <>
            <FieldContainer>
                <Label required>File Path</Label>
                <StyledInput
                    value={formData.filePath}
                    onChange={(value) => handleChange('filePath', value)}
                    placeholder="/path/to/file.csv"
                />
            </FieldContainer>
            
            <FieldContainer>
                <Label>Delimiter</Label>
                <StyledSelect
                    value={formData.delimiter}
                    onChange={(value) => handleChange('delimiter', value)}
                >
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value="\t">Tab</option>
                </StyledSelect>
            </FieldContainer>
        </>
    );

// Backend Handler
async handleCsvNode(node, context) {
    const { filePath, delimiter = ',' } = node.data;
    const fs = require('fs').promises;
    
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        const headers = lines[0].split(delimiter);
        const rows = lines.slice(1).map(line => {
            const values = line.split(delimiter);
            return Object.fromEntries(
                headers.map((header, index) => [header, values[index]])
            );
        });
        
        return {
            type: 'csv',
            filePath,
            headers,
            rows,
            count: rows.length
        };
        
    } catch (error) {
        throw new Error(`CSV processing failed: ${error.message}`);
    }
}
```

### Example 3: Database Node

```javascript
// Frontend Configuration
case 'postgres':
    return (
        <>
            <FieldContainer>
                <Label required>Connection String</Label>
                <StyledInput
                    type="password"
                    value={formData.connectionString}
                    onChange={(value) => handleChange('connectionString', value)}
                    placeholder="postgresql://user:pass@host:port/db"
                />
            </FieldContainer>
            
            <FieldContainer>
                <Label required>Query</Label>
                <StyledTextarea
                    value={formData.query}
                    onChange={(value) => handleChange('query', value)}
                    placeholder="SELECT * FROM users WHERE active = true"
                    rows={4}
                />
            </FieldContainer>
        </>
    );

// Backend Handler
async handlePostgresNode(node, context) {
    const { connectionString, query } = node.data;
    const { Pool } = require('pg');
    
    const pool = new Pool({ connectionString });
    
    try {
        const client = await pool.connect();
        
        // Process query template
        const processedQuery = this.processTemplate(query, context);
        
        const result = await client.query(processedQuery);
        
        client.release();
        
        return {
            type: 'postgres',
            query: processedQuery,
            rows: result.rows,
            rowCount: result.rowCount,
            fields: result.fields?.map(f => f.name)
        };
        
    } catch (error) {
        throw new Error(`Database query failed: ${error.message}`);
    } finally {
        await pool.end();
    }
}
```

## 🔄 Node Lifecycle

Understanding the complete lifecycle helps with development:

1. **Creation**: User drags node from palette
2. **Configuration**: User opens editor and sets properties
3. **Validation**: Client-side validation before save
4. **Storage**: Node definition saved to database
5. **Execution**: Handler called during workflow run
6. **Results**: Output stored and passed to next nodes
7. **Logging**: Execution details logged for monitoring

This guide provides everything needed to create powerful, reliable nodes for the automation platform. Start with simple nodes and gradually add complexity as you become familiar with the patterns.