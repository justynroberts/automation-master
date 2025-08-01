import React, { useState, useEffect, memo } from 'react';
import { X, Save, Trash2, Code, Settings, Zap } from 'lucide-react';
import CodeEditor from './CodeEditor';
import VariableHelper from './VariableHelper';
import useDynamicNodes from '../hooks/useDynamicNodes';

// Styled components moved outside to prevent re-creation
const StyledInput = memo(({ type = 'text', value, onChange, placeholder, style = {}, fieldName, onVariableClick }) => (
    <div style={{ position: 'relative', width: '100%' }}>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
                width: '100%',
                padding: '12px 16px',
                paddingRight: onVariableClick ? '48px' : '16px',
                backgroundColor: '#121212',
                border: '1px solid #2d2d2d',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#ffffff',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: '"Inter", sans-serif',
                ...style
            }}
            onFocus={(e) => {
                e.target.style.borderColor = '#00d4aa';
                e.target.style.backgroundColor = '#1a1a1a';
            }}
            onBlur={(e) => {
                e.target.style.borderColor = '#2d2d2d';
                e.target.style.backgroundColor = '#121212';
            }}
        />
        {onVariableClick && (
            <button
                type="button"
                onClick={() => onVariableClick(fieldName)}
                style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px',
                    backgroundColor: '#2d2d2d',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#00d4aa';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#2d2d2d';
                }}
                title="Insert variable"
            >
                <Zap size={14} color="#888" />
            </button>
        )}
    </div>
));

const StyledSelect = memo(({ value, onChange, children, style = {} }) => (
    <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#121212',
            border: '1px solid #2d2d2d',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#ffffff',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: '"Inter", sans-serif',
            cursor: 'pointer',
            ...style
        }}
        onFocus={(e) => {
            e.target.style.borderColor = '#00d4aa';
            e.target.style.backgroundColor = '#1a1a1a';
        }}
        onBlur={(e) => {
            e.target.style.borderColor = '#2d2d2d';
            e.target.style.backgroundColor = '#121212';
        }}
    >
        {children}
    </select>
));

const StyledTextarea = memo(({ value, onChange, placeholder, rows = 4, style = {}, fieldName, onVariableClick }) => (
    <div style={{ position: 'relative', width: '100%' }}>
        <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            style={{
                width: '100%',
                padding: '12px 16px',
                paddingRight: onVariableClick ? '48px' : '16px',
                backgroundColor: '#121212',
                border: '1px solid #2d2d2d',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#ffffff',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: '"Inter", sans-serif',
                resize: 'vertical',
                minHeight: '80px',
                ...style
            }}
            onFocus={(e) => {
                e.target.style.borderColor = '#00d4aa';
                e.target.style.backgroundColor = '#1a1a1a';
            }}
            onBlur={(e) => {
                e.target.style.borderColor = '#2d2d2d';
                e.target.style.backgroundColor = '#121212';
            }}
        />
        {onVariableClick && (
            <button
                type="button"
                onClick={() => onVariableClick(fieldName)}
                style={{
                    position: 'absolute',
                    right: '8px',
                    top: '12px',
                    padding: '4px',
                    backgroundColor: '#2d2d2d',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#00d4aa';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#2d2d2d';
                }}
                title="Insert variable"
            >
                <Zap size={14} color="#888" />
            </button>
        )}
    </div>
));

// Common label component
const Label = memo(({ children, required = false }) => (
    <label style={{ 
        display: 'block', 
        fontSize: '12px', 
        fontWeight: '500', 
        color: '#ffffff',
        marginBottom: '6px'
    }}>
        {children}
        {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
    </label>
));

// Field container component
const FieldContainer = memo(({ children }) => (
    <div style={{ marginBottom: '20px' }}>
        {children}
    </div>
));

const EnhancedNodeEditor = ({ node, onSave, onDelete, onClose, workflowSteps = [], currentStepIndex = 0 }) => {
    const [formData, setFormData] = useState(node.data);
    const [activeTab, setActiveTab] = useState('general');
    const [showVariableHelper, setShowVariableHelper] = useState(false);
    const [activeField, setActiveField] = useState(null);
    const { getNode, generatedNodes } = useDynamicNodes();

    useEffect(() => {
        setFormData(node.data);
    }, [node]);

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        onSave(node.id, formData);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this node?')) {
            onDelete(node.id);
        }
    };

    const handleVariableInsert = (variableText) => {
        if (activeField) {
            const currentValue = formData[activeField] || '';
            const newValue = currentValue + variableText;
            handleChange(activeField, newValue);
        }
    };

    const openVariableHelper = (fieldName) => {
        setActiveField(fieldName);
        setShowVariableHelper(true);
    };



    const renderConfigField = (field) => {
        const fieldKey = `config_${field.name}`;
        const currentValue = formData[fieldKey] || field.defaultValue || '';

        switch (field.type) {
            case 'text':
                return (
                    <StyledInput
                        value={currentValue}
                        onChange={(value) => handleChange(fieldKey, value)}
                        placeholder={field.placeholder || `Enter ${field.label || field.name}`}
                    />
                );
            case 'number':
                return (
                    <StyledInput
                        type="number"
                        value={currentValue}
                        onChange={(value) => handleChange(fieldKey, value)}
                        placeholder={field.placeholder || `Enter ${field.label || field.name}`}
                    />
                );
            case 'password':
                return (
                    <StyledInput
                        type="password"
                        value={currentValue}
                        onChange={(value) => handleChange(fieldKey, value)}
                        placeholder={field.placeholder || `Enter ${field.label || field.name}`}
                    />
                );
            case 'select':
                return (
                    <StyledSelect
                        value={currentValue}
                        onChange={(value) => handleChange(fieldKey, value)}
                    >
                        <option value="">{field.placeholder || `Select ${field.label || field.name}`}</option>
                        {field.options && field.options.map((option, idx) => (
                            <option key={idx} value={option}>
                                {option}
                            </option>
                        ))}
                    </StyledSelect>
                );
            case 'toggle':
                return (
                    <StyledSelect
                        value={currentValue}
                        onChange={(value) => handleChange(fieldKey, value)}
                    >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                    </StyledSelect>
                );
            case 'textarea':
                return (
                    <StyledTextarea
                        value={currentValue}
                        onChange={(value) => handleChange(fieldKey, value)}
                        placeholder={field.placeholder || `Enter ${field.label || field.name}`}
                        rows={4}
                    />
                );
            default:
                return (
                    <StyledInput
                        value={currentValue}
                        onChange={(value) => handleChange(fieldKey, value)}
                        placeholder={field.placeholder || `Enter ${field.label || field.name}`}
                    />
                );
        }
    };

    const renderGeneratedNodeFields = () => {
        // Get the generated node definition from the registry
        const generatedNodeId = node.data?.generatedNodeId || formData.generatedNodeId;
        const generatedNodeData = generatedNodeId ? getNode(generatedNodeId) : null;
        
        const allRegistryKeys = generatedNodes.map(n => n.id || `generated_${n.generatedNodeId}`);
        
        console.log('🔧 Debug renderGeneratedNodeFields:', {
            nodeType: node.type,
            nodeData: node.data,
            generatedNodeId,
            hasGeneratedNodeData: !!generatedNodeData,
            hasConfig: !!generatedNodeData?.config,
            configFieldsCount: generatedNodeData?.config?.fields?.length || 0,
            generatedNodeDataKeys: generatedNodeData ? Object.keys(generatedNodeData) : [],
            allRegistryKeys,
            totalNodesInRegistry: generatedNodes.length
        });
        
        if (!generatedNodeData || !generatedNodeData.config) {
            return (
                <div style={{ padding: '16px', textAlign: 'center', color: '#8a8a8a' }}>
                    <p>No configuration available for this node.</p>
                    <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                        Debug: generatedNodeId={generatedNodeId}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px', color: '#555' }}>
                        Registry has {allRegistryKeys.length} nodes: {allRegistryKeys.join(', ')}
                    </div>
                </div>
            );
        }

        const config = generatedNodeData.config;
        
        return (
            <>
                <FieldContainer>
                    <div style={{ 
                        padding: '12px 16px', 
                        backgroundColor: '#1a1a1a', 
                        borderRadius: '6px',
                        border: '1px solid #2d2d2d',
                        marginBottom: '16px'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                            {generatedNodeData.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8a8a8a' }}>
                            {config.description || 'Configuration parameters for this generated node'}
                        </div>
                    </div>
                </FieldContainer>

                {config.fields && config.fields.length > 0 ? (
                    config.fields.map((field, index) => (
                        <FieldContainer key={field.name || index}>
                            <Label required={field.required}>
                                {field.label || field.name}
                            </Label>
                            {field.description && (
                                <div style={{ fontSize: '12px', color: '#8a8a8a', marginBottom: '8px' }}>
                                    {field.description}
                                </div>
                            )}
                            {renderConfigField(field)}
                        </FieldContainer>
                    ))
                ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#8a8a8a' }}>
                        <p>This node has no configurable parameters.</p>
                    </div>
                )}
            </>
        );
    };

    const renderNodeSpecificFields = () => {
        switch (node.type) {
            case 'input':
                return renderInputFields();
            case 'script':
                return renderScriptFields();
            case 'logic':
                return renderLogicFields();
            case 'output':
                return renderOutputFields();
            case 'ansible':
                return renderAnsibleFields();
            case 'generatedNode':
                return renderGeneratedNodeFields();
            case 'apiPost':
                return renderApiPostFields();
            case 'apiGet':
                return renderApiGetFields();
            case 'slackOutput':
                return renderSlackOutputFields();
            case 'screenOutput':
                return renderScreenOutputFields();
            case 'transform':
                return renderTransformFields();
            case 'userInput':
                return renderUserInputFields();
            default:
                return null;
        }
    };

    const renderInputFields = () => (
        <>
            <FieldContainer>
                <Label required>Input Type</Label>
                <StyledSelect
                    value={formData.inputType}
                    onChange={(value) => handleChange('inputType', value)}
                >
                    <option value="manual">Manual Input</option>
                    <option value="file">File Upload</option>
                    <option value="webhook">Webhook</option>
                    <option value="timer">Timer/Schedule</option>
                    <option value="database">Database Query</option>
                    <option value="api">API Trigger</option>
                </StyledSelect>
            </FieldContainer>

            {formData.inputType === 'file' && (
                <>
                    <FieldContainer>
                        <Label>File Type</Label>
                        <StyledSelect
                            value={formData.fileType}
                            onChange={(value) => handleChange('fileType', value)}
                        >
                            <option value="csv">CSV</option>
                            <option value="json">JSON</option>
                            <option value="xml">XML</option>
                            <option value="txt">Text</option>
                            <option value="excel">Excel (XLSX)</option>
                            <option value="yaml">YAML</option>
                        </StyledSelect>
                    </FieldContainer>
                    <FieldContainer>
                        <Label>File Path</Label>
                        <StyledInput
                            value={formData.filePath}
                            onChange={(value) => handleChange('filePath', value)}
                            placeholder="/path/to/file.csv"
                        />
                    </FieldContainer>
                </>
            )}

            {formData.inputType === 'webhook' && (
                <>
                    <FieldContainer>
                        <Label>Webhook Endpoint</Label>
                        <StyledInput
                            value={formData.endpoint}
                            onChange={(value) => handleChange('endpoint', value)}
                            placeholder="/webhook/trigger"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>HTTP Method</Label>
                        <StyledSelect
                            value={formData.method}
                            onChange={(value) => handleChange('method', value)}
                        >
                            <option value="POST">POST</option>
                            <option value="GET">GET</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                        </StyledSelect>
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Authentication</Label>
                        <StyledSelect
                            value={formData.auth}
                            onChange={(value) => handleChange('auth', value)}
                        >
                            <option value="none">None</option>
                            <option value="bearer">Bearer Token</option>
                            <option value="basic">Basic Auth</option>
                            <option value="api_key">API Key</option>
                        </StyledSelect>
                    </FieldContainer>
                </>
            )}

            {formData.inputType === 'timer' && (
                <>
                    <FieldContainer>
                        <Label>Schedule Type</Label>
                        <StyledSelect
                            value={formData.scheduleType}
                            onChange={(value) => handleChange('scheduleType', value)}
                        >
                            <option value="cron">Cron Expression</option>
                            <option value="interval">Interval</option>
                            <option value="once">One Time</option>
                        </StyledSelect>
                    </FieldContainer>
                    {formData.scheduleType === 'cron' && (
                        <FieldContainer>
                            <Label>Cron Expression</Label>
                            <StyledInput
                                value={formData.schedule}
                                onChange={(value) => handleChange('schedule', value)}
                                placeholder="0 9 * * * (Every day at 9 AM)"
                            />
                            <div style={{ fontSize: '12px', color: '#8a8a8a', marginTop: '4px' }}>
                                Format: minute hour day month weekday
                            </div>
                        </FieldContainer>
                    )}
                    {formData.scheduleType === 'interval' && (
                        <FieldContainer>
                            <Label>Interval (seconds)</Label>
                            <StyledInput
                                type="number"
                                value={formData.interval}
                                onChange={(value) => handleChange('interval', value)}
                                placeholder="3600"
                            />
                        </FieldContainer>
                    )}
                </>
            )}

            {formData.inputType === 'database' && (
                <>
                    <FieldContainer>
                        <Label>Database Type</Label>
                        <StyledSelect
                            value={formData.dbType}
                            onChange={(value) => handleChange('dbType', value)}
                        >
                            <option value="postgresql">PostgreSQL</option>
                            <option value="mysql">MySQL</option>
                            <option value="mongodb">MongoDB</option>
                            <option value="sqlite">SQLite</option>
                        </StyledSelect>
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Connection String</Label>
                        <StyledInput
                            type="password"
                            value={formData.connectionString}
                            onChange={(value) => handleChange('connectionString', value)}
                            placeholder="postgresql://user:pass@host:port/db"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Query</Label>
                        <StyledTextarea
                            value={formData.query}
                            onChange={(value) => handleChange('query', value)}
                            placeholder="SELECT * FROM table WHERE condition"
                            rows={4}
                        />
                    </FieldContainer>
                </>
            )}

            {formData.inputType === 'api' && (
                <>
                    <FieldContainer>
                        <Label>API URL</Label>
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
                    <FieldContainer>
                        <Label>Headers (JSON)</Label>
                        <StyledTextarea
                            value={formData.headers}
                            onChange={(value) => handleChange('headers', value)}
                            placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                            rows={3}
                        />
                    </FieldContainer>
                </>
            )}
        </>
    );

    const renderScriptFields = () => (
        <>
            <FieldContainer>
                <Label required>Script Type</Label>
                <StyledSelect
                    value={formData.scriptType}
                    onChange={(value) => handleChange('scriptType', value)}
                >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="bash">Bash</option>
                    <option value="powershell">PowerShell</option>
                    <option value="sql">SQL</option>
                </StyledSelect>
            </FieldContainer>

            <FieldContainer>
                <Label>Execution Environment</Label>
                <StyledSelect
                    value={formData.environment}
                    onChange={(value) => handleChange('environment', value)}
                >
                    <option value="docker">Docker Container (Isolated)</option>
                    <option value="local">Local System</option>
                    <option value="remote">Remote Server</option>
                </StyledSelect>
            </FieldContainer>

            {formData.environment === 'remote' && (
                <>
                    <FieldContainer>
                        <Label>Server Host</Label>
                        <StyledInput
                            value={formData.remoteHost}
                            onChange={(value) => handleChange('remoteHost', value)}
                            placeholder="192.168.1.100"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>SSH Key Path</Label>
                        <StyledInput
                            value={formData.sshKeyPath}
                            onChange={(value) => handleChange('sshKeyPath', value)}
                            placeholder="/path/to/private/key"
                        />
                    </FieldContainer>
                </>
            )}

            <FieldContainer>
                <Label>Timeout (seconds)</Label>
                <StyledInput
                    type="number"
                    value={formData.timeout}
                    onChange={(value) => handleChange('timeout', value)}
                    placeholder="30"
                />
            </FieldContainer>

            <FieldContainer>
                <Label>On Error</Label>
                <StyledSelect
                    value={formData.onError}
                    onChange={(value) => handleChange('onError', value)}
                >
                    <option value="stop">Stop Workflow</option>
                    <option value="continue">Continue</option>
                    <option value="retry">Retry (3 times)</option>
                </StyledSelect>
            </FieldContainer>
        </>
    );

    const renderLogicFields = () => (
        <>
            <FieldContainer>
                <Label required>Logic Type</Label>
                <StyledSelect
                    value={formData.logicType}
                    onChange={(value) => handleChange('logicType', value)}
                >
                    <option value="condition">Condition (If/Then)</option>
                    <option value="loop">Loop/Iterate</option>
                    <option value="merge">Merge Data</option>
                    <option value="filter">Filter Data</option>
                    <option value="transform">Transform Data</option>
                    <option value="switch">Switch/Case</option>
                </StyledSelect>
            </FieldContainer>

            {formData.logicType === 'condition' && (
                <>
                    <FieldContainer>
                        <Label>Condition Expression</Label>
                        <StyledTextarea
                            value={formData.condition}
                            onChange={(value) => handleChange('condition', value)}
                            placeholder="input.value > 0 && input.status === 'active'"
                            rows={2}
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Condition Type</Label>
                        <StyledSelect
                            value={formData.conditionType}
                            onChange={(value) => handleChange('conditionType', value)}
                        >
                            <option value="javascript">JavaScript Expression</option>
                            <option value="jsonpath">JSONPath</option>
                            <option value="regex">Regular Expression</option>
                        </StyledSelect>
                    </FieldContainer>
                </>
            )}

            {formData.logicType === 'loop' && (
                <>
                    <FieldContainer>
                        <Label>Loop Type</Label>
                        <StyledSelect
                            value={formData.loopType}
                            onChange={(value) => handleChange('loopType', value)}
                        >
                            <option value="array">For Each Item</option>
                            <option value="count">Repeat N Times</option>
                            <option value="while">While Condition</option>
                        </StyledSelect>
                    </FieldContainer>
                    {formData.loopType === 'count' && (
                        <FieldContainer>
                            <Label>Iteration Count</Label>
                            <StyledInput
                                type="number"
                                value={formData.iterationCount}
                                onChange={(value) => handleChange('iterationCount', value)}
                                placeholder="10"
                            />
                        </FieldContainer>
                    )}
                    {formData.loopType === 'while' && (
                        <FieldContainer>
                            <Label>While Condition</Label>
                            <StyledInput
                                value={formData.whileCondition}
                                onChange={(value) => handleChange('whileCondition', value)}
                                placeholder="index < data.length"
                            />
                        </FieldContainer>
                    )}
                </>
            )}

            {formData.logicType === 'filter' && (
                <>
                    <FieldContainer>
                        <Label>Filter Expression</Label>
                        <StyledTextarea
                            value={formData.filterExpression}
                            onChange={(value) => handleChange('filterExpression', value)}
                            placeholder="item.status === 'active' && item.score > 80"
                            rows={2}
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Result Type</Label>
                        <StyledSelect
                            value={formData.resultType}
                            onChange={(value) => handleChange('resultType', value)}
                        >
                            <option value="array">Filtered Array</option>
                            <option value="first">First Match</option>
                            <option value="count">Count Only</option>
                        </StyledSelect>
                    </FieldContainer>
                </>
            )}

            {formData.logicType === 'transform' && (
                <>
                    <FieldContainer>
                        <Label>Transform Type</Label>
                        <StyledSelect
                            value={formData.transformType}
                            onChange={(value) => handleChange('transformType', value)}
                        >
                            <option value="map">Map/Transform</option>
                            <option value="reduce">Reduce/Aggregate</option>
                            <option value="group">Group By</option>
                            <option value="sort">Sort</option>
                        </StyledSelect>
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Transform Expression</Label>
                        <StyledTextarea
                            value={formData.transformExpression}
                            onChange={(value) => handleChange('transformExpression', value)}
                            placeholder="({ name, email }) => ({ fullName: name, contact: email })"
                            rows={3}
                        />
                    </FieldContainer>
                </>
            )}
        </>
    );

    const renderOutputFields = () => (
        <>
            <FieldContainer>
                <Label required>Output Type</Label>
                <StyledSelect
                    value={formData.outputType}
                    onChange={(value) => handleChange('outputType', value)}
                >
                    <option value="file">File Export</option>
                    <option value="api">API Call</option>
                    <option value="email">Send Email</option>
                    <option value="database">Database</option>
                    <option value="webhook">Webhook</option>
                    <option value="slack">Slack Message</option>
                    <option value="discord">Discord Message</option>
                    <option value="teams">Microsoft Teams</option>
                </StyledSelect>
            </FieldContainer>

            {formData.outputType === 'file' && (
                <>
                    <FieldContainer>
                        <Label>Export Format</Label>
                        <StyledSelect
                            value={formData.format}
                            onChange={(value) => handleChange('format', value)}
                        >
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                            <option value="xml">XML</option>
                            <option value="txt">Text</option>
                            <option value="excel">Excel (XLSX)</option>
                            <option value="pdf">PDF</option>
                        </StyledSelect>
                    </FieldContainer>
                    <FieldContainer>
                        <Label>File Path</Label>
                        <StyledInput
                            value={formData.filePath}
                            onChange={(value) => handleChange('filePath', value)}
                            placeholder="/output/data.csv"
                        />
                    </FieldContainer>
                </>
            )}

            {formData.outputType === 'api' && (
                <>
                    <FieldContainer>
                        <Label>API URL</Label>
                        <StyledInput
                            value={formData.url}
                            onChange={(value) => handleChange('url', value)}
                            placeholder="https://api.example.com/data"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>HTTP Method</Label>
                        <StyledSelect
                            value={formData.method}
                            onChange={(value) => handleChange('method', value)}
                        >
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                        </StyledSelect>
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Headers (JSON)</Label>
                        <StyledTextarea
                            value={formData.headers}
                            onChange={(value) => handleChange('headers', value)}
                            placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                            rows={3}
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Request Body Template</Label>
                        <StyledTextarea
                            value={formData.bodyTemplate}
                            onChange={(value) => handleChange('bodyTemplate', value)}
                            placeholder='{"data": "{{input.data}}", "timestamp": "{{timestamp}}"}'
                            rows={4}
                        />
                    </FieldContainer>
                </>
            )}

            {formData.outputType === 'email' && (
                <>
                    <FieldContainer>
                        <Label>SMTP Server</Label>
                        <StyledInput
                            value={formData.smtpServer}
                            onChange={(value) => handleChange('smtpServer', value)}
                            placeholder="smtp.gmail.com"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Port</Label>
                        <StyledInput
                            type="number"
                            value={formData.port}
                            onChange={(value) => handleChange('port', value)}
                            placeholder="587"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>From Email</Label>
                        <StyledInput
                            type="email"
                            value={formData.fromEmail}
                            onChange={(value) => handleChange('fromEmail', value)}
                            placeholder="noreply@example.com"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>To Email(s)</Label>
                        <StyledInput
                            value={formData.toEmails}
                            onChange={(value) => handleChange('toEmails', value)}
                            placeholder="user@example.com, admin@example.com"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Subject Template</Label>
                        <StyledInput
                            value={formData.subject}
                            onChange={(value) => handleChange('subject', value)}
                            placeholder="Workflow {{workflow.name}} completed"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Email Template</Label>
                        <StyledTextarea
                            value={formData.emailTemplate}
                            onChange={(value) => handleChange('emailTemplate', value)}
                            placeholder="Hello,\n\nYour workflow has completed successfully.\n\nResults: {{results}}"
                            rows={5}
                        />
                    </FieldContainer>
                </>
            )}

            {formData.outputType === 'slack' && (
                <>
                    <FieldContainer>
                        <Label>Slack Webhook URL</Label>
                        <StyledInput
                            type="password"
                            value={formData.slackWebhook}
                            onChange={(value) => handleChange('slackWebhook', value)}
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
                        <Label>Message Template</Label>
                        <StyledTextarea
                            value={formData.messageTemplate}
                            onChange={(value) => handleChange('messageTemplate', value)}
                            placeholder="🤖 Workflow completed: {{workflow.name}}\nStatus: {{status}}\nResults: {{results}}"
                            rows={4}
                        />
                    </FieldContainer>
                </>
            )}

            {formData.outputType === 'database' && (
                <>
                    <FieldContainer>
                        <Label>Database Type</Label>
                        <StyledSelect
                            value={formData.dbType}
                            onChange={(value) => handleChange('dbType', value)}
                        >
                            <option value="postgresql">PostgreSQL</option>
                            <option value="mysql">MySQL</option>
                            <option value="mongodb">MongoDB</option>
                            <option value="sqlite">SQLite</option>
                        </StyledSelect>
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Connection String</Label>
                        <StyledInput
                            type="password"
                            value={formData.connectionString}
                            onChange={(value) => handleChange('connectionString', value)}
                            placeholder="postgresql://user:pass@host:port/db"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Operation</Label>
                        <StyledSelect
                            value={formData.operation}
                            onChange={(value) => handleChange('operation', value)}
                        >
                            <option value="insert">Insert</option>
                            <option value="update">Update</option>
                            <option value="upsert">Upsert</option>
                            <option value="delete">Delete</option>
                        </StyledSelect>
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Table Name</Label>
                        <StyledInput
                            value={formData.tableName}
                            onChange={(value) => handleChange('tableName', value)}
                            placeholder="results"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Data Mapping (JSON)</Label>
                        <StyledTextarea
                            value={formData.dataMapping}
                            onChange={(value) => handleChange('dataMapping', value)}
                            placeholder='{"name": "{{input.name}}", "result": "{{output.result}}", "timestamp": "{{timestamp}}"}'
                            rows={4}
                        />
                    </FieldContainer>
                </>
            )}
        </>
    );

    const renderAnsibleFields = () => (
        <>
            <FieldContainer>
                <Label required>Playbook Type</Label>
                <StyledSelect
                    value={formData.playbookType}
                    onChange={(value) => handleChange('playbookType', value)}
                >
                    <option value="inline">Inline Playbook</option>
                    <option value="file">Playbook File</option>
                    <option value="git">Git Repository</option>
                </StyledSelect>
            </FieldContainer>

            {formData.playbookType === 'file' && (
                <FieldContainer>
                    <Label>Playbook File Path</Label>
                    <StyledInput
                        value={formData.playbookPath}
                        onChange={(value) => handleChange('playbookPath', value)}
                        placeholder="/path/to/playbook.yml"
                    />
                </FieldContainer>
            )}

            {formData.playbookType === 'git' && (
                <>
                    <FieldContainer>
                        <Label>Git Repository URL</Label>
                        <StyledInput
                            value={formData.gitRepo}
                            onChange={(value) => handleChange('gitRepo', value)}
                            placeholder="https://github.com/user/ansible-playbooks.git"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Branch/Tag</Label>
                        <StyledInput
                            value={formData.gitBranch}
                            onChange={(value) => handleChange('gitBranch', value)}
                            placeholder="main"
                        />
                    </FieldContainer>
                    <FieldContainer>
                        <Label>Playbook File in Repo</Label>
                        <StyledInput
                            value={formData.playbookFile}
                            onChange={(value) => handleChange('playbookFile', value)}
                            placeholder="site.yml"
                        />
                    </FieldContainer>
                </>
            )}

            <FieldContainer>
                <Label>Inventory Type</Label>
                <StyledSelect
                    value={formData.inventoryType}
                    onChange={(value) => handleChange('inventoryType', value)}
                >
                    <option value="inline">Inline Hosts</option>
                    <option value="file">Inventory File</option>
                    <option value="dynamic">Dynamic Inventory</option>
                </StyledSelect>
            </FieldContainer>

            {formData.inventoryType === 'inline' && (
                <FieldContainer>
                    <Label>Target Hosts</Label>
                    <StyledTextarea
                        value={formData.hosts}
                        onChange={(value) => handleChange('hosts', value)}
                        placeholder="192.168.1.10&#10;192.168.1.11&#10;web-server.example.com"
                        rows={3}
                    />
                </FieldContainer>
            )}

            {formData.inventoryType === 'file' && (
                <FieldContainer>
                    <Label>Inventory File Path</Label>
                    <StyledInput
                        value={formData.inventoryPath}
                        onChange={(value) => handleChange('inventoryPath', value)}
                        placeholder="/path/to/inventory.ini"
                    />
                </FieldContainer>
            )}

            <FieldContainer>
                <Label>SSH User</Label>
                <StyledInput
                    value={formData.sshUser}
                    onChange={(value) => handleChange('sshUser', value)}
                    placeholder="ubuntu"
                />
            </FieldContainer>

            <FieldContainer>
                <Label>SSH Key Path</Label>
                <StyledInput
                    value={formData.sshKeyPath}
                    onChange={(value) => handleChange('sshKeyPath', value)}
                    placeholder="/path/to/private/key.pem"
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Extra Variables (JSON)</Label>
                <StyledTextarea
                    value={formData.extraVars}
                    onChange={(value) => handleChange('extraVars', value)}
                    placeholder='{"app_version": "1.2.3", "environment": "production"}'
                    rows={3}
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Tags</Label>
                <StyledInput
                    value={formData.tags}
                    onChange={(value) => handleChange('tags', value)}
                    placeholder="deploy,configure,restart"
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Skip Tags</Label>
                <StyledInput
                    value={formData.skipTags}
                    onChange={(value) => handleChange('skipTags', value)}
                    placeholder="backup,slow-tasks"
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Become (sudo)</Label>
                <StyledSelect
                    value={formData.become}
                    onChange={(value) => handleChange('become', value)}
                >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </StyledSelect>
            </FieldContainer>

            <FieldContainer>
                <Label>Verbosity Level</Label>
                <StyledSelect
                    value={formData.verbosity}
                    onChange={(value) => handleChange('verbosity', value)}
                >
                    <option value="0">Normal</option>
                    <option value="1">Verbose (-v)</option>
                    <option value="2">More Verbose (-vv)</option>
                    <option value="3">Debug (-vvv)</option>
                    <option value="4">Connection Debug (-vvvv)</option>
                </StyledSelect>
            </FieldContainer>

            <FieldContainer>
                <Label>Check Mode (Dry Run)</Label>
                <StyledSelect
                    value={formData.checkMode}
                    onChange={(value) => handleChange('checkMode', value)}
                >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </StyledSelect>
            </FieldContainer>
        </>
    );

    const renderApiPostFields = () => (
        <>
            <FieldContainer>
                <Label required>API URL</Label>
                <StyledInput
                    value={formData.url}
                    onChange={(value) => handleChange('url', value)}
                    placeholder="https://api.example.com/endpoint"
                    fieldName="url"
                    onVariableClick={openVariableHelper}
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Headers (JSON)</Label>
                <StyledTextarea
                    value={formData.headers || '{"Content-Type": "application/json"}'}
                    onChange={(value) => handleChange('headers', value)}
                    placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                    rows={3}
                    fieldName="headers"
                    onVariableClick={openVariableHelper}
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Request Body (JSON)</Label>
                <StyledTextarea
                    value={formData.body || '{}'}
                    onChange={(value) => handleChange('body', value)}
                    placeholder='{"key": "value", "data": "{{input.data}}"}'
                    rows={4}
                    fieldName="body"
                    onVariableClick={openVariableHelper}
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Timeout (seconds)</Label>
                <StyledInput
                    type="number"
                    value={formData.timeout || 30}
                    onChange={(value) => handleChange('timeout', parseInt(value) || 30)}
                    placeholder="30"
                    min="1"
                    max="300"
                />
            </FieldContainer>
        </>
    );

    const renderApiGetFields = () => (
        <>
            <FieldContainer>
                <Label required>API URL</Label>
                <StyledInput
                    value={formData.url}
                    onChange={(value) => handleChange('url', value)}
                    placeholder="https://api.example.com/data"
                    fieldName="url"
                    onVariableClick={openVariableHelper}
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Headers (JSON)</Label>
                <StyledTextarea
                    value={formData.headers || '{"Content-Type": "application/json"}'}
                    onChange={(value) => handleChange('headers', value)}
                    placeholder='{"Authorization": "Bearer token", "Accept": "application/json"}'
                    rows={3}
                    fieldName="headers"
                    onVariableClick={openVariableHelper}
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Query Parameters (JSON)</Label>
                <StyledTextarea
                    value={formData.params || '{}'}
                    onChange={(value) => handleChange('params', value)}
                    placeholder='{"limit": 10, "sort": "desc", "filter": "{{input.filter}}"}'
                    rows={3}
                    fieldName="params"
                    onVariableClick={openVariableHelper}
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Timeout (seconds)</Label>
                <StyledInput
                    type="number"
                    value={formData.timeout || 30}
                    onChange={(value) => handleChange('timeout', parseInt(value) || 30)}
                    placeholder="30"
                    min="1"
                    max="300"
                />
            </FieldContainer>
        </>
    );

    const renderSlackOutputFields = () => (
        <>
            <FieldContainer>
                <Label required>Slack Webhook URL</Label>
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
                    placeholder="#general or @username"
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Bot Username</Label>
                <StyledInput
                    value={formData.username || 'Workflow Bot'}
                    onChange={(value) => handleChange('username', value)}
                    placeholder="Workflow Bot"
                />
            </FieldContainer>

            <FieldContainer>
                <Label required>Message</Label>
                <StyledTextarea
                    value={formData.message || ''}
                    onChange={(value) => handleChange('message', value)}
                    placeholder="Workflow completed! Result: {{input.result}}"
                    rows={4}
                    fieldName="message"
                    onVariableClick={openVariableHelper}
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Icon Emoji</Label>
                <StyledInput
                    value={formData.iconEmoji || ':robot_face:'}
                    onChange={(value) => handleChange('iconEmoji', value)}
                    placeholder=":robot_face:"
                />
            </FieldContainer>
        </>
    );

    const renderScreenOutputFields = () => (
        <>
            <FieldContainer>
                <Label>Output Title</Label>
                <StyledInput
                    value={formData.title || 'Screen Output'}
                    onChange={(value) => handleChange('title', value)}
                    placeholder="Result Title"
                    fieldName="title"
                    onVariableClick={openVariableHelper}
                />
            </FieldContainer>

            <FieldContainer>
                <Label required>Message/Content</Label>
                <StyledTextarea
                    value={formData.message || ''}
                    onChange={(value) => handleChange('message', value)}
                    placeholder="Content to display... Use variables like {{input.data}} or {{previous.result}}"
                    rows={4}
                    fieldName="message"
                    onVariableClick={openVariableHelper}
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Format</Label>
                <StyledSelect
                    value={formData.format || 'text'}
                    onChange={(value) => handleChange('format', value)}
                >
                    <option value="text">Plain Text</option>
                    <option value="json">JSON</option>
                    <option value="table">Table</option>
                    <option value="markdown">Markdown</option>
                </StyledSelect>
            </FieldContainer>

            <FieldContainer>
                <Label>Level</Label>
                <StyledSelect
                    value={formData.level || 'info'}
                    onChange={(value) => handleChange('level', value)}
                >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                </StyledSelect>
            </FieldContainer>

            <FieldContainer>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <input
                        type="checkbox"
                        id="includeTimestamp"
                        checked={formData.includeTimestamp || false}
                        onChange={(e) => handleChange('includeTimestamp', e.target.checked)}
                        style={{
                            accentColor: '#00d4aa',
                            width: '16px',
                            height: '16px'
                        }}
                    />
                    <label 
                        htmlFor="includeTimestamp"
                        style={{
                            fontSize: '14px',
                            color: '#ffffff',
                            cursor: 'pointer'
                        }}
                    >
                        Include Timestamp
                    </label>
                </div>
            </FieldContainer>
        </>
    );

    const renderTransformFields = () => (
        <>
            <FieldContainer>
                <Label required>Input Data</Label>
                <StyledInput
                    value={formData.inputData || '{{previous}}'}
                    onChange={(value) => handleChange('inputData', value)}
                    placeholder="{{previous}} or {{results.nodeId}}"
                    fieldName="inputData"
                    onVariableClick={openVariableHelper}
                />
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Use variables like {'{{previous}}'}, {'{{results.nodeId}}'}, or {'{{input.data}}'}
                </div>
            </FieldContainer>

            <FieldContainer>
                <Label required>Transform Type</Label>
                <StyledSelect
                    value={formData.transformType || 'jq'}
                    onChange={(value) => handleChange('transformType', value)}
                >
                    <option value="jq">JQ</option>
                    <option value="jsonpath">JSONPath</option>
                    <option value="javascript">JavaScript</option>
                    <option value="template">Template</option>
                </StyledSelect>
            </FieldContainer>

            <FieldContainer>
                <Label required>Expression</Label>
                <StyledTextarea
                    value={formData.expression || '.'}
                    onChange={(value) => handleChange('expression', value)}
                    placeholder={getTransformPlaceholder(formData.transformType)}
                    rows={4}
                    fieldName="expression"
                    onVariableClick={openVariableHelper}
                    style={{ fontFamily: 'Monaco, "Lucida Console", monospace' }}
                />
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    {getTransformExamples(formData.transformType)}
                </div>
            </FieldContainer>

            <FieldContainer>
                <Label>Output Variable Name</Label>
                <StyledInput
                    value={formData.outputVariable || 'transformed'}
                    onChange={(value) => handleChange('outputVariable', value)}
                    placeholder="Variable name for result"
                />
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Access result with <code>{`{{results.thisNodeId.${formData.outputVariable || 'transformed'}}}`}</code>
                </div>
            </FieldContainer>
        </>
    );

    const renderUserInputFields = () => (
        <>
            <FieldContainer>
                <Label>Title</Label>
                <StyledInput
                    value={formData.title || 'User Input Required'}
                    onChange={(value) => handleChange('title', value)}
                    placeholder="Modal title"
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Description</Label>
                <StyledTextarea
                    value={formData.description || ''}
                    onChange={(value) => handleChange('description', value)}
                    placeholder="Instructions for the user..."
                    rows={2}
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Allow Mid-Flow</Label>
                <StyledSelect
                    value={formData.allowMidFlow !== false ? 'true' : 'false'}
                    onChange={(value) => handleChange('allowMidFlow', value === 'true')}
                >
                    <option value="true">Yes - Can be used mid-workflow</option>
                    <option value="false">No - Trigger only</option>
                </StyledSelect>
            </FieldContainer>

            <FieldContainer>
                <Label>Form Fields</Label>
                <div style={{ 
                    border: '1px solid #2d2d2d',
                    borderRadius: '6px',
                    padding: '12px',
                    backgroundColor: '#121212'
                }}>
                    {(formData.fields || []).map((field, index) => (
                        <div key={index} style={{
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            padding: '12px',
                            marginBottom: '8px',
                            backgroundColor: '#1a1a1a'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ color: '#ffffff', fontWeight: '500' }}>Field {index + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newFields = [...(formData.fields || [])];
                                        newFields.splice(index, 1);
                                        handleChange('fields', newFields);
                                    }}
                                    style={{
                                        background: '#ef4444',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                <StyledInput
                                    value={field.name || ''}
                                    onChange={(value) => {
                                        const newFields = [...(formData.fields || [])];
                                        newFields[index] = { ...field, name: value };
                                        handleChange('fields', newFields);
                                    }}
                                    placeholder="Field name (variable)"
                                />
                                <StyledInput
                                    value={field.label || ''}
                                    onChange={(value) => {
                                        const newFields = [...(formData.fields || [])];
                                        newFields[index] = { ...field, label: value };
                                        handleChange('fields', newFields);
                                    }}
                                    placeholder="Display label"
                                />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                <StyledSelect
                                    value={field.type || 'text'}
                                    onChange={(value) => {
                                        const newFields = [...(formData.fields || [])];
                                        newFields[index] = { ...field, type: value };
                                        handleChange('fields', newFields);
                                    }}
                                >
                                    <option value="text">Text</option>
                                    <option value="email">Email</option>
                                    <option value="number">Number</option>
                                    <option value="textarea">Textarea</option>
                                    <option value="select">Select</option>
                                </StyledSelect>
                                <StyledSelect
                                    value={field.required ? 'true' : 'false'}
                                    onChange={(value) => {
                                        const newFields = [...(formData.fields || [])];
                                        newFields[index] = { ...field, required: value === 'true' };
                                        handleChange('fields', newFields);
                                    }}
                                >
                                    <option value="false">Optional</option>
                                    <option value="true">Required</option>
                                </StyledSelect>
                            </div>
                            
                            <StyledInput
                                value={field.placeholder || ''}
                                onChange={(value) => {
                                    const newFields = [...(formData.fields || [])];
                                    newFields[index] = { ...field, placeholder: value };
                                    handleChange('fields', newFields);
                                }}
                                placeholder="Placeholder text"
                                style={{ marginBottom: '8px' }}
                            />

                            {field.type === 'select' && (
                                <StyledTextarea
                                    value={field.options ? JSON.stringify(field.options, null, 2) : '[\n  {"value": "option1", "label": "Option 1"},\n  {"value": "option2", "label": "Option 2"}\n]'}
                                    onChange={(value) => {
                                        try {
                                            const options = JSON.parse(value);
                                            const newFields = [...(formData.fields || [])];
                                            newFields[index] = { ...field, options };
                                            handleChange('fields', newFields);
                                        } catch (error) {
                                            // Invalid JSON, don't update
                                        }
                                    }}
                                    placeholder="Options JSON"
                                    rows={3}
                                    style={{ fontFamily: 'Monaco, "Lucida Console", monospace' }}
                                />
                            )}
                        </div>
                    ))}
                    
                    <button
                        type="button"
                        onClick={() => {
                            const newFields = [...(formData.fields || [])];
                            newFields.push({
                                name: `field${newFields.length + 1}`,
                                label: `Field ${newFields.length + 1}`,
                                type: 'text',
                                required: false,
                                placeholder: ''
                            });
                            handleChange('fields', newFields);
                        }}
                        style={{
                            background: '#00d4aa',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '8px 16px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        + Add Field
                    </button>
                </div>
            </FieldContainer>
        </>
    );

    const getTransformPlaceholder = (type) => {
        switch (type) {
            case 'jq': return '.field | length';
            case 'jsonpath': return '$.field[0]';
            case 'javascript': return 'data.field.map(x => x.value)';
            case 'template': return 'Value: {{data.field}}';
            default: return '.';
        }
    };

    const getTransformExamples = (type) => {
        switch (type) {
            case 'jq': return 'Examples: . (identity) • .field • keys • length • .[0] • .items | length';
            case 'jsonpath': return 'Examples: $ (root) • $.field • $.items[0] • $.*.name';
            case 'javascript': return 'Examples: data.field • data.items.length • data.map(x => x.id)';
            case 'template': return 'Examples: {{data.name}} • Count: {{data.items.length}} • {{data.field}}';
            default: return '';
        }
    };

    const renderCodeTab = () => {
        if (node.type === 'script') {
            return (
                <div style={{ padding: '16px', backgroundColor: '#0a0a0a', height: '100%' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <Label>Script Code</Label>
                        <CodeEditor
                            value={formData.script || ''}
                            onChange={(value) => handleChange('script', value)}
                            language={formData.scriptType || 'javascript'}
                            placeholder={getScriptPlaceholder()}
                            onRun={null}
                        />
                    </div>
                </div>
            );
        }

        if (node.type === 'ansible' && formData.playbookType === 'inline') {
            return (
                <div style={{ padding: '16px', backgroundColor: '#0a0a0a', height: '100%' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <Label>Ansible Playbook (YAML)</Label>
                        <CodeEditor
                            value={formData.playbook || ''}
                            onChange={(value) => handleChange('playbook', value)}
                            language="yaml"
                            placeholder={getAnsiblePlaceholder()}
                            onRun={null}
                        />
                    </div>
                </div>
            );
        }

        return null;
    };

    const getScriptPlaceholder = () => {
        switch (formData.scriptType) {
            case 'python':
                return `# Your Python code here
import json
import sys

# Input data is available in 'input_data' variable
# You can access it like: input_data['key']

result = {
    "message": "Hello from Python",
    "processed": True,
    "data": input_data
}

# Output result as JSON
print(json.dumps(result))`;

            case 'bash':
                return `#!/bin/bash
# Your bash script here
# Input data is available in $INPUT_JSON environment variable

set -e  # Exit on error

echo "Processing input data..."

# Parse input JSON (requires jq)
# VALUE=$(echo "$INPUT_JSON" | jq -r '.value')

# Your logic here
echo "Script executed successfully"

# Output result as JSON
echo '{"message": "Hello from Bash", "status": "success"}'`;

            case 'powershell':
                return `# Your PowerShell code here
# Input data is available in $InputData variable

$result = @{
    message = "Hello from PowerShell"
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    data = $InputData
}

# Output result as JSON
$result | ConvertTo-Json -Depth 10`;

            case 'sql':
                return `-- Your SQL query here
-- Input parameters can be referenced as {{input.parameter}}

SELECT 
    id,
    name,
    created_at,
    '{{input.status}}' as filter_status
FROM users 
WHERE status = '{{input.status}}'
    AND created_at >= '{{input.start_date}}'
ORDER BY created_at DESC
LIMIT {{input.limit | default: 100}};`;

            default:
                return `// Your JavaScript code here
// Input data is available in 'input' variable

const result = {
    message: "Hello from JavaScript",
    timestamp: new Date().toISOString(),
    processedData: input
};

// Perform your logic here
if (input && input.data) {
    result.itemCount = Array.isArray(input.data) ? input.data.length : 1;
}

// Return the result
return result;`;
        }
    };

    const getAnsiblePlaceholder = () => {
        return `---
- name: Sample Ansible Playbook
  hosts: all
  become: yes
  vars:
    app_name: "{{ app_name | default('myapp') }}"
    app_version: "{{ app_version | default('latest') }}"
  
  tasks:
    - name: Update package cache
      apt:
        update_cache: yes
      when: ansible_os_family == "Debian"
    
    - name: Install required packages
      package:
        name:
          - curl
          - wget
          - unzip
        state: present
    
    - name: Create application directory
      file:
        path: "/opt/{{ app_name }}"
        state: directory
        mode: '0755'
    
    - name: Download application
      get_url:
        url: "https://releases.example.com/{{ app_name }}/{{ app_version }}/{{ app_name }}.tar.gz"
        dest: "/tmp/{{ app_name }}.tar.gz"
        mode: '0644'
    
    - name: Extract application
      unarchive:
        src: "/tmp/{{ app_name }}.tar.gz"
        dest: "/opt/{{ app_name }}"
        remote_src: yes
        creates: "/opt/{{ app_name }}/bin/{{ app_name }}"
    
    - name: Start application service
      systemd:
        name: "{{ app_name }}"
        state: started
        enabled: yes`;
    };

    const shouldShowCodeTab = () => {
        return (node.type === 'script') || 
               (node.type === 'ansible' && formData.playbookType === 'inline');
    };

    const renderGeneralTab = () => (
        <div style={{ 
            padding: '16px',
            backgroundColor: '#0a0a0a'
        }}>
            <FieldContainer>
                <Label required>Node Name</Label>
                <StyledInput
                    value={formData.label}
                    onChange={(value) => handleChange('label', value)}
                    placeholder="Enter node name"
                />
            </FieldContainer>

            <FieldContainer>
                <Label>Description</Label>
                <StyledTextarea
                    value={formData.description}
                    onChange={(value) => handleChange('description', value)}
                    placeholder="Describe what this node does..."
                />
            </FieldContainer>

            {renderNodeSpecificFields()}
        </div>
    );

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '500px',
            height: '100vh',
            backgroundColor: '#121212',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Inter", sans-serif'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #2d2d2d',
                backgroundColor: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#ffffff'
                }}>
                    Edit {node.type === 'ansible' ? 'Ansible' : node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node
                </h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        color: '#b3b3b3',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#2d2d2d';
                        e.target.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#b3b3b3';
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                backgroundColor: '#1a1a1a',
                borderBottom: '1px solid #2d2d2d'
            }}>
                <button
                    onClick={() => setActiveTab('general')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: activeTab === 'general' ? '#2d2d2d' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'general' ? '2px solid #00d4aa' : '2px solid transparent',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: activeTab === 'general' ? '#00d4aa' : '#b3b3b3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'general') {
                            e.target.style.backgroundColor = '#2d2d2d';
                            e.target.style.color = '#ffffff';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'general') {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#b3b3b3';
                        }
                    }}
                >
                    <Settings size={16} />
                    General
                </button>
                {shouldShowCodeTab() && (
                    <button
                        onClick={() => setActiveTab('code')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: activeTab === 'code' ? '#2d2d2d' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'code' ? '2px solid #00d4aa' : '2px solid transparent',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: activeTab === 'code' ? '#00d4aa' : '#b3b3b3',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== 'code') {
                                e.target.style.backgroundColor = '#2d2d2d';
                                e.target.style.color = '#ffffff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== 'code') {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#b3b3b3';
                            }
                        }}
                    >
                        <Code size={16} />
                        {node.type === 'ansible' ? 'Playbook' : 'Code'}
                    </button>
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'general' && renderGeneralTab()}
                {activeTab === 'code' && renderCodeTab()}
            </div>

            {/* Footer */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid #2d2d2d',
                backgroundColor: '#1a1a1a',
                display: 'flex',
                gap: '12px',
                justifyContent: 'space-between'
            }}>
                <button
                    onClick={handleDelete}
                    style={{
                        padding: '10px 16px',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        fontFamily: '"Inter", sans-serif'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#b91c1c';
                        e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#dc2626';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    <Trash2 size={14} />
                    Delete
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: 'transparent',
                            color: '#b3b3b3',
                            border: '1px solid #404040',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            fontFamily: '"Inter", sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#2d2d2d';
                            e.target.style.color = '#ffffff';
                            e.target.style.borderColor = '#505050';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#b3b3b3';
                            e.target.style.borderColor = '#404040';
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, #00d4aa 0%, #1fbad3 100%)',
                            color: '#000000',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 16px rgba(0, 212, 170, 0.2)',
                            fontFamily: '"Inter", sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(0, 212, 170, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 16px rgba(0, 212, 170, 0.2)';
                        }}
                    >
                        <Save size={14} />
                        Save
                    </button>
                </div>
            </div>

            {/* Variable Helper Modal */}
            <VariableHelper
                isOpen={showVariableHelper}
                onClose={() => setShowVariableHelper(false)}
                onInsert={handleVariableInsert}
                currentStepIndex={currentStepIndex}
                workflowSteps={workflowSteps}
            />
        </div>
    );
};

export default memo(EnhancedNodeEditor);