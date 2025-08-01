import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, FolderOpen, Plus, Trash2, Clock, Workflow, Zap, CheckCircle, AlertCircle, Calendar, User, Upload, Download, FileText, X, Tag, ArrowLeft, Home } from 'lucide-react';
import SequenceWorkflowCanvas from './SequenceWorkflowCanvas';
import ExecutionMonitor from './ExecutionMonitor';
import UserInputModal from './UserInputModal';
import workflowService from '../services/workflowService';
import useWorkflowStore from '../hooks/useWorkflow';

const WorkflowManager = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { 
        workflows, 
        currentWorkflow, 
        nodes, 
        edges, 
        loading: storeLoading, 
        fetchWorkflows, 
        fetchWorkflow,
        createWorkflow: storeCreateWorkflow,
        updateWorkflow: storeUpdateWorkflow,
        deleteWorkflow: storeDeleteWorkflow,
        setNodes: setStoreNodes,
        setEdges: setStoreEdges,
        reset: resetStore,
        clearWorkflow
    } = useWorkflowStore();
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [saveDialogData, setSaveDialogData] = useState({ name: '', description: '', time_saved_minutes: 0, cost_per_hour: 0, tags: [] });
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [localLoading, setLoading] = useState(false);
    const loading = storeLoading || localLoading;
    const [message, setMessage] = useState(null);
    const [, setExecutionStatus] = useState(null);
    const [currentExecutionId, setCurrentExecutionId] = useState(null);
    const [showExecutionMonitor, setShowExecutionMonitor] = useState(false);
    const [recentExecutions, setRecentExecutions] = useState([]);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [importData, setImportData] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [showUserInput, setShowUserInput] = useState(null);
    const fileInputRef = React.useRef(null);

    // This function is now handled by the Zustand store
    // const loadWorkflows = useCallback(async () => {
    //     try {
    //         setLoading(true);
    //         const workflowList = await workflowService.getAllWorkflows();
    //         setWorkflows(workflowList);
    //     } catch (error) {
    //         showMessage(`Failed to load workflows: ${error.message}`, 'error');
    //     } finally {
    //         setLoading(false);
    //     }
    // }, []);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    // Load specific workflow if ID is provided in URL
    useEffect(() => {
        const loadWorkflowFromUrl = async () => {
            if (id && id !== 'new') {
                try {
                    // Clear any existing workflow first to prevent caching
                    clearWorkflow();
                    
                    console.log(`🔄 Loading workflow from URL: ${id}`);
                    await fetchWorkflow(id);
                    
                    // Use a setTimeout to ensure the state has updated
                    setTimeout(() => {
                        const { currentWorkflow: loadedWorkflow } = useWorkflowStore.getState();
                        if (loadedWorkflow) {
                            setSaveDialogData({
                                name: loadedWorkflow.name || '',
                                description: loadedWorkflow.description || '',
                                time_saved_minutes: loadedWorkflow.time_saved_minutes || 0,
                                cost_per_hour: loadedWorkflow.cost_per_hour || 0,
                                tags: loadedWorkflow.tags || []
                            });
                            showMessage(`Loaded workflow: ${loadedWorkflow.name}`, 'success');
                        }
                    }, 100);
                } catch (error) {
                    console.error('Failed to load workflow:', error);
                    showMessage(`Failed to load workflow: ${error.message}`, 'error');
                    // Redirect to new workflow if loading fails
                    navigate('/workflow/new');
                }
            } else if (id === 'new') {
                // Clear everything for new workflow
                console.log('🔄 Setting up new workflow from URL');
                resetStore();
                clearWorkflow();
                setSaveDialogData({ name: '', description: '', time_saved_minutes: 0, cost_per_hour: 0, tags: [] });
                setCurrentExecutionId(null);
                setShowExecutionMonitor(false);
                // Note: Don't clear recentExecutions here as they're independent of the current workflow
            }
        };

        loadWorkflowFromUrl();
    }, [id, navigate, fetchWorkflow, resetStore, clearWorkflow]);


    const showMessage = (text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const updateWorkflow = useCallback(async (workflowData, additionalData = {}) => {
        try {
            setLoading(true);
            const updateData = {
                definition: { 
                    nodes: workflowData.nodes, 
                    edges: workflowData.edges 
                },
                ...additionalData
            };

            await storeUpdateWorkflow(currentWorkflow.id, updateData);
            showMessage('Workflow updated successfully', 'success');
        } catch (error) {
            showMessage(`Failed to update workflow: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [currentWorkflow, storeUpdateWorkflow]);

    const handleSave = useCallback((workflowData) => {
        if (!workflowData.nodes || workflowData.nodes.length === 0) {
            showMessage('Cannot save empty workflow', 'error');
            return;
        }
        
        setStoreNodes(workflowData.nodes);
        setStoreEdges(workflowData.edges);
        
        if (currentWorkflow) {
            // Update existing workflow
            updateWorkflow(workflowData);
        } else {
            // Show save dialog for new workflow
            setEditingWorkflow(null);
            setSaveDialogData({ name: '', description: '', time_saved_minutes: 0, cost_per_hour: 0, tags: [] });
            setShowSaveDialog(true);
        }
    }, [currentWorkflow, updateWorkflow]);

    const pollExecutionStatus = useCallback(async (executionId) => {
        try {
            const execution = await workflowService.getExecution(executionId);
            
            if (execution.status === 'completed') {
                setExecutionStatus('completed');
                // Update recent executions list
                setRecentExecutions(prev => prev.map(exec => 
                    exec.id === executionId ? { ...exec, status: 'completed' } : exec
                ));
                showMessage('Workflow execution completed successfully', 'success');
            } else if (execution.status === 'failed') {
                setExecutionStatus('failed');
                // Update recent executions list
                setRecentExecutions(prev => prev.map(exec => 
                    exec.id === executionId ? { ...exec, status: 'failed' } : exec
                ));
                showMessage(`Workflow execution failed: ${execution.error_message || 'Unknown error'}`, 'error');
            } else if (execution.status === 'cancelled') {
                setExecutionStatus('cancelled');
                // Update recent executions list
                setRecentExecutions(prev => prev.map(exec => 
                    exec.id === executionId ? { ...exec, status: 'cancelled' } : exec
                ));
                showMessage('Workflow execution was cancelled', 'error');
            } else if (execution.status === 'running' || execution.status === 'pending') {
                // Continue polling
                setTimeout(() => pollExecutionStatus(executionId), 2000);
            }
        } catch (error) {
            setExecutionStatus('error');
            showMessage(`Failed to check execution status: ${error.message}`, 'error');
        }
    }, []);

    const handleExecute = useCallback(async (workflowData) => {
        if (!currentWorkflow) {
            showMessage('Please save the workflow before executing', 'error');
            return;
        }

        // Allow multiple concurrent executions - remove blocking check

        try {
            setExecutionStatus('starting');
            const execution = await workflowService.executeWorkflow(currentWorkflow.id);
            setExecutionStatus('running');
            
            const newExecutionId = execution.execution.id;
            setCurrentExecutionId(newExecutionId);
            setShowExecutionMonitor(true);
            
            // Add to recent executions list
            setRecentExecutions(prev => [
                { id: newExecutionId, startTime: Date.now(), status: 'running' },
                ...prev.slice(0, 4) // Keep only last 5 executions
            ]);
            
            showMessage(`Workflow execution started (ID: ${newExecutionId.slice(0, 8)}...)`, 'success');
            
            // Poll for execution status
            pollExecutionStatus(newExecutionId);
        } catch (error) {
            if (error.message === 'USER_INPUT_REQUIRED') {
                // Show the user input modal with data from the error
                setShowUserInput({
                    workflowId: currentWorkflow.id,
                    workflowName: currentWorkflow.name || 'Current Workflow',
                    nodeData: error.userInputRequired || {}
                });
                setExecutionStatus('waiting_for_input');
                return;
            }
            
            setExecutionStatus('error');
            setCurrentExecutionId(null);
            if (error.message.includes('429') || error.message.includes('rate limit')) {
                showMessage('Too many executions. Please wait before trying again.', 'error');
            } else {
                showMessage(`Failed to execute workflow: ${error.message}`, 'error');
            }
        }
    }, [currentWorkflow, pollExecutionStatus, currentExecutionId]);

    const saveWorkflow = async () => {
        if (!saveDialogData.name.trim()) {
            showMessage('Workflow name is required', 'error');
            return;
        }

        try {
            setLoading(true);
            const workflowData = {
                name: saveDialogData.name.trim(),
                description: saveDialogData.description.trim(),
                definition: editingWorkflow ? editingWorkflow.definition : { nodes: nodes, edges: edges },
                time_saved_minutes: parseInt(saveDialogData.time_saved_minutes) || 0,
                cost_per_hour: parseFloat(saveDialogData.cost_per_hour) || 0,
                tags: saveDialogData.tags || []
            };

            if (editingWorkflow) {
                // Update existing workflow
                await storeUpdateWorkflow(editingWorkflow.id, workflowData);
                showMessage('Workflow updated successfully', 'success');
            } else {
                // Create new workflow
                const result = await storeCreateWorkflow(workflowData);
                showMessage('Workflow saved successfully', 'success');
                // Navigate to the saved workflow if we're not already there
                if (!id) {
                    navigate(`/workflow/${result.id}`);
                }
            }
            
            setShowSaveDialog(false);
            setEditingWorkflow(null);
        } catch (error) {
            showMessage(`Failed to save workflow: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };


    const loadWorkflow = async (workflow) => {
        // Navigate to the workflow editor with the specific ID
        navigate(`/workflow/${workflow.id}`);
    };

    const deleteWorkflow = async (workflowId) => {
        if (!window.confirm('Are you sure you want to delete this workflow?')) {
            return;
        }

        try {
            setLoading(true);
            await storeDeleteWorkflow(workflowId);
            
            if (currentWorkflow && currentWorkflow.id === workflowId) {
                resetStore();
            }
            
            showMessage('Workflow deleted successfully', 'success');
        } catch (error) {
            showMessage(`Failed to delete workflow: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const executeWorkflowFromDashboard = async (workflowId) => {
        try {
            setLoading(true);
            const execution = await workflowService.executeWorkflow(workflowId, {});
            const newExecutionId = execution.execution ? execution.execution.id : execution.id;
            
            setCurrentExecutionId(newExecutionId);
            setShowExecutionMonitor(true);
            
            // Add to recent executions list
            setRecentExecutions(prev => [
                { id: newExecutionId, startTime: Date.now(), status: 'running' },
                ...prev.slice(0, 4) // Keep only last 5 executions
            ]);
            
            showMessage('Workflow execution started', 'success');
            
            // Poll for execution status
            pollExecutionStatus(newExecutionId);
        } catch (error) {
            showMessage(`Failed to execute workflow: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const newWorkflow = () => {
        console.log('🆕 Creating new workflow - clearing all state');
        // Immediately clear all state before navigation
        resetStore();
        clearWorkflow();
        setSaveDialogData({ name: '', description: '', time_saved_minutes: 0, cost_per_hour: 0, tags: [] });
        setCurrentExecutionId(null);
        setShowExecutionMonitor(false);
        setRecentExecutions([]);
        
        // Navigate to new workflow route
        navigate('/workflow/new');
    };

    // Filter workflows based on search and tags
    const filteredWorkflows = workflows.filter(workflow => {
        const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (workflow.description && workflow.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesTags = selectedTags.length === 0 || 
                           (workflow.tags && selectedTags.every(tag => workflow.tags.includes(tag)));
        
        return matchesSearch && matchesTags;
    });

    // Get all unique tags from workflows
    const allTags = [...new Set(workflows.flatMap(w => w.tags || []))].sort();

    // Export current workflow
    const exportWorkflow = () => {
        if (!currentWorkflow) {
            showMessage('No workflow loaded to export', 'error');
            return;
        }

        const exportData = {
            name: currentWorkflow.name,
            description: currentWorkflow.description,
            definition: {
                nodes: nodes,
                edges: edges
            },
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentWorkflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_workflow.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('Workflow exported successfully', 'success');
    };

    // Export all workflows
    const exportAllWorkflows = async () => {
        try {
            setLoading(true);
            const allWorkflows = [];
            
            for (const workflow of workflows) {
                await fetchWorkflow(workflow.id);
                const { currentWorkflow: fullWorkflow } = useWorkflowStore.getState();
                allWorkflows.push({
                    name: fullWorkflow.name,
                    description: fullWorkflow.description,
                    definition: fullWorkflow.definition,
                    exportedAt: new Date().toISOString(),
                    version: '1.0'
                });
            }

            const exportData = {
                workflows: allWorkflows,
                exportedAt: new Date().toISOString(),
                totalCount: allWorkflows.length,
                version: '1.0'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `all_workflows_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showMessage(`Exported ${allWorkflows.length} workflows successfully`, 'success');
        } catch (error) {
            showMessage(`Failed to export workflows: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle file import
    const handleFileImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            showMessage('Please select a valid JSON file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                setImportData(content);
                setShowImportDialog(true);
            } catch (error) {
                showMessage('Failed to read file', 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    };

    // Import workflow(s)
    const importWorkflows = async () => {
        try {
            setLoading(true);
            const data = JSON.parse(importData);
            
            // Validate import data
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid file format');
            }

            let workflowsToImport = [];
            
            // Check if it's a single workflow or multiple workflows
            if (data.workflows && Array.isArray(data.workflows)) {
                // Multiple workflows export
                workflowsToImport = data.workflows;
            } else if (data.name && data.definition) {
                // Single workflow export
                workflowsToImport = [data];
            } else {
                throw new Error('Invalid workflow file format');
            }

            let importedCount = 0;
            let errors = [];

            for (const workflowData of workflowsToImport) {
                try {
                    // Validate workflow structure
                    if (!workflowData.name || !workflowData.definition) {
                        errors.push(`Skipped workflow: Missing required fields`);
                        continue;
                    }

                    // Create unique name if workflow already exists
                    let workflowName = workflowData.name;
                    const existingNames = workflows.map(w => w.name);
                    let counter = 1;
                    while (existingNames.includes(workflowName)) {
                        workflowName = `${workflowData.name} (${counter})`;
                        counter++;
                    }

                    const newWorkflow = {
                        name: workflowName,
                        description: workflowData.description || 'Imported workflow',
                        definition: workflowData.definition
                    };

                    await storeCreateWorkflow(newWorkflow);
                    importedCount++;
                } catch (error) {
                    errors.push(`Failed to import "${workflowData.name}": ${error.message}`);
                }
            }

            // Refresh workflows list
            await fetchWorkflows();
            
            setShowImportDialog(false);
            setImportData('');
            
            if (importedCount > 0) {
                showMessage(`Successfully imported ${importedCount} workflow${importedCount > 1 ? 's' : ''}`, 'success');
            }
            
            if (errors.length > 0) {
                console.warn('Import errors:', errors);
                showMessage(`Imported ${importedCount} workflows with ${errors.length} error${errors.length > 1 ? 's' : ''}`, 'error');
            }
        } catch (error) {
            showMessage(`Import failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(4px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    @keyframes slideInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
            <div style={{ 
                height: '100vh', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: '#000000',
                fontFamily: '"Inter", sans-serif',
                backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(0, 212, 170, 0.02) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(31, 186, 211, 0.02) 0%, transparent 50%)'
            }}>

            {/* Message Bar */}
            {message && (
                <div style={{
                    padding: '12px 24px',
                    backgroundColor: message.type === 'error' ? '#2d1b1b' : 
                                   message.type === 'success' ? '#1b2d20' : '#1b202d',
                    borderBottom: '1px solid #2d2d2d',
                    color: message.type === 'error' ? '#ff8a8a' : 
                           message.type === 'success' ? '#86efac' : '#93c5fd',
                    fontSize: '14px',
                    fontWeight: '500',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    {message.text}
                </div>
            )}

            {/* Header Navigation */}
            <div style={{
                padding: '16px 24px',
                backgroundColor: '#121212',
                borderBottom: '1px solid #2d2d2d',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        border: '1px solid #404040',
                        borderRadius: '8px',
                        color: '#b3b3b3',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#2d2d2d';
                        e.target.style.borderColor = '#505050';
                        e.target.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.borderColor = '#404040';
                        e.target.style.color = '#b3b3b3';
                    }}
                >
                    <Home size={16} />
                    Dashboard
                </button>
                
                <button
                    onClick={newWorkflow}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #00d4aa 0%, #1fbad3 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#000000',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 212, 170, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    <Plus size={16} />
                    New Workflow
                </button>

                <button
                    onClick={() => setShowLoadDialog(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        border: '1px solid #404040',
                        borderRadius: '8px',
                        color: '#b3b3b3',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#2d2d2d';
                        e.target.style.borderColor = '#505050';
                        e.target.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.borderColor = '#404040';
                        e.target.style.color = '#b3b3b3';
                    }}
                >
                    <FolderOpen size={16} />
                    Load Workflow
                </button>

                <div style={{ flex: 1 }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {currentWorkflow && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#ffffff',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}>
                            <Workflow size={20} style={{ color: '#00d4aa' }} />
                            {currentWorkflow.name}
                        </div>
                    )}
                    
                    {/* Recent Executions Indicator */}
                    {recentExecutions.length > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {recentExecutions.slice(0, 3).map((exec, index) => (
                                <button
                                    key={exec.id}
                                    onClick={() => {
                                        setCurrentExecutionId(exec.id);
                                        setShowExecutionMonitor(true);
                                    }}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        borderRadius: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: exec.status === 'running' ? '#00d4aa' : 
                                                        exec.status === 'completed' ? '#22c55e' : 
                                                        exec.status === 'failed' ? '#ef4444' : '#6b7280',
                                        color: exec.status === 'running' ? '#000000' : '#ffffff'
                                    }}
                                    title={`Execution ${exec.id.slice(0, 8)} - ${exec.status}`}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                >
                                    <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: 'currentColor'
                                    }} />
                                    {exec.status === 'running' && 'Running'}
                                    {exec.status === 'completed' && 'Done'}
                                    {exec.status === 'failed' && 'Failed'}
                                    {exec.status === 'cancelled' && 'Cancelled'}
                                </button>
                            ))}
                            {recentExecutions.length > 3 && (
                                <span style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    fontWeight: '500'
                                }}>
                                    +{recentExecutions.length - 3} more
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Canvas */}
            <div style={{ flex: 1 }}>
                <SequenceWorkflowCanvas
                    key={currentWorkflow?.id || 'new'}
                    initialNodes={nodes}
                    initialEdges={edges}
                    onSave={handleSave}
                    onExecute={handleExecute}
                    workflowName={currentWorkflow?.name || 'New Workflow'}
                />
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        padding: '32px',
                        borderRadius: '16px',
                        width: '480px',
                        maxWidth: '90vw',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)'
                    }}>
                        <h3 style={{ 
                            margin: '0 0 24px 0', 
                            fontSize: '24px', 
                            fontWeight: '700',
                            color: '#ffffff'
                        }}>
                            {editingWorkflow ? 'Edit Workflow' : 'Save Workflow'}
                        </h3>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '8px',
                                color: '#ffffff'
                            }}>
                                Name *
                            </label>
                            <input
                                type="text"
                                value={saveDialogData.name}
                                onChange={(e) => setSaveDialogData(prev => ({ ...prev, name: e.target.value }))}
                                className="input-primary"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    backgroundColor: '#121212',
                                    border: '1px solid #404040',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    color: '#ffffff',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                placeholder="Enter workflow name"
                                autoFocus
                                onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                                onBlur={(e) => e.target.style.borderColor = '#404040'}
                            />
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '8px',
                                color: '#ffffff'
                            }}>
                                Description
                            </label>
                            <textarea
                                value={saveDialogData.description}
                                onChange={(e) => setSaveDialogData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="input-primary"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    backgroundColor: '#121212',
                                    border: '1px solid #404040',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    color: '#ffffff',
                                    resize: 'vertical',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    fontFamily: '"Inter", sans-serif'
                                }}
                                placeholder="Enter workflow description"
                                onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                                onBlur={(e) => e.target.style.borderColor = '#404040'}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    marginBottom: '8px',
                                    color: '#ffffff'
                                }}>
                                    Time Saved (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={saveDialogData.time_saved_minutes}
                                    onChange={(e) => setSaveDialogData(prev => ({ ...prev, time_saved_minutes: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        backgroundColor: '#121212',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        color: '#ffffff',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    placeholder="0"
                                    onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                                    onBlur={(e) => e.target.style.borderColor = '#404040'}
                                />
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                    How many minutes this workflow saves per execution
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    marginBottom: '8px',
                                    color: '#ffffff'
                                }}>
                                    Cost per Hour ($)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={saveDialogData.cost_per_hour}
                                    onChange={(e) => setSaveDialogData(prev => ({ ...prev, cost_per_hour: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        backgroundColor: '#121212',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        color: '#ffffff',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    placeholder="0.00"
                                    onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                                    onBlur={(e) => e.target.style.borderColor = '#404040'}
                                />
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                    Hourly cost for manual work this replaces
                                </div>
                            </div>
                        </div>

                        {/* Tags Section */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '8px',
                                color: '#ffffff'
                            }}>
                                Tags
                            </label>
                            <TagInput
                                tags={saveDialogData.tags}
                                onChange={(newTags) => setSaveDialogData(prev => ({ ...prev, tags: newTags }))}
                            />
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                Add tags to categorize and organize your workflows
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowSaveDialog(false);
                                    setEditingWorkflow(null);
                                }}
                                className="btn-secondary"
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#2d2d2d',
                                    color: '#ffffff',
                                    border: '1px solid #404040',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveWorkflow}
                                disabled={loading || !saveDialogData.name.trim()}
                                className="btn-primary"
                                style={{
                                    padding: '12px 24px',
                                    background: (loading || !saveDialogData.name.trim()) ? '#8a8a8a' : 'linear-gradient(135deg, #00d4aa 0%, #1fbad3 100%)',
                                    color: '#000000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: (loading || !saveDialogData.name.trim()) ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Save size={16} />
                                {loading ? 'Saving...' : (editingWorkflow ? 'Update' : 'Save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Dialog */}
            {showLoadDialog && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        padding: '32px',
                        borderRadius: '16px',
                        width: '700px',
                        maxWidth: '90vw',
                        maxHeight: '80vh',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '24px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#00d4aa',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FolderOpen size={24} style={{ color: '#000000' }} />
                            </div>
                            <div>
                                <h3 style={{ 
                                    margin: '0', 
                                    fontSize: '24px', 
                                    fontWeight: '700',
                                    color: '#ffffff'
                                }}>
                                    Load Workflow
                                </h3>
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '14px',
                                    color: '#b3b3b3'
                                }}>
                                    Choose a workflow to continue editing
                                </p>
                            </div>
                        </div>
                        
                        {loading ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '60px 20px',
                                color: '#ffffff'
                            }}>
                                <Zap size={32} style={{ 
                                    animation: 'spin 1s linear infinite', 
                                    marginBottom: '16px',
                                    color: '#00d4aa'
                                }} />
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading workflows...</div>
                            </div>
                        ) : workflows.length === 0 ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '60px 20px', 
                                color: '#6b7280'
                            }}>
                                <AlertCircle size={32} style={{ marginBottom: '16px' }} />
                                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No workflows found</div>
                                <div style={{ fontSize: '14px' }}>Create your first workflow to get started</div>
                            </div>
                        ) : (
                            <div style={{ 
                                flex: 1, 
                                overflowY: 'auto', 
                                maxHeight: '500px'
                            }}>
                                {filteredWorkflows.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '40px 20px',
                                        color: '#6b7280'
                                    }}>
                                        <FileText size={24} style={{ marginBottom: '12px' }} />
                                        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                                            {searchTerm || selectedTags.length > 0 ? 'No workflows match your filters' : 'No workflows found'}
                                        </div>
                                        <div style={{ fontSize: '12px' }}>
                                            {searchTerm || selectedTags.length > 0 ? 'Try adjusting your search or tag filters' : 'Create your first workflow to get started'}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                        gap: '16px',
                                        padding: '4px'
                                    }}>
                                        {filteredWorkflows.map((workflow, index) => {
                                            const nodeCount = workflow.definition?.nodes?.length || 0;
                                            const lastModified = new Date(workflow.updated_at);
                                            const isRecent = (Date.now() - lastModified.getTime()) < (24 * 60 * 60 * 1000);
                                            const timeSaved = workflow.time_saved_minutes || 0;
                                            
                                            return (
                                                <div
                                                    key={workflow.id}
                                                    style={{
                                                        backgroundColor: '#121212',
                                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                                        borderRadius: '16px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        backdropFilter: 'blur(12px)',
                                                        animation: `slideInUp 0.3s ease-out ${index * 0.05}s both`
                                                    }}
                                                    onClick={() => loadWorkflow(workflow)}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                                        e.currentTarget.style.borderColor = '#00d4aa';
                                                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 212, 170, 0.15)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    {/* Card Header */}
                                                    <div style={{
                                                        padding: '20px 20px 16px',
                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: '12px',
                                                            marginBottom: '12px'
                                                        }}>
                                                            <div style={{
                                                                width: '48px',
                                                                height: '48px',
                                                                backgroundColor: '#00d4aa',
                                                                borderRadius: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0,
                                                                boxShadow: '0 4px 12px rgba(0, 212, 170, 0.3)'
                                                            }}>
                                                                <Workflow size={24} style={{ color: '#000000' }} />
                                                            </div>
                                                            
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    marginBottom: '4px'
                                                                }}>
                                                                    <h4 style={{
                                                                        margin: 0,
                                                                        fontSize: '16px',
                                                                        fontWeight: '600',
                                                                        color: '#ffffff',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        flex: 1
                                                                    }}>
                                                                        {workflow.name}
                                                                    </h4>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            // Open edit dialog for this workflow
                                                                            setEditingWorkflow(workflow);
                                                                            setSaveDialogData({
                                                                                name: workflow.name,
                                                                                description: workflow.description || '',
                                                                                time_saved_minutes: workflow.time_saved_minutes || 0,
                                                                                cost_per_hour: workflow.cost_per_hour || 0,
                                                                                tags: workflow.tags || []
                                                                            });
                                                                            setShowSaveDialog(true);
                                                                        }}
                                                                        style={{
                                                                            backgroundColor: 'transparent',
                                                                            border: '1px solid #404040',
                                                                            borderRadius: '6px',
                                                                            padding: '4px 8px',
                                                                            color: '#b3b3b3',
                                                                            fontSize: '12px',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s ease'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.target.style.borderColor = '#00d4aa';
                                                                            e.target.style.color = '#00d4aa';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.target.style.borderColor = '#404040';
                                                                            e.target.style.color = '#b3b3b3';
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    {isRecent && (
                                                                        <span style={{
                                                                            padding: '2px 6px',
                                                                            backgroundColor: '#00d4aa',
                                                                            color: '#000000',
                                                                            borderRadius: '8px',
                                                                            fontSize: '9px',
                                                                            fontWeight: '700',
                                                                            textTransform: 'uppercase',
                                                                            letterSpacing: '0.5px'
                                                                        }}>
                                                                            New
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {workflow.description && (
                                                                    <p style={{
                                                                        margin: 0,
                                                                        fontSize: '12px',
                                                                        color: '#b3b3b3',
                                                                        lineHeight: '1.4',
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: 'vertical',
                                                                        overflow: 'hidden'
                                                                    }}>
                                                                        {workflow.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Colored Tags */}
                                                        {workflow.tags && workflow.tags.length > 0 && (
                                                            <div style={{
                                                                display: 'flex',
                                                                flexWrap: 'wrap',
                                                                gap: '6px',
                                                                marginBottom: '12px'
                                                            }}>
                                                                {workflow.tags.slice(0, 3).map((tag, tagIndex) => {
                                                                    const tagColors = [
                                                                        { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#3b82f6' }, // Blue
                                                                        { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)', text: '#8b5cf6' }, // Purple
                                                                        { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', text: '#22c55e' }, // Green
                                                                        { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)', text: '#f97316' }, // Orange
                                                                        { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)', text: '#ec4899' }, // Pink
                                                                        { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#ef4444' }, // Red
                                                                        { bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.4)', text: '#0ea5e9' }, // Sky
                                                                        { bg: 'rgba(0, 212, 170, 0.15)', border: 'rgba(0, 212, 170, 0.4)', text: '#00d4aa' }  // Teal
                                                                    ];
                                                                    
                                                                    // Generate consistent color based on tag name
                                                                    let hash = 0;
                                                                    for (let i = 0; i < tag.length; i++) {
                                                                        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
                                                                    }
                                                                    const colorIndex = Math.abs(hash) % tagColors.length;
                                                                    const tagColor = tagColors[colorIndex];
                                                                    
                                                                    return (
                                                                        <span
                                                                            key={tag}
                                                                            style={{
                                                                                padding: '4px 8px',
                                                                                backgroundColor: tagColor.bg,
                                                                                color: tagColor.text,
                                                                                borderRadius: '12px',
                                                                                fontSize: '10px',
                                                                                fontWeight: '600',
                                                                                border: `1px solid ${tagColor.border}`,
                                                                                textTransform: 'uppercase',
                                                                                letterSpacing: '0.3px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '3px',
                                                                                boxShadow: `0 2px 4px ${tagColor.bg}`
                                                                            }}
                                                                        >
                                                                            <div style={{
                                                                                width: '4px',
                                                                                height: '4px',
                                                                                backgroundColor: tagColor.text,
                                                                                borderRadius: '50%'
                                                                            }} />
                                                                            {tag}
                                                                        </span>
                                                                    );
                                                                })}
                                                                {workflow.tags.length > 3 && (
                                                                    <span style={{
                                                                        padding: '4px 8px',
                                                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                                                        color: '#9ca3af',
                                                                        borderRadius: '12px',
                                                                        fontSize: '10px',
                                                                        fontWeight: '600',
                                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.3px'
                                                                    }}>
                                                                        +{workflow.tags.length - 3}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Card Stats */}
                                                    <div style={{
                                                        padding: '16px 20px'
                                                    }}>
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: '12px',
                                                            marginBottom: '16px'
                                                        }}>
                                                            <div style={{
                                                                padding: '8px 10px',
                                                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                                                borderRadius: '8px',
                                                                border: '1px solid rgba(139, 92, 246, 0.2)'
                                                            }}>
                                                                <div style={{
                                                                    fontSize: '10px',
                                                                    color: '#a78bfa',
                                                                    fontWeight: '600',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.5px',
                                                                    marginBottom: '2px'
                                                                }}>
                                                                    Steps
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '14px',
                                                                    fontWeight: '700',
                                                                    color: '#ffffff'
                                                                }}>
                                                                    {nodeCount}
                                                                </div>
                                                            </div>
                                                            <div style={{
                                                                padding: '8px 10px',
                                                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                                borderRadius: '8px',
                                                                border: '1px solid rgba(34, 197, 94, 0.2)'
                                                            }}>
                                                                <div style={{
                                                                    fontSize: '10px',
                                                                    color: '#4ade80',
                                                                    fontWeight: '600',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.5px',
                                                                    marginBottom: '2px'
                                                                }}>
                                                                    Saves
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '14px',
                                                                    fontWeight: '700',
                                                                    color: '#ffffff'
                                                                }}>
                                                                    {timeSaved}m
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between'
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontSize: '11px',
                                                                color: '#6b7280'
                                                            }}>
                                                                <Calendar size={10} />
                                                                {lastModified.toLocaleDateString()}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        executeWorkflowFromDashboard(workflow.id);
                                                                    }}
                                                                    style={{
                                                                        width: '28px',
                                                                        height: '28px',
                                                                        backgroundColor: 'transparent',
                                                                        border: '1px solid rgba(0, 212, 170, 0.3)',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        color: '#00d4aa',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.target.style.backgroundColor = '#00d4aa';
                                                                        e.target.style.color = '#000000';
                                                                        e.target.style.borderColor = '#00d4aa';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.target.style.backgroundColor = 'transparent';
                                                                        e.target.style.color = '#00d4aa';
                                                                        e.target.style.borderColor = 'rgba(0, 212, 170, 0.3)';
                                                                    }}
                                                                    title="Execute Workflow"
                                                                >
                                                                    <Zap size={12} />
                                                                </button>
                                                                <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteWorkflow(workflow.id);
                                                                }}
                                                                style={{
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    backgroundColor: 'transparent',
                                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    color: '#ef4444',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.backgroundColor = '#ef4444';
                                                                    e.target.style.color = '#ffffff';
                                                                    e.target.style.borderColor = '#ef4444';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.backgroundColor = 'transparent';
                                                                    e.target.style.color = '#ef4444';
                                                                    e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                                                }}
                                                                title="Delete Workflow"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ 
                            display: 'flex', 
                            gap: '12px', 
                            justifyContent: 'flex-end',
                            borderTop: '1px solid #2d2d2d',
                            paddingTop: '24px'
                        }}>
                            <button
                                onClick={() => setShowLoadDialog(false)}
                                className="btn-secondary"
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#2d2d2d',
                                    color: '#ffffff',
                                    border: '1px solid #404040',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#404040';
                                    e.target.style.borderColor = '#505050';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#2d2d2d';
                                    e.target.style.borderColor = '#404040';
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Dialog */}
            {showImportDialog && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        padding: '32px',
                        borderRadius: '16px',
                        width: '600px',
                        maxWidth: '90vw',
                        maxHeight: '80vh',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '24px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#00d4aa',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Upload size={24} style={{ color: '#000000' }} />
                            </div>
                            <div>
                                <h3 style={{ 
                                    margin: '0', 
                                    fontSize: '24px', 
                                    fontWeight: '700',
                                    color: '#ffffff'
                                }}>
                                    Import Workflow
                                </h3>
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '14px',
                                    color: '#b3b3b3'
                                }}>
                                    Review the workflow data before importing
                                </p>
                            </div>
                        </div>
                        
                        <div style={{
                            flex: 1,
                            marginBottom: '24px',
                            minHeight: '200px'
                        }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '8px',
                                color: '#ffffff'
                            }}>
                                Workflow Data Preview
                            </label>
                            <textarea
                                value={importData}
                                onChange={(e) => setImportData(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '300px',
                                    padding: '12px',
                                    backgroundColor: '#0a0a0a',
                                    border: '1px solid #404040',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontFamily: '"JetBrains Mono", monospace',
                                    resize: 'vertical',
                                    outline: 'none'
                                }}
                                placeholder="Paste workflow JSON data here or select a file..."
                                onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                                onBlur={(e) => e.target.style.borderColor = '#404040'}
                            />
                            <p style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                margin: '8px 0 0 0'
                            }}>
                                Supports single workflow exports or bulk exports with multiple workflows.
                            </p>
                        </div>

                        <div style={{ 
                            display: 'flex', 
                            gap: '12px', 
                            justifyContent: 'flex-end',
                            borderTop: '1px solid #2d2d2d',
                            paddingTop: '24px'
                        }}>
                            <button
                                onClick={() => {
                                    setShowImportDialog(false);
                                    setImportData('');
                                }}
                                className="btn-secondary"
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#2d2d2d',
                                    color: '#ffffff',
                                    border: '1px solid #404040',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={importWorkflows}
                                disabled={loading || !importData.trim()}
                                className="btn-primary"
                                style={{
                                    padding: '12px 24px',
                                    background: (loading || !importData.trim()) ? '#8a8a8a' : 'linear-gradient(135deg, #00d4aa 0%, #1fbad3 100%)',
                                    color: '#000000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: (loading || !importData.trim()) ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Upload size={16} />
                                {loading ? 'Importing...' : 'Import Workflow(s)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Input Modal */}
            <UserInputModal
                isOpen={!!showUserInput}
                onClose={() => setShowUserInput(null)}
                onSubmit={async (formData) => {
                    if (!showUserInput) return;
                    
                    setShowUserInput(null);
                    setExecutionStatus('starting');
                    
                    try {
                        // Execute the workflow with the user input data
                        const execution = await workflowService.executeWorkflow(showUserInput.workflowId, { userInput: formData });
                        setExecutionStatus('running');
                        
                        const newExecutionId = execution.execution.id;
                        setCurrentExecutionId(newExecutionId);
                        setShowExecutionMonitor(true);
                        
                        // Add to recent executions list
                        setRecentExecutions(prev => [
                            { id: newExecutionId, startTime: Date.now(), status: 'running' },
                            ...prev.slice(0, 4) // Keep only last 5 executions
                        ]);
                        
                        showMessage(`Workflow execution started (ID: ${newExecutionId.slice(0, 8)}...)`, 'success');
                        
                        // Poll for execution status
                        pollExecutionStatus(newExecutionId);
                    } catch (error) {
                        setExecutionStatus('error');
                        showMessage(`Failed to execute workflow: ${error.message}`, 'error');
                    }
                }}
                nodeData={showUserInput?.nodeData}
                workflowName={showUserInput?.workflowName}
            />

            {/* Execution Monitor */}
            {showExecutionMonitor && currentExecutionId && (
                <ExecutionMonitor
                    executionId={currentExecutionId}
                    onClose={() => {
                        setShowExecutionMonitor(false);
                        // Don't clear currentExecutionId here - let it persist until execution completes
                        // This allows the monitor to be reopened and doesn't block new executions
                    }}
                />
            )}
        </div>
        </>
    );
};

// TagInput Component
const TagInput = ({ tags, onChange }) => {
    const [inputValue, setInputValue] = useState('');

    const handleAddTag = (tagText) => {
        const trimmedTag = tagText.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            onChange([...tags, trimmedTag]);
        }
        setInputValue('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag(inputValue);
        }
    };

    const removeTag = (tagToRemove) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px'
            }}>
                {tags.map((tag, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        backgroundColor: '#00d4aa',
                        color: '#000000',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}>
                        <Tag size={12} />
                        {tag}
                        <button
                            onClick={() => removeTag(tag)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#000000',
                                cursor: 'pointer',
                                padding: '0',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a tag and press Enter..."
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#121212',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: '#ffffff',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                onBlur={(e) => {
                    e.target.style.borderColor = '#404040';
                    if (inputValue.trim()) {
                        handleAddTag(inputValue);
                    }
                }}
            />
        </div>
    );
};

export default WorkflowManager;