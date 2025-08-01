# Node Development Guide

This guide covers how to create new nodes for the Hooksley Platform Automation system. Creating a new node requires changes to both frontend and backend components.

## Overview

A complete node implementation requires:
1. **Frontend Component** - UI for the node in the workflow canvas
2. **Backend Handler** - Logic that executes when the node runs
3. **Configuration Interface** - UI for configuring the node
4. **Node Registration** - Making the node available in the palette
5. **Default Data** - Initial values when the node is created

## Step-by-Step Guide

### 1. Create the Frontend Component

Create a new file in `/frontend/src/components/nodes/YourNodeName.js`:

```javascript
import React from 'react';
import { YourIcon } from 'lucide-react';

const YourNodeName = ({ data, onUpdate, isReadOnly }) => {
    const nodeData = data || {};

    const handleFieldChange = (field, value) => {
        if (isReadOnly) return;
        
        onUpdate({
            ...nodeData,
            [field]: value
        });
    };

    return (
        <div style={{
            padding: '16px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            border: '1px solid #2d2d2d'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                color: '#your-color'
            }}>
                <YourIcon size={16} />
                <span style={{ fontWeight: '600' }}>Your Node Name</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#888'
                }}>
                    Field Label *
                </label>
                <input
                    type="text"
                    value={nodeData.yourField || ''}
                    onChange={(e) => handleFieldChange('yourField', e.target.value)}
                    placeholder="Enter value"
                    readOnly={isReadOnly}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#121212',
                        border: '1px solid #2d2d2d',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#ffffff',
                        outline: 'none'
                    }}
                />
            </div>

            {/* Add more fields as needed */}
        </div>
    );
};

export default YourNodeName;
```

### 2. Register the Node Type

Add your node to `/frontend/src/components/nodes/index.js`:

```javascript
// Import your component
import YourNodeName from './YourNodeName';

// Add to nodeTypes object
export const nodeTypes = {
    // ... existing types
    yourNodeType: YourNodeName,
};

// Add to nodeTemplates object
export const nodeTemplates = {
    // ... existing templates
    yourCategory: {
        yourNodeType: {
            type: 'yourNodeType',
            data: {
                label: 'Your Node Name',
                yourField: '',
                timeout: 30
            }
        }
    }
};

// Export your component
export { YourNodeName };
```

### 3. Add to Workflow Canvas

Update `/frontend/src/components/SequenceWorkflowCanvas.js`:

```javascript
// Add icon import
import { YourIcon } from 'lucide-react';

// Add to nodeTypes array
const nodeTypes = [
    // ... existing types
    { 
        type: 'yourNodeType', 
        label: 'Your Node Name', 
        icon: YourIcon, 
        color: '#your-color', 
        description: 'Description of what your node does' 
    },
];

// Add to getDefaultStepData function
const getDefaultStepData = (type) => {
    switch (type) {
        // ... existing cases
        case 'yourNodeType':
            return { 
                yourField: '', 
                timeout: 30 
            };
        default:
            return {};
    }
};
```

### 4. Add Configuration Interface

Update `/frontend/src/components/EnhancedNodeEditor.js`:

```javascript
// Add to renderNodeSpecificFields switch statement
const renderNodeSpecificFields = () => {
    switch (node.type) {
        // ... existing cases
        case 'yourNodeType':
            return renderYourNodeFields();
        default:
            return null;
    }
};

// Add render function (after other render functions)
const renderYourNodeFields = () => (
    <>
        <FieldContainer>
            <Label required>Field Label</Label>
            <StyledInput
                value={formData.yourField}
                onChange={(value) => handleChange('yourField', value)}
                placeholder="Enter value"
            />
        </FieldContainer>

        <FieldContainer>
            <Label>Optional Field</Label>
            <StyledSelect
                value={formData.optionalField}
                onChange={(value) => handleChange('optionalField', value)}
            >
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
            </StyledSelect>
        </FieldContainer>

        <FieldContainer>
            <Label>Multi-line Field</Label>
            <StyledTextarea
                value={formData.multilineField}
                onChange={(value) => handleChange('multilineField', value)}
                placeholder="Enter multiple lines"
                rows={4}
            />
        </FieldContainer>

        <FieldContainer>
            <Label>Timeout (seconds)</Label>
            <StyledInput
                type="number"
                value={formData.timeout}
                onChange={(value) => handleChange('timeout', parseInt(value) || 30)}
                min="1"
                max="300"
            />
        </FieldContainer>
    </>
);
```

### 5. Create Backend Handler

Update `/backend/services/workflowEngine.js`:

```javascript
// Add to constructor nodeHandlers
constructor() {
    this.nodeHandlers = {
        // ... existing handlers
        yourNodeType: this.handleYourNode.bind(this)
    };
}

// Add handler method (at end of class, before closing brace)
async handleYourNode(node, context) {
    const data = node.data || {};
    const yourField = data.yourField;
    const timeout = (data.timeout || 30) * 1000;

    if (!yourField) {
        throw new Error('Required field not specified');
    }

    try {
        // Your node logic here
        const result = await this.performYourNodeOperation(data, context);
        
        return {
            type: 'yourNodeType',
            field: yourField,
            status: 'success',
            result: result
        };
    } catch (error) {
        throw new Error(`Your node failed: ${error.message}`);
    }
}

async performYourNodeOperation(data, context) {
    // Implement your specific logic here
    // Examples:
    
    // For API calls:
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.payload)
    });
    
    // For file operations:
    const fs = require('fs').promises;
    await fs.writeFile(data.filename, data.content);
    
    // For database operations:
    const { query } = require('../utils/database');
    const result = await query('SELECT * FROM table WHERE id = $1', [data.id]);
    
    // Return processed result
    return { success: true, data: 'processed data' };
}
```

### 6. Field Types and Components

Use these styled components in your configuration:

```javascript
// Text input
<StyledInput
    value={formData.field}
    onChange={(value) => handleChange('field', value)}
    placeholder="Enter text"
    type="text|email|password|number"
/>

// Dropdown select
<StyledSelect
    value={formData.field}
    onChange={(value) => handleChange('field', value)}
>
    <option value="value1">Label 1</option>
    <option value="value2">Label 2</option>
</StyledSelect>

// Textarea
<StyledTextarea
    value={formData.field}
    onChange={(value) => handleChange('field', value)}
    placeholder="Enter multiple lines"
    rows={4}
/>

// Field container and label
<FieldContainer>
    <Label required>Field Name</Label>
    {/* Input component */}
</FieldContainer>
```

### 7. Best Practices

#### Error Handling
```javascript
async handleYourNode(node, context) {
    try {
        // Validate inputs
        if (!data.requiredField) {
            throw new Error('Required field missing');
        }
        
        // Perform operation with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const result = await performOperation({
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return result;
        
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`Operation timed out after ${timeout/1000} seconds`);
        }
        throw new Error(`Operation failed: ${error.message}`);
    }
}
```

#### Input Validation
```javascript
// In backend handler
const validateInputs = (data) => {
    const errors = [];
    
    if (!data.requiredField) {
        errors.push('Required field is missing');
    }
    
    if (data.numberField && isNaN(data.numberField)) {
        errors.push('Number field must be a valid number');
    }
    
    if (data.emailField && !isValidEmail(data.emailField)) {
        errors.push('Email field must be a valid email address');
    }
    
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
};
```

#### Placeholder Support
```javascript
// Support {{input.field}} placeholders in your fields
const processPlaceholders = (template, context) => {
    return template.replace(/\{\{input\.(\w+)\}\}/g, (match, field) => {
        return context.input?.[field] || match;
    });
};

// Use in handler
const processedMessage = processPlaceholders(data.message, context);
```

## Complete Example: Custom Email Node

Here's a complete example implementing a custom email node:

### Frontend Component (`EmailCustomNode.js`)
```javascript
import React from 'react';
import { Mail } from 'lucide-react';

const EmailCustomNode = ({ data, onUpdate, isReadOnly }) => {
    const nodeData = data || {};

    const handleFieldChange = (field, value) => {
        if (isReadOnly) return;
        onUpdate({ ...nodeData, [field]: value });
    };

    return (
        <div style={{ padding: '16px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #2d2d2d' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#3b82f6' }}>
                <Mail size={16} />
                <span style={{ fontWeight: '600' }}>Send Email</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#888' }}>
                    Recipients *
                </label>
                <input
                    type="email"
                    value={nodeData.recipients || ''}
                    onChange={(e) => handleFieldChange('recipients', e.target.value)}
                    placeholder="user@example.com, another@example.com"
                    readOnly={isReadOnly}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#121212', border: '1px solid #2d2d2d', borderRadius: '4px', fontSize: '13px', color: '#ffffff', outline: 'none' }}
                />
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#888' }}>
                    Subject *
                </label>
                <input
                    type="text"
                    value={nodeData.subject || ''}
                    onChange={(e) => handleFieldChange('subject', e.target.value)}
                    placeholder="Email subject"
                    readOnly={isReadOnly}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#121212', border: '1px solid #2d2d2d', borderRadius: '4px', fontSize: '13px', color: '#ffffff', outline: 'none' }}
                />
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#888' }}>
                    Message *
                </label>
                <textarea
                    value={nodeData.message || ''}
                    onChange={(e) => handleFieldChange('message', e.target.value)}
                    placeholder="Email message body..."
                    readOnly={isReadOnly}
                    rows={4}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#121212', border: '1px solid #2d2d2d', borderRadius: '4px', fontSize: '13px', color: '#ffffff', outline: 'none', resize: 'vertical' }}
                />
            </div>
        </div>
    );
};

export default EmailCustomNode;
```

### Backend Handler (added to `workflowEngine.js`)
```javascript
async handleEmailCustomNode(node, context) {
    const data = node.data || {};
    const recipients = data.recipients;
    const subject = data.subject;
    const message = data.message;

    if (!recipients || !subject || !message) {
        throw new Error('Recipients, subject, and message are required');
    }

    try {
        // Process placeholders
        const processedSubject = this.processPlaceholders(subject, context);
        const processedMessage = this.processPlaceholders(message, context);
        
        // Send email (implement your email service here)
        const result = await this.sendEmail({
            to: recipients,
            subject: processedSubject,
            body: processedMessage
        });
        
        return {
            type: 'emailCustom',
            recipients: recipients,
            subject: processedSubject,
            status: 'sent',
            messageId: result.messageId
        };
    } catch (error) {
        throw new Error(`Email sending failed: ${error.message}`);
    }
}

processPlaceholders(template, context) {
    return template.replace(/\{\{input\.(\w+)\}\}/g, (match, field) => {
        return context.input?.[field] || match;
    });
}

async sendEmail(emailData) {
    // Implement your email service integration
    // This is a placeholder implementation
    console.log('Sending email:', emailData);
    return { messageId: 'msg_' + Date.now() };
}
```

## Testing Your Node

1. **Restart the backend** after adding handler:
   ```bash
   cd backend
   npm run dev
   ```

2. **Test in the UI**:
   - Add your node to a workflow
   - Configure the fields
   - Execute the workflow
   - Check the execution logs

3. **Debug issues**:
   - Check browser console for frontend errors
   - Check backend logs for execution errors
   - Verify all fields are properly saved and loaded

## Checklist

When creating a new node, ensure you have:

- [ ] Created the frontend component file
- [ ] Added to nodeTypes in `index.js`
- [ ] Added to nodeTemplates in `index.js`
- [ ] Exported the component in `index.js`
- [ ] Added to nodeTypes array in `SequenceWorkflowCanvas.js`
- [ ] Added to getDefaultStepData in `SequenceWorkflowCanvas.js`
- [ ] Added case in renderNodeSpecificFields in `EnhancedNodeEditor.js`
- [ ] Created render function in `EnhancedNodeEditor.js`
- [ ] Added handler to nodeHandlers in `workflowEngine.js`
- [ ] Implemented the handler method in `workflowEngine.js`
- [ ] Tested the node in the UI
- [ ] Tested workflow execution with the node

Following this guide ensures your nodes will have proper configuration interfaces and work correctly in both the frontend and backend.