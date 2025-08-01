import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Code, Settings, Play, Copy, RotateCcw } from 'lucide-react';
import CodeEditor from './CodeEditor';

const NodeEditor = ({ node, onSave, onDelete, onClose }) => {
    const [formData, setFormData] = useState(node.data);
    const [activeTab, setActiveTab] = useState('general');

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

    const renderGeneralTab = () => (
        <div style={{ 
            padding: '16px',
            backgroundColor: '#0a0a0a'
        }}>
            <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                    display: 'block', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#ffffff',
                    marginBottom: '6px'
                }}>
                    Node Name
                </label>
                <input
                    type="text"
                    value={formData.label || ''}
                    onChange={(e) => handleChange('label', e.target.value)}
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
                        fontFamily: '"Inter", sans-serif'
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
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                    display: 'block', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#ffffff',
                    marginBottom: '6px'
                }}>
                    Description
                </label>
                <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#121212',
                        border: '1px solid #2d2d2d',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#ffffff',
                        outline: 'none',
                        resize: 'vertical',
                        transition: 'all 0.2s ease',
                        fontFamily: '"Inter", sans-serif'
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
            </div>

            {renderNodeSpecificFields()}
        </div>
    );

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
            default:
                return null;
        }
    };

    const renderInputFields = () => (
        <>
            <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                    display: 'block', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#ffffff',
                    marginBottom: '6px'
                }}>
                    Input Type
                </label>
                <select
                    value={formData.inputType || 'manual'}
                    onChange={(e) => handleChange('inputType', e.target.value)}
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
                        fontFamily: '"Inter", sans-serif'
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
                    <option value="manual">Manual Input</option>
                    <option value="file">File Upload</option>
                    <option value="webhook">Webhook</option>
                    <option value="timer">Timer</option>
                </select>
            </div>

            {formData.inputType === 'file' && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#374151',
                        marginBottom: '4px'
                    }}>
                        File Type
                    </label>
                    <select
                        value={formData.fileType || 'csv'}
                        onChange={(e) => handleChange('fileType', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    >
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                        <option value="xml">XML</option>
                        <option value="txt">Text</option>
                    </select>
                </div>
            )}

            {formData.inputType === 'webhook' && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#374151',
                        marginBottom: '4px'
                    }}>
                        Webhook Endpoint
                    </label>
                    <input
                        type="text"
                        value={formData.endpoint || ''}
                        onChange={(e) => handleChange('endpoint', e.target.value)}
                        placeholder="/webhook"
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                </div>
            )}

            {formData.inputType === 'timer' && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#374151',
                        marginBottom: '4px'
                    }}>
                        Schedule (Cron Expression)
                    </label>
                    <input
                        type="text"
                        value={formData.schedule || ''}
                        onChange={(e) => handleChange('schedule', e.target.value)}
                        placeholder="0 9 * * *"
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                </div>
            )}
        </>
    );

    const renderScriptFields = () => (
        <>
            <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '4px'
                }}>
                    Script Type
                </label>
                <select
                    value={formData.scriptType || 'javascript'}
                    onChange={(e) => handleChange('scriptType', e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="bash">Bash</option>
                </select>
            </div>
        </>
    );

    const renderCodeTab = () => (
        <div style={{ padding: '16px', backgroundColor: '#0a0a0a', height: '100%' }}>
            <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#ffffff',
                    marginBottom: '8px'
                }}>
                    Script Code
                </label>
                <CodeEditor
                    value={formData.script || ''}
                    onChange={(value) => handleChange('script', value)}
                    language={formData.scriptType || 'javascript'}
                    placeholder={getScriptPlaceholder()}
                    onRun={null} // Can add test execution later
                />
            </div>
        </div>
    );

    const getScriptPlaceholder = () => {
        switch (formData.scriptType) {
            case 'python':
                return `# Your Python code here
import json

# Input data is available in 'input_data' variable
result = {"message": "Hello from Python"}

# Output result as JSON
print(json.dumps(result))`;
            case 'bash':
                return `#!/bin/bash
# Your bash script here
# Input data is available in $INPUT_JSON

echo '{"message": "Hello from Bash"}'`;
            default:
                return `// Your JavaScript code here
// Input data is available in 'input' variable
const result = {
    message: "Hello from JavaScript",
    data: input
};

// Return the result
return result;`;
        }
    };

    const renderLogicFields = () => (
        <>
            <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '4px'
                }}>
                    Logic Type
                </label>
                <select
                    value={formData.logicType || 'condition'}
                    onChange={(e) => handleChange('logicType', e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                >
                    <option value="condition">Condition</option>
                    <option value="loop">Loop</option>
                    <option value="merge">Merge</option>
                    <option value="filter">Filter</option>
                </select>
            </div>

            {formData.logicType === 'condition' && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#374151',
                        marginBottom: '4px'
                    }}>
                        Condition
                    </label>
                    <input
                        type="text"
                        value={formData.condition || ''}
                        onChange={(e) => handleChange('condition', e.target.value)}
                        placeholder="input.value > 0"
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                </div>
            )}
        </>
    );

    const renderOutputFields = () => (
        <>
            <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '4px'
                }}>
                    Output Type
                </label>
                <select
                    value={formData.outputType || 'file'}
                    onChange={(e) => handleChange('outputType', e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                >
                    <option value="file">File Export</option>
                    <option value="api">API Call</option>
                    <option value="email">Send Email</option>
                    <option value="database">Database</option>
                </select>
            </div>

            {formData.outputType === 'file' && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#374151',
                        marginBottom: '4px'
                    }}>
                        Export Format
                    </label>
                    <select
                        value={formData.format || 'json'}
                        onChange={(e) => handleChange('format', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    >
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                        <option value="xml">XML</option>
                        <option value="txt">Text</option>
                    </select>
                </div>
            )}
        </>
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
                    Edit Node
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
                {node.type === 'script' && (
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
                        Code
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
        </div>
    );
};

export default NodeEditor;