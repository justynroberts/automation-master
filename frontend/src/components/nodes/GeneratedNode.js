import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Settings, Play, Info, Zap } from 'lucide-react';
import VariableHelper from '../VariableHelper';

const GeneratedNode = ({ data, selected, id }) => {
    const [showConfig, setShowConfig] = useState(false);
    const [formValues, setFormValues] = useState({});
    const [error, setError] = useState(null);
    const [showVariableHelper, setShowVariableHelper] = useState(false);
    const [currentField, setCurrentField] = useState(null);

    // Initialize form values from node data
    useEffect(() => {
        if (data.formFields) {
            const initialValues = {};
            data.formFields.forEach(field => {
                initialValues[field.name] = data[field.name] || field.default || '';
            });
            setFormValues(initialValues);
        }
    }, [data]);

    const handleInputChange = (fieldName, value) => {
        setFormValues(prev => ({
            ...prev,
            [fieldName]: value
        }));
        
        // Update node data
        if (data.onChange) {
            data.onChange({ [fieldName]: value });
        }
    };

    const handleVariableInsert = (variableText) => {
        if (currentField) {
            const currentValue = formValues[currentField] || '';
            const newValue = currentValue + variableText;
            handleInputChange(currentField, newValue);
        }
        setShowVariableHelper(false);
    };

    const openVariableHelper = (fieldName) => {
        setCurrentField(fieldName);
        setShowVariableHelper(true);
    };

    const renderFormField = (field) => {
        const value = formValues[field.name] || '';
        
        switch (field.type) {
            case 'text':
                return (
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            placeholder={field.placeholder || field.label}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                paddingRight: '32px',
                                backgroundColor: '#0a0a0a',
                                border: '1px solid #404040',
                                borderRadius: '4px',
                                color: '#ffffff',
                                fontSize: '12px'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => openVariableHelper(field.name)}
                            style={{
                                position: 'absolute',
                                right: '4px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#00d4aa',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Insert variable"
                        >
                            <Zap size={14} />
                        </button>
                    </div>
                );
            
            case 'number':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => handleInputChange(field.name, parseFloat(e.target.value) || 0)}
                        placeholder={field.placeholder || field.label}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '12px'
                        }}
                    />
                );
            
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '12px'
                        }}
                    >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                );
            
            case 'textarea':
                return (
                    <div style={{ position: 'relative' }}>
                        <textarea
                            value={value}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            placeholder={field.placeholder || field.label}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                paddingRight: '32px',
                                backgroundColor: '#0a0a0a',
                                border: '1px solid #404040',
                                borderRadius: '4px',
                                color: '#ffffff',
                                fontSize: '12px',
                                resize: 'vertical',
                                fontFamily: 'monospace'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => openVariableHelper(field.name)}
                            style={{
                                position: 'absolute',
                                right: '4px',
                                top: '8px',
                                background: 'none',
                                border: 'none',
                                color: '#00d4aa',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Insert variable"
                        >
                            <Zap size={14} />
                        </button>
                    </div>
                );
            
            case 'toggle':
                return (
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }}>
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleInputChange(field.name, e.target.checked)}
                            style={{
                                width: '16px',
                                height: '16px'
                            }}
                        />
                        <span style={{ fontSize: '12px', color: '#b3b3b3' }}>
                            {field.label}
                        </span>
                    </label>
                );
            
            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '12px'
                        }}
                    />
                );
        }
    };

    const nodeColor = data.style?.backgroundColor || '#ec4899';
    const borderColor = selected ? '#ffffff' : data.style?.borderColor || '#f472b6';

    return (
        <div
            style={{
                backgroundColor: '#1a1a1a',
                border: `2px solid ${borderColor}`,
                borderRadius: '12px',
                minWidth: '200px',
                maxWidth: '300px',
                boxShadow: selected ? '0 0 0 2px rgba(255, 255, 255, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease'
            }}
        >
            {/* Input Handles */}
            {data.inputs?.map((input, index) => (
                <Handle
                    key={`input-${index}`}
                    type="target"
                    position={Position.Left}
                    id={input.name}
                    style={{
                        top: `${30 + (index * 20)}px`,
                        backgroundColor: '#404040',
                        border: '2px solid #1a1a1a',
                        width: '8px',
                        height: '8px'
                    }}
                />
            ))}

            {/* Output Handles */}
            {data.outputs?.map((output, index) => (
                <Handle
                    key={`output-${index}`}
                    type="source"
                    position={Position.Right}
                    id={output.name}
                    style={{
                        top: `${30 + (index * 20)}px`,
                        backgroundColor: nodeColor,
                        border: '2px solid #1a1a1a',
                        width: '8px',
                        height: '8px'
                    }}
                />
            ))}

            {/* Node Header */}
            <div style={{
                padding: '12px',
                borderBottom: showConfig ? '1px solid #2d2d2d' : 'none',
                borderRadius: showConfig ? '12px 12px 0 0' : '12px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                }}>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: nodeColor,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Box size={12} style={{ color: '#ffffff' }} />
                    </div>
                    <span style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        color: '#ffffff'
                    }}>
                        {data.label || data.name}
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                        {data.description && (
                            <div 
                                title={data.description}
                                style={{
                                    cursor: 'help',
                                    color: '#8a8a8a'
                                }}
                            >
                                <Info size={12} />
                            </div>
                        )}
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#8a8a8a',
                                cursor: 'pointer',
                                padding: '2px'
                            }}
                            title="Configure node"
                        >
                            <Settings size={12} />
                        </button>
                    </div>
                </div>

                <div style={{
                    fontSize: '11px',
                    color: '#8a8a8a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <span>{data.category}</span>
                    {data.version && (
                        <>
                            <span>•</span>
                            <span>v{data.version}</span>
                        </>
                    )}
                    {data.isGenerated && (
                        <>
                            <span>•</span>
                            <span style={{ color: nodeColor }}>Generated</span>
                        </>
                    )}
                </div>
            </div>

            {/* Configuration Panel */}
            {showConfig && data.formFields && data.formFields.length > 0 && (
                <div style={{
                    padding: '12px',
                    backgroundColor: '#161616',
                    borderRadius: '0 0 12px 12px'
                }}>
                    {data.formFields.map((field, index) => (
                        <div key={field.name} style={{ marginBottom: index < data.formFields.length - 1 ? '8px' : '0' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '11px',
                                color: '#b3b3b3',
                                marginBottom: '4px',
                                fontWeight: '500'
                            }}>
                                {field.label}
                                {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                            </label>
                            {renderFormField(field)}
                        </div>
                    ))}
                    
                    {error && (
                        <div style={{
                            marginTop: '8px',
                            padding: '6px 8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#ef4444'
                        }}>
                            {error}
                        </div>
                    )}
                </div>
            )}
            
            {/* Variable Helper Modal */}
            <VariableHelper
                isOpen={showVariableHelper}
                onClose={() => setShowVariableHelper(false)}
                onInsert={handleVariableInsert}
                currentStepIndex={0}
                workflowSteps={[]}
            />
        </div>
    );
};

export default GeneratedNode;