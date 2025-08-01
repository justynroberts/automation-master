import React, { useState, useEffect, useRef } from 'react';
import { Copy, Search, ChevronDown, ChevronRight, Info, X, Zap } from 'lucide-react';

const VariableHelper = ({ isOpen, onClose, onInsert, currentStepIndex = 0, workflowSteps = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({
        input: true,
        previous: true,
        steps: false,
        context: false,
        env: false
    });
    const [copiedVariable, setCopiedVariable] = useState(null);
    const modalRef = useRef(null);

    // Build available variables based on workflow context
    const buildVariableContext = () => {
        const variables = {
            input: {
                title: 'Initial Input Data',
                icon: '📥',
                description: 'Data provided when the workflow was started',
                variables: [
                    { key: 'input.data', type: 'any', description: 'Main input data' },
                    { key: 'input.userId', type: 'string', description: 'User who started the workflow' },
                    { key: 'input.timestamp', type: 'string', description: 'When the workflow started' },
                    { key: 'input.parameters', type: 'object', description: 'Input parameters' }
                ]
            },
            previous: {
                title: 'Previous Step Output',
                icon: '⬅️',
                description: 'Output from the immediately previous step',
                variables: currentStepIndex > 0 ? [
                    { key: 'previous.result', type: 'any', description: 'Main result from previous step' },
                    { key: 'previous.status', type: 'string', description: 'Execution status' },
                    { key: 'previous.data', type: 'any', description: 'Processed data' },
                    { key: 'previous.metadata', type: 'object', description: 'Step metadata' }
                ] : []
            },
            steps: {
                title: 'Specific Step Outputs',
                icon: '🔗',
                description: 'Outputs from specific steps by name or ID',
                variables: workflowSteps.map((step, index) => {
                    if (index >= currentStepIndex) return null;
                    const stepName = step.data?.label || `Step ${index + 1}`;
                    const stepType = step.type || 'unknown';
                    
                    // Determine the correct property name based on node type
                    let propertyName = 'result'; // default
                    if (stepType === 'apiGet' || stepType === 'apiPost') {
                        propertyName = 'response';
                    }
                    
                    return {
                        key: `steps.${stepName.replace(/\s+/g, '_').toLowerCase()}.${propertyName}`,
                        type: 'any',
                        description: `Output from ${stepName} (${stepType})`
                    };
                }).filter(Boolean)
            },
            context: {
                title: 'Execution Context',
                icon: '⚙️',
                description: 'Information about the current workflow execution',
                variables: [
                    { key: 'context.executionId', type: 'string', description: 'Unique execution identifier' },
                    { key: 'context.workflowId', type: 'string', description: 'Workflow identifier' },
                    { key: 'context.userId', type: 'string', description: 'User running the workflow' },
                    { key: 'context.timestamp', type: 'string', description: 'Current execution time' },
                    { key: 'context.stepIndex', type: 'number', description: 'Current step number' }
                ]
            },
            env: {
                title: 'Environment Variables',
                icon: '🌍',
                description: 'Server environment variables (use carefully)',
                variables: [
                    { key: 'env.NODE_ENV', type: 'string', description: 'Environment (development/production)' },
                    { key: 'env.API_URL', type: 'string', description: 'API base URL' },
                    { key: 'env.CUSTOM_VAR', type: 'string', description: 'Your custom environment variables' }
                ]
            }
        };

        return variables;
    };

    const variables = buildVariableContext();

    // Filter variables based on search term
    const filteredVariables = Object.keys(variables).reduce((acc, category) => {
        const categoryData = variables[category];
        const filteredVars = categoryData.variables.filter(variable =>
            variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            variable.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (filteredVars.length > 0) {
            acc[category] = { ...categoryData, variables: filteredVars };
        }
        
        return acc;
    }, {});

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Handle click outside modal
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const copyToClipboard = async (variable) => {
        const variableText = `{{${variable.key}}}`;
        
        try {
            await navigator.clipboard.writeText(variableText);
            setCopiedVariable(variable.key);
            setTimeout(() => setCopiedVariable(null), 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = variableText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopiedVariable(variable.key);
            setTimeout(() => setCopiedVariable(null), 2000);
        }
    };

    const insertVariable = (variable) => {
        const variableText = `{{${variable.key}}}`;
        onInsert(variableText);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div
                ref={modalRef}
                style={{
                    width: '90%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '12px',
                    border: '1px solid #2d2d2d',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #2d2d2d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Zap size={24} style={{ color: '#00d4aa' }} />
                        <div>
                            <h2 style={{
                                margin: 0,
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#ffffff'
                            }}>
                                Available Variables
                            </h2>
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#888',
                                marginTop: '4px'
                            }}>
                                Click to insert or copy variables for use in your workflow
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#2d2d2d';
                            e.target.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#888';
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '20px 24px 0' }}>
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#666'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search variables..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                backgroundColor: '#121212',
                                border: '1px solid #2d2d2d',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#ffffff',
                                outline: 'none',
                                fontFamily: 'inherit'
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
                </div>

                {/* Variables List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px 24px'
                }}>
                    {Object.keys(filteredVariables).length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#666'
                        }}>
                            <Search size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <p>No variables found matching "{searchTerm}"</p>
                        </div>
                    ) : (
                        Object.keys(filteredVariables).map(category => {
                            const categoryData = filteredVariables[category];
                            const isExpanded = expandedCategories[category];

                            return (
                                <div key={category} style={{ marginBottom: '20px' }}>
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            backgroundColor: '#1a1a1a',
                                            border: '1px solid #2d2d2d',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            marginBottom: '8px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#252525';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#1a1a1a';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '18px' }}>{categoryData.icon}</span>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{
                                                    color: '#ffffff',
                                                    fontWeight: '500',
                                                    fontSize: '16px'
                                                }}>
                                                    {categoryData.title}
                                                </div>
                                                <div style={{
                                                    color: '#888',
                                                    fontSize: '13px',
                                                    marginTop: '2px'
                                                }}>
                                                    {categoryData.description}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                backgroundColor: '#00d4aa20',
                                                color: '#00d4aa',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                {categoryData.variables.length}
                                            </span>
                                            {isExpanded ? <ChevronDown size={18} color="#888" /> : <ChevronRight size={18} color="#888" />}
                                        </div>
                                    </button>

                                    {/* Variables List */}
                                    {isExpanded && (
                                        <div style={{ marginLeft: '16px' }}>
                                            {categoryData.variables.map((variable, index) => (
                                                <div
                                                    key={variable.key}
                                                    style={{
                                                        padding: '12px 16px',
                                                        backgroundColor: '#121212',
                                                        border: '1px solid #2d2d2d',
                                                        borderRadius: '6px',
                                                        marginBottom: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.backgroundColor = '#1a1a1a';
                                                        e.target.style.borderColor = '#404040';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.backgroundColor = '#121212';
                                                        e.target.style.borderColor = '#2d2d2d';
                                                    }}
                                                    onClick={() => insertVariable(variable)}
                                                >
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            color: '#00d4aa',
                                                            fontFamily: 'monospace',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            marginBottom: '4px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {`{{${variable.key}}}`}
                                                        </div>
                                                        <div style={{
                                                            color: '#888',
                                                            fontSize: '13px',
                                                            lineHeight: '1.4'
                                                        }}>
                                                            {variable.description}
                                                        </div>
                                                        <div style={{
                                                            color: '#666',
                                                            fontSize: '12px',
                                                            marginTop: '4px'
                                                        }}>
                                                            Type: {variable.type}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            copyToClipboard(variable);
                                                        }}
                                                        style={{
                                                            padding: '8px',
                                                            backgroundColor: copiedVariable === variable.key ? '#00d4aa20' : '#2d2d2d',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            marginLeft: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            minWidth: '36px',
                                                            height: '36px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (copiedVariable !== variable.key) {
                                                                e.target.style.backgroundColor = '#404040';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (copiedVariable !== variable.key) {
                                                                e.target.style.backgroundColor = '#2d2d2d';
                                                            }
                                                        }}
                                                    >
                                                        <Copy 
                                                            size={16} 
                                                            color={copiedVariable === variable.key ? '#00d4aa' : '#888'} 
                                                        />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #2d2d2d',
                    backgroundColor: '#0f0f0f'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#666',
                        fontSize: '13px'
                    }}>
                        <Info size={16} />
                        <span>Click a variable to insert it, or use the copy button to copy to clipboard</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariableHelper;