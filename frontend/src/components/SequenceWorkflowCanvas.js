import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GripVertical, Trash2, Edit3, Play, ChevronDown, ChevronRight, Code, Database, Zap, FileText, Settings, Clock, Server, GitBranch, ArrowLeft, Save, MoreHorizontal, Eye, Download, Upload, Sparkles, Box, Send, Globe, MessageSquare, Monitor, Shuffle, Users } from 'lucide-react';
import EnhancedNodeEditor from './EnhancedNodeEditor';
import useDynamicNodes from '../hooks/useDynamicNodes';
// import DebugPanel from './DebugPanel';
// import NodeLoadingDebug from './NodeLoadingDebug';
import { v4 as uuidv4 } from 'uuid';

const SequenceWorkflowCanvas = ({ 
    initialNodes = [], 
    initialEdges = [],
    onSave,
    onExecute,
    readOnly = false,
    workflowName = 'Untitled Workflow'
}) => {
    const navigate = useNavigate();
    const { generatedNodes, loading: loadingNodes } = useDynamicNodes();
    
    
    
    
    // Convert React Flow nodes to sequence steps
    const [steps, setSteps] = useState(() => {
        return initialNodes.map((node, index) => ({
            id: node.id || uuidv4(),
            type: node.type || 'manual',
            data: node.data || {},
            order: index
        }));
    });

    const [selectedStep, setSelectedStep] = useState(null);
    const [showNodeEditor, setShowNodeEditor] = useState(false);
    const [draggedStep, setDraggedStep] = useState(null);
    const [dropZoneIndex, setDropZoneIndex] = useState(null);
    const [expandedStep, setExpandedStep] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const lastExecutionTime = useRef(0);

    // Sync with props when they change (e.g., when switching workflows or clearing for new workflow)
    useEffect(() => {
        console.log('🎨 Canvas syncing with props:', { 
            initialNodesCount: initialNodes.length, 
            initialEdgesCount: initialEdges.length 
        });
        
        const newSteps = initialNodes.map((node, index) => ({
            id: node.id || uuidv4(),
            type: node.type || 'manual',
            data: node.data || {},
            order: index
        }));
        
        setSteps(newSteps);
        
        // Clear selection when switching workflows
        setSelectedStep(null);
        setShowNodeEditor(false);
        setExpandedStep(null);
    }, [initialNodes, initialEdges]);

    // Node palette for adding new steps
    const nodeTypes = [
        { type: 'input', label: 'Input/Trigger', icon: Settings, color: '#6b7280', description: 'Manual, file, webhook, or timer input' },
        { type: 'script', label: 'Code Script', icon: Code, color: '#8b5cf6', description: 'JavaScript, Python, Bash, PowerShell, or SQL' },
        { type: 'ansible', label: 'Ansible Playbook', icon: Server, color: '#ee0000', description: 'Execute Ansible playbooks and automation' },
        { type: 'logic', label: 'Logic/Control', icon: GitBranch, color: '#f59e0b', description: 'Conditions, loops, filters, and data transformation' },
        { type: 'output', label: 'Output/Action', icon: Zap, color: '#10b981', description: 'API calls, files, email, database, notifications' },
        { type: 'apiPost', label: 'API POST', icon: Send, color: '#00d4aa', description: 'Send POST requests to APIs' },
        { type: 'apiGet', label: 'API GET', icon: Globe, color: '#4ade80', description: 'Fetch data from APIs' },
        { type: 'slackOutput', label: 'Slack Message', icon: MessageSquare, color: '#4a154b', description: 'Send messages to Slack channels' },
        { type: 'screenOutput', label: 'Screen Output', icon: Monitor, color: '#10b981', description: 'Display output to screen with formatting options' },
        { type: 'transform', label: 'Transform', icon: Shuffle, color: '#667eea', description: 'Transform data using JQ, JSONPath, or JavaScript' },
        { type: 'userInput', label: 'User Input', icon: Users, color: '#8b5cf6', description: 'Collect user input via modal form' },
        ...(generatedNodes.length > 0 ? [{ type: 'generated', label: `Generated Nodes (${generatedNodes.length})`, icon: Sparkles, color: '#ec4899', description: 'AI-generated custom workflow nodes', isCategory: true }] : []),
        ...generatedNodes.map(node => ({
            type: 'generatedNode',
            generatedNodeId: node.generatedNodeId,
            label: node.name,
            icon: Box,
            color: node.style?.backgroundColor || '#ec4899',
            description: node.description || 'Generated workflow node',
            category: node.category,
            version: node.version,
            isGenerated: true
        }))
    ];
    
    // Debug: Check for duplicates
    const nodeTypeNames = nodeTypes.map(n => n.label);
    const duplicates = nodeTypeNames.filter((item, index) => nodeTypeNames.indexOf(item) !== index);
    if (duplicates.length > 0) {
        console.log('Duplicate nodes found:', duplicates);
    }
    
    

    // Get step display info
    const getStepInfo = useCallback((step) => {
        const nodeType = nodeTypes.find(nt => nt.type === step.type) || nodeTypes[0];
        const label = step.data?.label || nodeType.label;
        const description = step.data?.description || '';
        
        return {
            ...nodeType,
            label,
            description
        };
    }, []);

    // Add new step
    const addStep = useCallback((nodeType, insertIndex = -1) => {
        const newStep = {
            id: uuidv4(),
            type: nodeType.type,
            data: {
                label: nodeType.label,
                description: nodeType.description || '',
                ...getDefaultStepData(nodeType.type),
                // Add generated node specific data
                ...(nodeType.isGenerated ? {
                    generatedNodeId: nodeType.generatedNodeId,
                    category: nodeType.category,
                    version: nodeType.version,
                    isGenerated: true
                } : {})
            },
            order: insertIndex === -1 ? steps.length : insertIndex
        };

        setSteps(prevSteps => {
            let newSteps;
            if (insertIndex === -1) {
                newSteps = [...prevSteps, newStep];
            } else {
                newSteps = [...prevSteps];
                newSteps.splice(insertIndex, 0, newStep);
            }
            // Reorder all steps
            return newSteps.map((step, index) => ({ ...step, order: index }));
        });
    }, [steps.length]);

    // Get default data for step types
    const getDefaultStepData = (type) => {
        switch (type) {
            case 'input':
                return { inputType: 'manual' };
            case 'script':
                return { scriptType: 'javascript', script: '', environment: 'docker', timeout: 30, onError: 'stop' };
            case 'ansible':
                return { 
                    playbookType: 'inline', 
                    playbook: '', 
                    inventoryType: 'inline', 
                    hosts: '', 
                    sshUser: 'ubuntu',
                    become: 'false',
                    verbosity: '0',
                    checkMode: 'false'
                };
            case 'logic':
                return { logicType: 'condition', condition: '' };
            case 'output':
                return { outputType: 'file', format: 'json' };
            case 'apiPost':
                return { 
                    url: '', 
                    headers: '{"Content-Type": "application/json"}', 
                    body: '{}', 
                    timeout: 30 
                };
            case 'apiGet':
                return { 
                    url: '', 
                    headers: '{"Content-Type": "application/json"}', 
                    params: '{}', 
                    timeout: 30 
                };
            case 'slackOutput':
                return { 
                    webhookUrl: '', 
                    channel: '', 
                    username: 'Workflow Bot', 
                    message: '', 
                    iconEmoji: ':robot_face:' 
                };
            case 'screenOutput':
                return { 
                    title: 'Screen Output', 
                    message: '', 
                    format: 'text', 
                    level: 'info', 
                    includeTimestamp: false 
                };
            case 'transform':
                return { 
                    inputData: '{{previous}}', 
                    transformType: 'jq', 
                    expression: '.', 
                    outputVariable: 'transformed' 
                };
            case 'userInput':
                return {
                    title: 'User Input Required',
                    description: '',
                    allowMidFlow: true,
                    fields: []
                };
            default:
                return {};
        }
    };

    // Delete step
    const deleteStep = useCallback((stepId) => {
        if (window.confirm('Are you sure you want to delete this step?')) {
            setSteps(prevSteps => {
                const filtered = prevSteps.filter(s => s.id !== stepId);
                return filtered.map((step, index) => ({ ...step, order: index }));
            });
        }
    }, []);

    // Edit step
    const editStep = useCallback((step) => {
        setSelectedStep(step);
        setShowNodeEditor(true);
    }, []);

    // Save step changes
    const saveStep = useCallback((stepId, stepData) => {
        setSteps(prevSteps => 
            prevSteps.map(step => 
                step.id === stepId 
                    ? { ...step, data: { ...step.data, ...stepData } }
                    : step
            )
        );
        setShowNodeEditor(false);
        setSelectedStep(null);
    }, []);

    // Drag and drop handlers
    const handleDragStart = useCallback((e, step) => {
        setDraggedStep(step);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedStep(null);
        setDropZoneIndex(null);
    }, []);

    const handleDragOver = useCallback((e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropZoneIndex(index);
    }, []);

    const handleDrop = useCallback((e, targetIndex) => {
        e.preventDefault();
        if (!draggedStep) return;

        setSteps(prevSteps => {
            const newSteps = prevSteps.filter(s => s.id !== draggedStep.id);
            newSteps.splice(targetIndex, 0, draggedStep);
            return newSteps.map((step, index) => ({ ...step, order: index }));
        });
        
        setDraggedStep(null);
        setDropZoneIndex(null);
    }, [draggedStep]);

    // Save workflow
    const handleSave = useCallback(() => {
        // Convert steps back to React Flow format for compatibility
        const nodes = steps.map((step, index) => ({
            id: step.id,
            type: step.type,
            data: step.data,
            position: { x: 250, y: index * 100 }
        }));

        const edges = steps.slice(0, -1).map((step, index) => ({
            id: `${step.id}-${steps[index + 1].id}`,
            source: step.id,
            target: steps[index + 1].id
        }));

        onSave({ nodes, edges });
    }, [steps, onSave]);

    // Execute workflow with rate limiting
    const handleExecute = useCallback(() => {
        const now = Date.now();
        const timeSinceLastExecution = now - lastExecutionTime.current;
        
        // Prevent executions faster than 2 seconds apart
        if (timeSinceLastExecution < 2000) {
            alert(`Please wait ${Math.ceil((2000 - timeSinceLastExecution) / 1000)} seconds before executing again.`);
            return;
        }
        
        if (isExecuting) {
            alert('Execution already in progress. Please wait...');
            return;
        }
        
        if (steps.length === 0) {
            alert('Add some steps to your workflow first!');
            return;
        }
        
        setIsExecuting(true);
        lastExecutionTime.current = now;
        
        handleSave(); // Save first, then execute
        setTimeout(() => {
            onExecute({ nodes: [], edges: [] });
            // Reset executing state after a delay
            setTimeout(() => setIsExecuting(false), 3000);
        }, 100);
    }, [steps, handleSave, onExecute, isExecuting]);

    return (
        <>
            {/* Debug component to diagnose node loading issues */}
            
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateX(-50%) translateY(4px); }
                        to { opacity: 1; transform: translateX(-50%) translateY(0); }
                    }
                    
                    @keyframes slideInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .workflow-step-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        border-color: rgba(255, 255, 255, 0.15);
                    }
                `}
            </style>
            <div style={{
                height: '100%',
                display: 'flex',
                backgroundColor: '#000000',
                fontFamily: '"Inter", sans-serif',
                backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(0, 212, 170, 0.02) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(31, 186, 211, 0.02) 0%, transparent 50%)'
            }}>
            {/* Main Canvas */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Modern Toolbar */}
                <div style={{
                    padding: '0',
                    backgroundColor: '#0a0a0a',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(12px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '64px',
                        padding: '0 24px'
                    }}>
                        {/* Left Section - Navigation & Title */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            flex: 1
                        }}>
                            <button
                                onClick={() => navigate('/dashboard')}
                                style={{
                                    padding: '10px',
                                    backgroundColor: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(8px)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <ArrowLeft size={18} />
                            </button>
                            
                            <div style={{
                                height: '24px',
                                width: '1px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }} />
                            
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <h1 style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    margin: 0,
                                    letterSpacing: '-0.02em'
                                }}>
                                    {workflowName}
                                </h1>
                                <div style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'rgba(0, 212, 170, 0.15)',
                                    border: '1px solid rgba(0, 212, 170, 0.3)',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: '#00d4aa',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {steps.length} {steps.length === 1 ? 'Step' : 'Steps'}
                                </div>
                            </div>
                        </div>

                        {/* Center Section - Quick Actions */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            <ToolbarButton
                                icon={Eye}
                                tooltip="Preview"
                                onClick={() => {}}
                                disabled={steps.length === 0}
                            />
                            <ToolbarButton
                                icon={Save}
                                tooltip="Save Workflow"
                                onClick={handleSave}
                                disabled={steps.length === 0}
                                primary
                            />
                            <ToolbarButton
                                icon={Play}
                                tooltip={isExecuting ? "Execution in progress..." : "Execute Workflow"}
                                onClick={handleExecute}
                                disabled={steps.length === 0 || isExecuting}
                                success={!isExecuting}
                            />
                            <div style={{
                                width: '1px',
                                height: '20px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                margin: '0 4px'
                            }} />
                            <ToolbarButton
                                icon={Upload}
                                tooltip="Import"
                                onClick={() => {}}
                            />
                            <ToolbarButton
                                icon={Download}
                                tooltip="Export"
                                onClick={() => {}}
                                disabled={steps.length === 0}
                            />
                            <ToolbarButton
                                icon={MoreHorizontal}
                                tooltip="More Options"
                                onClick={() => {}}
                            />
                        </div>

                        {/* Right Section - Status */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            flex: 1,
                            justifyContent: 'flex-end'
                        }}>
                            {steps.length > 0 && (
                                <div style={{
                                    fontSize: '12px',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <GripVertical size={14} />
                                    Drag to reorder
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Steps Container */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '32px 24px',
                    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(10, 10, 10, 0.9) 100%)',
                    position: 'relative'
                }}>
                    <div style={{
                        maxWidth: '800px',
                        margin: '0 auto'
                    }}>
                        {/* Start Indicator */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                padding: '8px 16px',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #00d4aa',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#00d4aa',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Workflow Start
                            </div>
                        </div>

                        {/* Steps */}
                        {steps.map((step, index) => {
                            const stepInfo = getStepInfo(step);
                            const IconComponent = stepInfo.icon;
                            const isExpanded = expandedStep === step.id;
                            
                            return (
                                <React.Fragment key={step.id}>
                                    {/* Drop Zone */}
                                    {index === 0 && (
                                        <DropZone 
                                            index={0}
                                            isActive={dropZoneIndex === 0}
                                            onDragOver={(e) => handleDragOver(e, 0)}
                                            onDrop={(e) => handleDrop(e, 0)}
                                            nodeTypes={nodeTypes}
                                            onAddStep={addStep}
                                        />
                                    )}

                                    {/* Step Card */}
                                    <div
                                        className="workflow-step-card"
                                        draggable={!readOnly}
                                        onDragStart={(e) => handleDragStart(e, step)}
                                        onDragEnd={handleDragEnd}
                                        style={{
                                            backgroundColor: 'rgba(26, 26, 26, 0.8)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '16px',
                                            marginBottom: '12px',
                                            cursor: readOnly ? 'default' : 'grab',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            backdropFilter: 'blur(12px)',
                                            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Step Header */}
                                        <div style={{
                                            padding: '16px 20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}>
                                            {/* Step Number */}
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                backgroundColor: stepInfo.color,
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#ffffff',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                flexShrink: 0
                                            }}>
                                                {index + 1}
                                            </div>

                                            {/* Step Icon */}
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                backgroundColor: `${stepInfo.color}20`,
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <IconComponent size={20} style={{ color: stepInfo.color }} />
                                            </div>

                                            {/* Step Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{
                                                    margin: 0,
                                                    fontSize: '16px',
                                                    fontWeight: '600',
                                                    color: '#ffffff',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {stepInfo.label}
                                                </h3>
                                                <p style={{
                                                    margin: '2px 0 0 0',
                                                    fontSize: '12px',
                                                    color: '#6b7280',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {stepInfo.description || `${stepInfo.type} step`}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <button
                                                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        backgroundColor: 'transparent',
                                                        border: '1px solid #404040',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        color: '#b3b3b3',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                                
                                                <button
                                                    onClick={() => editStep(step)}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        backgroundColor: 'transparent',
                                                        border: '1px solid #404040',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        color: '#00d4aa',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <Edit3 size={16} />
                                                </button>

                                                <button
                                                    onClick={() => deleteStep(step.id)}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        backgroundColor: 'transparent',
                                                        border: '1px solid #404040',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        color: '#ef4444',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                {!readOnly && (
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'grab',
                                                        color: '#6b7280'
                                                    }}>
                                                        <GripVertical size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div style={{
                                                padding: '0 20px 20px',
                                                borderTop: '1px solid #2d2d2d',
                                                backgroundColor: '#121212'
                                            }}>
                                                <div style={{
                                                    padding: '16px',
                                                    backgroundColor: '#0a0a0a',
                                                    borderRadius: '8px',
                                                    marginTop: '16px'
                                                }}>
                                                    <pre style={{
                                                        margin: 0,
                                                        fontSize: '12px',
                                                        color: '#b3b3b3',
                                                        fontFamily: '"JetBrains Mono", monospace',
                                                        whiteSpace: 'pre-wrap',
                                                        overflow: 'auto',
                                                        maxHeight: '200px'
                                                    }}>
                                                        {JSON.stringify(step.data, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Connection Line */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{
                                            width: '2px',
                                            height: '24px',
                                            background: 'linear-gradient(to bottom, #404040, transparent)',
                                            borderRadius: '1px'
                                        }} />
                                    </div>

                                    {/* Drop Zone */}
                                    <DropZone 
                                        index={index + 1}
                                        isActive={dropZoneIndex === index + 1}
                                        onDragOver={(e) => handleDragOver(e, index + 1)}
                                        onDrop={(e) => handleDrop(e, index + 1)}
                                        nodeTypes={nodeTypes}
                                        onAddStep={addStep}
                                    />
                                </React.Fragment>
                            );
                        })}

                        {/* Empty State */}
                        {steps.length === 0 && (
                            <EmptyState nodeTypes={nodeTypes} onAddStep={addStep} />
                        )}

                        {/* End Indicator */}
                        {steps.length > 0 && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '16px'
                            }}>
                                <div style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #22c55e',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#22c55e',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Workflow End
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Enhanced Node Editor */}
            {showNodeEditor && selectedStep && (
                <EnhancedNodeEditor
                    node={selectedStep}
                    onSave={saveStep}
                    onDelete={() => {
                        deleteStep(selectedStep.id);
                        setShowNodeEditor(false);
                        setSelectedStep(null);
                    }}
                    onClose={() => {
                        setShowNodeEditor(false);
                        setSelectedStep(null);
                    }}
                    workflowSteps={steps}
                    currentStepIndex={steps.findIndex(step => step.id === selectedStep.id)}
                />
            )}
            
            {/* Debug Panel - Only in development */}
            {/* {process.env.NODE_ENV === 'development' && <DebugPanel />} */}
        </div>
        </>
    );
};

// Drop Zone Component
const DropZone = ({ index, isActive, onDragOver, onDrop, nodeTypes, onAddStep }) => {
    const [showAddMenu, setShowAddMenu] = useState(false);
    const menuRef = useRef(null);
    
    
    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowAddMenu(false);
            }
        };
        
        if (showAddMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showAddMenu]);

    return (
        <div
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={{
                height: isActive ? '60px' : '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
                borderRadius: '8px',
                border: isActive ? '2px dashed #00d4aa' : '1px dashed transparent',
                backgroundColor: isActive ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                position: 'relative'
            }}
        >
            <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: showAddMenu ? '#00d4aa' : '#2d2d2d',
                    border: '1px solid #404040',
                    color: showAddMenu ? '#000000' : '#b3b3b3',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    if (!showAddMenu) {
                        e.target.style.backgroundColor = '#404040';
                        e.target.style.color = '#ffffff';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!showAddMenu) {
                        e.target.style.backgroundColor = '#2d2d2d';
                        e.target.style.color = '#b3b3b3';
                    }
                }}
            >
                <Plus size={16} style={{ transform: showAddMenu ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
            </button>

            {/* Add Menu */}
            {showAddMenu && (
                <div ref={menuRef} style={{
                    position: 'absolute',
                    top: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2d2d2d',
                    borderRadius: '12px',
                    padding: '8px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    zIndex: 1000,
                    minWidth: '200px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}>
                    {nodeTypes.map((nodeType) => {
                        const IconComponent = nodeType.icon;
                        
                        // Skip category headers
                        if (nodeType.isCategory) {
                            return (
                                <div
                                    key={nodeType.type}
                                    style={{
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: nodeType.color,
                                        borderTop: '1px solid #2d2d2d',
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <IconComponent size={14} />
                                    {nodeType.label}
                                </div>
                            );
                        }
                        
                        return (
                            <button
                                key={`${nodeType.type}-${nodeType.generatedNodeId || nodeType.type}`}
                                onClick={() => {
                                    onAddStep(nodeType, index);
                                    setShowAddMenu(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '4px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#2d2d2d';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: `${nodeType.color}20`,
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <IconComponent size={16} style={{ color: nodeType.color }} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#ffffff',
                                        marginBottom: '2px'
                                    }}>
                                        {nodeType.label}
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#6b7280'
                                    }}>
                                        {nodeType.description}
                                        {nodeType.isGenerated && (
                                            <span style={{ 
                                                marginLeft: '8px',
                                                fontSize: '10px',
                                                color: nodeType.color,
                                                fontWeight: '500'
                                            }}>
                                                v{nodeType.version} • {nodeType.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Empty State Component
const EmptyState = ({ nodeTypes, onAddStep }) => {
    return (
        <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#6b7280'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#1a1a1a',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '1px solid #2d2d2d'
            }}>
                <Plus size={32} style={{ color: '#404040' }} />
            </div>
            
            <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '8px'
            }}>
                Start Building Your Workflow
            </h3>
            
            <p style={{
                fontSize: '16px',
                color: '#6b7280',
                marginBottom: '32px',
                maxWidth: '400px',
                margin: '0 auto 32px'
            }}>
                Add steps to create your automation workflow. Each step will execute in sequence from top to bottom.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                maxWidth: '900px',
                margin: '0 auto'
            }}>
                {nodeTypes.filter(n => !n.isCategory).map((nodeType) => {
                    const IconComponent = nodeType.icon;
                    return (
                        <button
                            key={nodeType.generatedNodeId || nodeType.type}
                            onClick={() => onAddStep(nodeType)}
                            style={{
                                padding: '16px',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #2d2d2d',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#2d2d2d';
                                e.target.style.borderColor = nodeType.color;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#1a1a1a';
                                e.target.style.borderColor = '#2d2d2d';
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: `${nodeType.color}20`,
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 12px'
                            }}>
                                <IconComponent size={24} style={{ color: nodeType.color }} />
                            </div>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#ffffff',
                                marginBottom: '4px'
                            }}>
                                {nodeType.label}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: '#6b7280'
                            }}>
                                {nodeType.description}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// Modern Toolbar Button Component
const ToolbarButton = ({ icon: Icon, tooltip, onClick, disabled = false, primary = false, success = false }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    const getButtonStyles = () => {
        if (disabled) {
            return {
                backgroundColor: 'transparent',
                color: 'rgba(255, 255, 255, 0.3)',
                cursor: 'not-allowed'
            };
        }
        
        if (primary) {
            return {
                backgroundColor: 'rgba(0, 212, 170, 0.15)',
                color: '#00d4aa',
                border: '1px solid rgba(0, 212, 170, 0.3)'
            };
        }
        
        if (success) {
            return {
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.3)'
            };
        }
        
        return {
            backgroundColor: 'transparent',
            color: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid transparent'
        };
    };

    const baseStyles = getButtonStyles();

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
                style={{
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                    ...baseStyles
                }}
                onMouseEnter={(e) => {
                    if (!disabled) {
                        setShowTooltip(true);
                        if (primary) {
                            e.target.style.backgroundColor = 'rgba(0, 212, 170, 0.25)';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(0, 212, 170, 0.3)';
                        } else if (success) {
                            e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.25)';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                        } else {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                        }
                    }
                }}
                onMouseLeave={(e) => {
                    setShowTooltip(false);
                    if (!disabled) {
                        e.target.style.backgroundColor = baseStyles.backgroundColor;
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }
                }}
            >
                <Icon size={16} />
            </button>
            
            {/* Tooltip */}
            {showTooltip && !disabled && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px',
                    padding: '6px 10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '500',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    zIndex: 1000,
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    {tooltip}
                    <div style={{
                        position: 'absolute',
                        top: '-4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderBottom: '4px solid rgba(0, 0, 0, 0.9)'
                    }} />
                </div>
            )}
        </div>
    );
};

export default SequenceWorkflowCanvas;