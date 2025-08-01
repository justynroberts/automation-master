import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useWorkflowStore from '../hooks/useWorkflow';
import { Plus, Search, Calendar, User, LogOut, Settings, BarChart3, Tag, Sparkles, Zap, Trash2 } from 'lucide-react';
import AnalyticsModal from '../components/AnalyticsModal';
import UserInputModal from '../components/UserInputModal';
import workflowService from '../services/workflowService';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { workflows, loading, fetchWorkflows, deleteWorkflow } = useWorkflowStore();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [executing, setExecuting] = useState(null);
    const [showUserInput, setShowUserInput] = useState(null);

    useEffect(() => {
        const loadWorkflowsSafely = async () => {
            try {
                await fetchWorkflows();
            } catch (error) {
                console.error('Failed to load workflows on mount:', error);
                // Continue execution, don't block the UI
            }
        };
        
        loadWorkflowsSafely();
    }, [fetchWorkflows]);

    const filteredWorkflows = workflows.filter(workflow =>
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (workflow.tags && workflow.tags.some(tag => 
            tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get consistent color for tags based on tag name
    // Execute workflow handler
    const handleExecuteWorkflow = async (workflowId, event, userInputData = null) => {
        event.preventDefault();
        event.stopPropagation();
        
        try {
            setExecuting(workflowId);
            
            // Find the workflow to check for user input trigger
            const workflow = workflows.find(w => w.id === workflowId);
            const hasUserInputTrigger = workflow?.definition?.nodes?.some(node => 
                node.type === 'userInput' && (!node.data?.allowMidFlow || node.data?.allowMidFlow !== false)
            );
            
            // If workflow has user input trigger and we don't have input data yet, show modal
            if (hasUserInputTrigger && !userInputData) {
                const userInputNode = workflow.definition.nodes.find(node => node.type === 'userInput');
                setShowUserInput({
                    workflowId,
                    workflowName: workflow.name,
                    nodeData: userInputNode.data
                });
                setExecuting(null);
                return;
            }
            
            // Execute workflow with or without user input data
            const inputData = userInputData ? { userInput: userInputData } : {};
            const execution = await workflowService.executeWorkflow(workflowId, inputData);
            const executionId = execution.execution ? execution.execution.id : execution.id;
            
            // Show success message (you can enhance this with a proper notification system)
            alert(`Workflow executed successfully! Execution ID: ${executionId.slice(0, 8)}...`);
        } catch (error) {
            if (error.message === 'USER_INPUT_REQUIRED') {
                // Show the user input modal with data from the error
                const workflow = workflows.find(w => w.id === workflowId);
                setShowUserInput({
                    workflowId,
                    workflowName: workflow?.name || 'Unknown Workflow',
                    nodeData: error.userInputRequired || {}
                });
                setExecuting(null);
                return;
            }
            alert(`Failed to execute workflow: ${error.message}`);
        } finally {
            setExecuting(null);
        }
    };

    // Handle user input submission
    const handleUserInputSubmit = async (formData) => {
        if (!showUserInput) return;
        
        setShowUserInput(null);
        // Execute the workflow with the user input data
        await handleExecuteWorkflow(showUserInput.workflowId, { preventDefault: () => {}, stopPropagation: () => {} }, formData);
    };

    // Delete workflow handler
    const handleDeleteWorkflow = async (workflowId, workflowName, event) => {
        event.preventDefault();
        event.stopPropagation();
        setShowDeleteConfirm({ id: workflowId, name: workflowName });
    };

    const confirmDelete = async () => {
        if (!showDeleteConfirm) return;
        
        try {
            await deleteWorkflow(showDeleteConfirm.id);
            setShowDeleteConfirm(null);
        } catch (error) {
            alert(`Failed to delete workflow: ${error.message}`);
        }
    };

    const getTagColor = (tag) => {
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
        return tagColors[colorIndex];
    };

    return (
        <>
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    
                    @keyframes tagPulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.02); }
                    }
                    
                    .workflow-tag:hover {
                        animation: tagPulse 0.3s ease-in-out;
                    }
                `}
            </style>
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#0a0a0a',
                fontFamily: '"Inter", sans-serif',
                backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(0, 212, 170, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(31, 186, 211, 0.05) 0%, transparent 50%)'
            }}>
            {/* Header */}
            <header style={{
                backgroundColor: '#121212',
                borderBottom: '1px solid #2d2d2d',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '0 24px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #00d4aa 0%, #1fbad3 100%)',
                                boxShadow: '0 4px 16px rgba(0, 212, 170, 0.2)'
                            }}>
                                <Plus style={{ width: '24px', height: '24px', color: '#000000' }} />
                            </div>
                            <h1 style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                color: '#ffffff',
                                margin: '0',
                                letterSpacing: '-0.025em'
                            }}>
                                Hooksley Platform Automation
                            </h1>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{
                                fontSize: '14px',
                                color: '#b3b3b3',
                                fontWeight: '500'
                            }}>
                                Welcome, {user?.firstName}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button 
                                    onClick={() => setShowAnalytics(true)}
                                    style={{
                                        padding: '10px',
                                        backgroundColor: 'transparent',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        color: '#b3b3b3',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
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
                                    <BarChart3 style={{ width: '18px', height: '18px' }} />
                                </button>
                                <Link to="/settings">
                                    <button style={{
                                        padding: '10px',
                                        backgroundColor: 'transparent',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        color: '#b3b3b3',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
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
                                    }}>
                                        <Settings style={{ width: '18px', height: '18px' }} />
                                    </button>
                                </Link>
                                <button 
                                    onClick={logout}
                                    style={{
                                        padding: '10px',
                                        backgroundColor: 'transparent',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        color: '#b3b3b3',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
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
                                    <LogOut style={{ width: '18px', height: '18px' }} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={{
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '32px 24px'
            }}>
                {/* Top Actions Bar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px'
                }}>
                    <div style={{ flex: '1', maxWidth: '480px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '18px',
                                height: '18px',
                                color: '#8a8a8a'
                            }} />
                            <input
                                type="text"
                                placeholder="Search workflows, descriptions, or tags..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    paddingLeft: '48px',
                                    paddingRight: '16px',
                                    paddingTop: '14px',
                                    paddingBottom: '14px',
                                    backgroundColor: '#121212',
                                    border: '1px solid #404040',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    fontSize: '16px',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#00d4aa';
                                    e.target.style.backgroundColor = '#1a1a1a';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#404040';
                                    e.target.style.backgroundColor = '#121212';
                                }}
                            />
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', marginLeft: '16px' }}>
                        <Link
                            to="/node-generator"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '14px 20px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                                color: '#ffffff',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.2)';
                            }}
                        >
                            <Sparkles style={{ width: '18px', height: '18px' }} />
                            <span>Generate Node</span>
                        </Link>

                        <Link
                            to="/workflow/new"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '14px 20px',
                                background: 'linear-gradient(135deg, #00d4aa 0%, #1fbad3 100%)',
                                color: '#000000',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 16px rgba(0, 212, 170, 0.2)'
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
                            <Plus style={{ width: '18px', height: '18px' }} />
                            <span>New Workflow</span>
                        </Link>
                    </div>
                </div>

                {/* Workflows Grid */}
                {loading ? (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        padding: '80px 20px',
                        color: '#ffffff'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            border: '3px solid #2d2d2d',
                            borderTop: '3px solid #00d4aa',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                    </div>
                ) : filteredWorkflows.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{
                            margin: '0 auto 24px',
                            width: '64px',
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '16px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2d2d2d'
                        }}>
                            <Plus style={{ width: '32px', height: '32px', color: '#8a8a8a' }} />
                        </div>
                        <h3 style={{ 
                            marginTop: '16px', 
                            fontSize: '24px', 
                            fontWeight: '600', 
                            color: '#ffffff',
                            marginBottom: '8px'
                        }}>
                            No workflows found
                        </h3>
                        <p style={{ 
                            marginTop: '8px', 
                            fontSize: '16px', 
                            color: '#8a8a8a',
                            marginBottom: '32px'
                        }}>
                            {searchTerm 
                                ? 'Try adjusting your search terms.'
                                : 'Get started by creating your first workflow.'
                            }
                        </p>
                        {!searchTerm && (
                            <Link
                                to="/workflow/new"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '14px 20px',
                                    background: 'linear-gradient(135deg, #00d4aa 0%, #1fbad3 100%)',
                                    color: '#000000',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 16px rgba(0, 212, 170, 0.2)'
                                }}
                            >
                                <Plus style={{ width: '18px', height: '18px' }} />
                                <span>Create Workflow</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '24px'
                    }}>
                        {filteredWorkflows.map((workflow) => (
                            <div
                                key={workflow.id}
                                style={{
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #2d2d2d',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                    minHeight: '200px'
                                }}
                                onMouseEnter={(e) => {
                                    setHoveredCard(workflow.id);
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.borderColor = '#00d4aa';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 212, 170, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    setHoveredCard(null);
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = '#2d2d2d';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                                }}
                                onClick={() => navigate(`/workflow/${workflow.id}`)}
                            >
                                {/* Hover action buttons */}
                                {hoveredCard === workflow.id && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        display: 'flex',
                                        gap: '8px',
                                        zIndex: 10
                                    }}>
                                        <button
                                            onClick={(e) => handleExecuteWorkflow(workflow.id, e)}
                                            disabled={executing === workflow.id}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                backgroundColor: 'rgba(0, 212, 170, 0.1)',
                                                border: '1px solid rgba(0, 212, 170, 0.3)',
                                                borderRadius: '8px',
                                                cursor: executing === workflow.id ? 'not-allowed' : 'pointer',
                                                color: '#00d4aa',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                                opacity: executing === workflow.id ? 0.5 : 1
                                            }}
                                            onMouseEnter={(e) => {
                                                if (executing !== workflow.id) {
                                                    e.target.style.backgroundColor = '#00d4aa';
                                                    e.target.style.color = '#000000';
                                                    e.target.style.borderColor = '#00d4aa';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (executing !== workflow.id) {
                                                    e.target.style.backgroundColor = 'rgba(0, 212, 170, 0.1)';
                                                    e.target.style.color = '#00d4aa';
                                                    e.target.style.borderColor = 'rgba(0, 212, 170, 0.3)';
                                                }
                                            }}
                                            title="Execute Workflow"
                                        >
                                            <Zap size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteWorkflow(workflow.id, workflow.name, e)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '8px',
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
                                                e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                                e.target.style.color = '#ef4444';
                                                e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                            }}
                                            title="Delete Workflow"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    marginBottom: '12px'
                                }}>
                                    <h3 style={{ 
                                        fontSize: '18px', 
                                        fontWeight: '600', 
                                        color: '#ffffff',
                                        margin: '0',
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        paddingRight: '12px'
                                    }}>
                                        {workflow.name}
                                    </h3>
                                    {workflow.tags && workflow.tags.length > 0 && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            flexShrink: 0
                                        }}>
                                            <Tag size={12} style={{ color: '#6b7280' }} />
                                            <span style={{
                                                fontSize: '11px',
                                                color: '#6b7280',
                                                fontWeight: '500'
                                            }}>
                                                {workflow.tags.length}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Tags Section */}
                                {workflow.tags && workflow.tags.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '6px',
                                        marginBottom: '12px'
                                    }}>
                                        {workflow.tags.slice(0, 4).map((tag) => {
                                            const tagColor = getTagColor(tag);
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
                                                        width: '3px',
                                                        height: '3px',
                                                        backgroundColor: tagColor.text,
                                                        borderRadius: '50%'
                                                    }} />
                                                    {tag}
                                                </span>
                                            );
                                        })}
                                        {workflow.tags.length > 4 && (
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
                                                +{workflow.tags.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {workflow.description && (
                                    <p style={{ 
                                        fontSize: '14px', 
                                        color: '#b3b3b3',
                                        marginBottom: '16px',
                                        lineHeight: '1.5',
                                        display: '-webkit-box',
                                        WebkitLineClamp: '2',
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {workflow.description}
                                    </p>
                                )}
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between', 
                                    fontSize: '12px', 
                                    color: '#8a8a8a',
                                    marginTop: 'auto'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar style={{ width: '14px', height: '14px' }} />
                                        <span>Updated {formatDate(workflow.updated_at)}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <User style={{ width: '14px', height: '14px' }} />
                                        <span>You</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2d2d2d',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                    }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#ffffff',
                            margin: '0 0 16px 0'
                        }}>
                            Delete Workflow
                        </h3>
                        <p style={{
                            fontSize: '14px',
                            color: '#b3b3b3',
                            lineHeight: '1.5',
                            margin: '0 0 24px 0'
                        }}>
                            Are you sure you want to delete "<strong style={{ color: '#ffffff' }}>{showDeleteConfirm.name}</strong>"? This action cannot be undone.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
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
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#2d2d2d';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#ef4444',
                                    color: '#ffffff',
                                    border: '1px solid #ef4444',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#dc2626';
                                    e.target.style.borderColor = '#dc2626';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#ef4444';
                                    e.target.style.borderColor = '#ef4444';
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics Modal */}
            <AnalyticsModal 
                isOpen={showAnalytics} 
                onClose={() => setShowAnalytics(false)} 
            />

            {/* User Input Modal */}
            <UserInputModal
                isOpen={!!showUserInput}
                onClose={() => setShowUserInput(null)}
                onSubmit={handleUserInputSubmit}
                nodeData={showUserInput?.nodeData}
                workflowName={showUserInput?.workflowName}
            />
        </div>
        </>
    );
};

export default Dashboard;