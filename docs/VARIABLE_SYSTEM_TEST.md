# Variable System Testing Guide

## 🧪 **Comprehensive Variable System Test**

This document provides step-by-step instructions to test the enhanced variable system with the popup helper.

### 📋 **Test Setup**

**Prerequisites:**
- Backend running on port 3001
- Frontend running on port 5002
- User logged in to the system

### 🔧 **Variable Types to Test**

#### **1. Input Variables** `{{input.field}}`
- Data provided when workflow starts
- Available in all steps

#### **2. Previous Step Variables** `{{previous.field}}`
- Output from immediately previous step
- Only available from step 2 onwards

#### **3. Specific Step Variables** `{{steps.step_name.field}}`
- Output from any previous step by name
- Step names are auto-generated from labels

#### **4. Context Variables** `{{context.field}}`
- Execution metadata (executionId, workflowId, etc.)
- Available in all steps

#### **5. Environment Variables** `{{env.field}}`
- Server environment variables
- Use with caution in production

### 🎯 **Test Scenarios**

#### **Test 1: Variable Helper Popup**

1. **Open Workflow Editor**: Go to `http://localhost:5002/workflow/new`

2. **Add API POST Node**: Click "+" and select "API POST"

3. **Open Configuration**: Click the API POST node to open editor

4. **Test Variable Button**: 
   - Look for ⚡ button next to URL field
   - Click it to open Variable Helper popup

5. **Verify Popup Features**:
   - Search functionality works
   - Categories expand/collapse
   - Variables show descriptions and types
   - Copy button works
   - Click to insert works

#### **Test 2: Multi-Step Variable Flow**

Create this test workflow:

**Step 1: Manual Input**
- Type: Input/Trigger → Manual Input
- Configure with test data

**Step 2: API GET** 
- Type: API GET
- URL: `https://httpbin.org/get`
- Query Params: `{"test": "{{input.data}}", "timestamp": "{{context.timestamp}}"}`

**Step 3: API POST**
- Type: API POST  
- URL: `https://httpbin.org/post`
- Body: `{"previous_result": "{{previous.result}}", "get_data": "{{steps.api_get.response}}"}`

**Step 4: Slack Output**
- Type: Slack Message
- Message: `"API test completed! Status: {{previous.status}}, Data: {{steps.api_get.response}}"`

#### **Test 3: Variable Resolution Testing**

**Test URL Placeholders:**
```
https://api.github.com/users/{{input.username}}
https://httpbin.org/get?user={{input.userId}}&type={{context.executionId}}
```

**Test JSON Placeholders:**
```json
{
  "user": "{{input.username}}",
  "timestamp": "{{context.timestamp}}",
  "previous_data": "{{previous.result}}",
  "environment": "{{env.NODE_ENV}}"
}
```

**Test Message Placeholders:**
```
Workflow completed for user {{input.username}}!
Execution ID: {{context.executionId}}
Status: {{previous.status}}
Data from step 2: {{steps.api_get.response}}
```

### 🔍 **Verification Steps**

#### **Frontend Tests**

1. **Variable Helper Opens**: ⚡ buttons show popup
2. **Search Works**: Type to filter variables
3. **Categories Work**: Expand/collapse properly
4. **Copy to Clipboard**: Copy button works
5. **Insert Variables**: Click inserts `{{variable.name}}`
6. **Field Integration**: Variables appear in form fields

#### **Backend Tests** 

1. **Placeholder Processing**: Variables resolve during execution
2. **Context Building**: Previous steps available to later steps
3. **Step Name Resolution**: Named steps accessible via `{{steps.name.field}}`
4. **Error Handling**: Invalid variables don't crash execution
5. **Complex Paths**: Deep object access works (e.g., `{{previous.data.items[0].name}}`)

### 📊 **Expected Results**

#### **Variable Helper Popup**
- **Input Variables**: Shows `input.data`, `input.userId`, etc.
- **Previous Variables**: Shows `previous.result`, `previous.status` (step 2+)
- **Steps Variables**: Shows `steps.manual_input.result`, `steps.api_get.response` (based on actual step names)
- **Context Variables**: Shows `context.executionId`, `context.timestamp`, etc.
- **Environment Variables**: Shows `env.NODE_ENV`, etc.

#### **Execution Results**
- **Step 1**: Manual input processes correctly
- **Step 2**: API GET receives interpolated URL and params
- **Step 3**: API POST gets data from previous step and named step
- **Step 4**: Slack message shows dynamic content

#### **Backend Logs**
```
Processing node abc123 (input)
Variable resolution: {{input.data}} → "test data"
Processing node def456 (apiGet)  
Variable resolution: {{input.data}} → "test data"
Variable resolution: {{context.timestamp}} → "2025-06-17T14:15:30.123Z"
Processing node ghi789 (apiPost)
Variable resolution: {{previous.result}} → "{\"status\": 200, \"data\": \"...\"}"
Variable resolution: {{steps.api_get.response}} → "{\"args\": {...}}"
```

### 🐛 **Troubleshooting**

#### **Variable Helper Not Showing**
- Check if ⚡ icon appears next to fields
- Verify EnhancedNodeEditor receives workflowSteps prop
- Check browser console for React errors

#### **Variables Not Resolving**
- Check backend logs for variable resolution warnings
- Verify placeholder syntax: `{{source.field}}`
- Ensure previous steps completed successfully

#### **Step Names Not Working**
- Step names are generated from node labels
- Spaces become underscores, special chars removed
- Use browser dev tools to inspect actual step names

#### **Context Missing**
- Verify workflow object passed to processPlaceholders
- Check if context.results contains previous step data
- Ensure step execution order is correct

### 🔬 **Advanced Testing**

#### **Complex Variable Paths**
```javascript
// Array access
{{steps.api_get.response.data[0].name}}

// Nested objects  
{{previous.result.user.profile.email}}

// Multiple variables in one field
"User {{input.username}} has {{previous.count}} items"
```

#### **Error Scenarios**
```javascript
// Invalid JSON - should not crash
{{invalid.variable}}

// Circular references - should be handled
{{steps.current_step.result}}

// Type conversion - objects become JSON strings
{{steps.api_call.response}} // Object → JSON string
```

#### **Performance Testing**
- Test with 10+ step workflows
- Verify variable resolution doesn't slow execution
- Check memory usage with large variable contexts

### ✅ **Success Criteria**

1. **✅ Variable Helper Popup**: Opens, searches, copies, inserts variables
2. **✅ Frontend Integration**: ⚡ buttons work in all supported fields  
3. **✅ Backend Processing**: All variable types resolve correctly
4. **✅ Multi-Step Flow**: Previous step data flows to next steps
5. **✅ Error Handling**: Invalid variables don't break execution
6. **✅ Performance**: System handles complex workflows smoothly
7. **✅ User Experience**: Easy to discover and use variables

### 📝 **Test Results Template**

```
Test Date: _______
Tester: _______

[ ] Variable Helper Popup Opens
[ ] Search Functionality Works  
[ ] Copy to Clipboard Works
[ ] Insert Variables Works
[ ] Input Variables Resolve
[ ] Previous Variables Resolve
[ ] Step Variables Resolve
[ ] Context Variables Resolve
[ ] Environment Variables Resolve
[ ] Multi-Step Workflow Executes
[ ] Error Handling Works
[ ] Performance Acceptable

Notes:
_________________________
_________________________
```

This comprehensive test ensures the variable system works correctly across all supported use cases and provides a smooth user experience for workflow automation.