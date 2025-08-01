# Node Development Checklist

Quick reference for creating new nodes in the Hooksley Platform Automation system.

## 📋 Implementation Checklist

When creating a new node, you must implement **all 5 components**:

### ✅ 1. Frontend Component
**File:** `/frontend/src/components/nodes/YourNodeName.js`
```javascript
import React from 'react';
import { YourIcon } from 'lucide-react';

const YourNodeName = ({ data, onUpdate, isReadOnly }) => {
    // Component implementation
};

export default YourNodeName;
```

### ✅ 2. Node Registration
**File:** `/frontend/src/components/nodes/index.js`
```javascript
// Import
import YourNodeName from './YourNodeName';

// Add to nodeTypes
export const nodeTypes = {
    yourNodeType: YourNodeName,
};

// Add to nodeTemplates
export const nodeTemplates = {
    yourCategory: {
        yourNodeType: { type: 'yourNodeType', data: { /* defaults */ } }
    }
};

// Export
export { YourNodeName };
```

### ✅ 3. Canvas Integration
**File:** `/frontend/src/components/SequenceWorkflowCanvas.js`
```javascript
// Add icon import
import { YourIcon } from 'lucide-react';

// Add to nodeTypes array
const nodeTypes = [
    { type: 'yourNodeType', label: 'Your Node', icon: YourIcon, color: '#color' },
];

// Add to getDefaultStepData
case 'yourNodeType':
    return { /* default data */ };
```

### ✅ 4. Configuration Interface
**File:** `/frontend/src/components/EnhancedNodeEditor.js`
```javascript
// Add to switch statement
case 'yourNodeType':
    return renderYourNodeFields();

// Add render function
const renderYourNodeFields = () => (
    <>
        <FieldContainer>
            <Label required>Field Name</Label>
            <StyledInput
                value={formData.field}
                onChange={(value) => handleChange('field', value)}
            />
        </FieldContainer>
    </>
);
```

### ✅ 5. Backend Handler
**File:** `/backend/services/workflowEngine.js`
```javascript
// Add to constructor
this.nodeHandlers = {
    yourNodeType: this.handleYourNode.bind(this)
};

// Add handler method
async handleYourNode(node, context) {
    const data = node.data || {};
    
    // Validation
    if (!data.requiredField) {
        throw new Error('Required field missing');
    }
    
    try {
        // Your logic here
        const result = await this.performOperation(data, context);
        
        return {
            type: 'yourNodeType',
            status: 'success',
            result: result
        };
    } catch (error) {
        throw new Error(`Operation failed: ${error.message}`);
    }
}
```

## 🔍 Quick Test Steps

1. **Restart Backend**: `npm run dev` in `/backend`
2. **Check Frontend**: Refresh browser at `http://localhost:5002`
3. **Add Node**: Click "+" button in workflow, should see your node
4. **Configure**: Click node to open config, verify all fields appear
5. **Execute**: Run workflow with your node, check execution logs

## ⚠️ Common Issues

| Issue | Check |
|-------|--------|
| Node not in palette | Added to `SequenceWorkflowCanvas.js` nodeTypes array? |
| No config interface | Added case to `EnhancedNodeEditor.js` switch? |
| Config doesn't save | Added to `getDefaultStepData`? |
| "Unknown node type" error | Added handler to `workflowEngine.js`? |
| Handler not found | Restarted backend after adding handler? |

## 📄 Templates

### Basic Input Field
```javascript
<FieldContainer>
    <Label required>Field Name</Label>
    <StyledInput
        value={formData.field}
        onChange={(value) => handleChange('field', value)}
        placeholder="Enter value"
    />
</FieldContainer>
```

### Dropdown Select
```javascript
<FieldContainer>
    <Label>Options</Label>
    <StyledSelect
        value={formData.option}
        onChange={(value) => handleChange('option', value)}
    >
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
    </StyledSelect>
</FieldContainer>
```

### Textarea
```javascript
<FieldContainer>
    <Label>Description</Label>
    <StyledTextarea
        value={formData.description}
        onChange={(value) => handleChange('description', value)}
        rows={4}
        placeholder="Enter description"
    />
</FieldContainer>
```

### Backend Error Handling
```javascript
async handleYourNode(node, context) {
    const data = node.data || {};
    
    try {
        // Validate required fields
        if (!data.requiredField) {
            throw new Error('Required field is missing');
        }
        
        // Set timeout
        const timeout = (data.timeout || 30) * 1000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Perform operation
        const result = await this.performOperation(data, {
            ...context,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        return {
            type: 'yourNodeType',
            status: 'success',
            result: result
        };
        
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`Operation timed out after ${timeout/1000} seconds`);
        }
        throw new Error(`Operation failed: ${error.message}`);
    }
}
```

## 🎨 Color Scheme

Use these colors for consistency:

| Node Type | Color | Usage |
|-----------|-------|--------|
| Input | `#6b7280` | Data sources, triggers |
| Script | `#8b5cf6` | Code execution |
| Logic | `#f59e0b` | Control flow, conditions |
| Output | `#10b981` | Data export, actions |
| API | `#00d4aa` | HTTP requests |
| Database | `#3b82f6` | Database operations |
| Messaging | `#4a154b` | Notifications, chat |
| File | `#ef4444` | File operations |

For complete documentation, see [Node Development Guide](NODE_DEVELOPMENT_GUIDE.md).