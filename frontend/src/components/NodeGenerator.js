import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Sparkles, Send, Loader, Box, Code, Settings, Play, Copy, 
    Trash2, Edit3, History, BarChart3, ArrowLeft, Plus
} from 'lucide-react';
import useGeneratedNodesStore from '../hooks/useGeneratedNodes';
import LLMSettings from './LLMSettings';
import { useAuth } from '../contexts/AuthContext';

const NodeGenerator = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        generatedNodes,
        currentNode,
        nodeStats,
        loading,
        error,
        generationInProgress,
        generateNode,
        fetchGeneratedNodes,
        fetchNodeStats,
        deleteGeneratedNode,
        duplicateNode,
        testNode,
        updateGeneratedNode
    } = useGeneratedNodesStore();

    const [request, setRequest] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [editingNode, setEditingNode] = useState(null);
    const [testInputs, setTestInputs] = useState('{}');
    const [testResults, setTestResults] = useState(null);
    const [showLLMSettings, setShowLLMSettings] = useState(false);

    useEffect(() => {
        if (user) {
            // Fetch generated nodes
            fetchGeneratedNodes().catch(error => {
                console.warn('Failed to load generated nodes:', error.message);
            });
            // Try to fetch stats but don't fail if it errors
            fetchNodeStats().catch(error => {
                console.warn('Failed to load node statistics:', error.message);
            });
        }
    }, [user, fetchGeneratedNodes, fetchNodeStats]);

    const handleGenerateNode = async () => {
        if (!request.trim()) return;
        
        try {
            const newNode = await generateNode(request.trim());
            setRequest('');
            showMessage(`Generated "${newNode.name}" successfully!`, 'success');
        } catch (error) {
            showMessage(`Failed to generate node: ${error.message}`, 'error');
        }
    };

    const handleDeleteNode = async (nodeId, nodeName) => {
        if (!window.confirm(`Are you sure you want to delete "${nodeName}"?`)) {
            return;
        }
        
        try {
            await deleteGeneratedNode(nodeId);
            showMessage('Node deleted successfully', 'success');
        } catch (error) {
            showMessage(`Failed to delete node: ${error.message}`, 'error');
        }
    };

    const handleDuplicateNode = async (nodeId, nodeName) => {
        try {
            const duplicatedNode = await duplicateNode(nodeId, `${nodeName} (Copy)`);
            showMessage(`Duplicated "${duplicatedNode.name}" successfully!`, 'success');
        } catch (error) {
            showMessage(`Failed to duplicate node: ${error.message}`, 'error');
        }
    };

    const handleTestNode = async (nodeId) => {
        try {
            const inputs = JSON.parse(testInputs);
            const result = await testNode(nodeId, inputs);
            setTestResults(result);
            showMessage('Node test completed successfully', 'success');
        } catch (error) {
            showMessage(`Test failed: ${error.message}`, 'error');
        }
    };

    const [message, setMessage] = useState(null);

    const showMessage = (text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const getIconForCategory = (category) => {
        const icons = {
            'Infrastructure': '🏗️',
            'Data': '💾',
            'Communication': '📡',
            'Custom': '📦'
        };
        return icons[category] || '📦';
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0a0a0a',
            fontFamily: '"Inter", sans-serif',
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(0, 212, 170, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(31, 186, 211, 0.05) 0%, transparent 50%)'
        }}>
            {/* Header */}
            <div style={{
                backgroundColor: '#121212',
                borderBottom: '1px solid #2d2d2d',
                padding: '16px 24px'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </button>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
                            }}>
                                <Sparkles size={24} style={{ color: '#ffffff' }} />
                            </div>
                            <div>
                                <h1 style={{
                                    fontSize: '28px',
                                    fontWeight: '700',
                                    color: '#ffffff',
                                    margin: '0',
                                    letterSpacing: '-0.025em'
                                }}>
                                    Node Generator
                                </h1>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#b3b3b3',
                                    margin: '0'
                                }}>
                                    Create custom workflow nodes with AI
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {nodeStats && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                fontSize: '14px',
                                color: '#b3b3b3'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Box size={16} />
                                    <span>{nodeStats.totalNodes} Nodes</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <BarChart3 size={16} />
                                    <span>{Object.keys(nodeStats.categories).length} Categories</span>
                                </div>
                            </div>
                        )}
                        
                        <button
                            onClick={() => setShowLLMSettings(true)}
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
                                e.target.style.borderColor = '#8b5cf6';
                                e.target.style.color = '#8b5cf6';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.borderColor = '#404040';
                                e.target.style.color = '#b3b3b3';
                            }}
                        >
                            <Settings size={16} />
                            LLM Settings
                        </button>
                    </div>
                </div>
            </div>

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
                    textAlign: 'center'
                }}>
                    {message.text}
                </div>
            )}

            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '32px 24px'
            }}>
                {/* Node Generation Section */}
                <div style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2d2d2d',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '32px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%)'
                    }} />

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <Sparkles size={24} style={{ color: '#8b5cf6' }} />
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#ffffff',
                            margin: '0'
                        }}>
                            Generate New Node
                        </h2>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-end'
                    }}>
                        <div style={{ flex: 1 }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '8px',
                                color: '#ffffff'
                            }}>
                                Describe the node you want to create
                            </label>
                            <textarea
                                value={request}
                                onChange={(e) => setRequest(e.target.value)}
                                placeholder="e.g., 'Create a Terraform node that can plan, apply, and destroy infrastructure' or 'Build an API caller node for REST endpoints'"
                                style={{
                                    width: '100%',
                                    height: '120px',
                                    padding: '16px',
                                    backgroundColor: '#121212',
                                    border: '1px solid #404040',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    color: '#ffffff',
                                    resize: 'vertical',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    fontFamily: '"Inter", sans-serif'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                onBlur={(e) => e.target.style.borderColor = '#404040'}
                            />
                        </div>
                        <button
                            onClick={handleGenerateNode}
                            disabled={!request.trim() || generationInProgress}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '16px 24px',
                                background: (!request.trim() || generationInProgress) 
                                    ? '#404040' 
                                    : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: (!request.trim() || generationInProgress) ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                                height: '120px',
                                minWidth: '140px'
                            }}
                            onMouseEnter={(e) => {
                                if (!request.trim() || generationInProgress) return;
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            {generationInProgress ? (
                                <>
                                    <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Generate
                                </>
                            )}
                        </button>
                    </div>

                    <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}>
                        <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#a78bfa',
                            margin: '0 0 8px 0'
                        }}>
                            💡 Example Requests:
                        </h4>
                        <ul style={{
                            margin: '0',
                            paddingLeft: '20px',
                            fontSize: '14px',
                            color: '#d1d5db',
                            lineHeight: '1.6'
                        }}>
                            <li>"Create a Terraform node for AWS infrastructure management"</li>
                            <li>"Build a Docker container runner with environment variables"</li>
                            <li>"Make an API caller for REST endpoints with authentication"</li>
                            <li>"Create a database backup node for PostgreSQL"</li>
                            <li>"Build a Slack notification sender with custom formatting"</li>
                        </ul>
                    </div>
                </div>

                {/* Generated Nodes Grid */}
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
                            borderTop: '3px solid #8b5cf6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                    </div>
                ) : generatedNodes.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '16px',
                        border: '1px solid #2d2d2d'
                    }}>
                        <div style={{
                            margin: '0 auto 24px',
                            width: '64px',
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '16px',
                            backgroundColor: '#2d2d2d',
                            border: '1px solid #404040'
                        }}>
                            <Box size={32} style={{ color: '#8a8a8a' }} />
                        </div>
                        <h3 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#ffffff',
                            marginBottom: '8px'
                        }}>
                            No Generated Nodes Yet
                        </h3>
                        <p style={{
                            fontSize: '16px',
                            color: '#8a8a8a',
                            marginBottom: '32px'
                        }}>
                            Start by describing the type of workflow node you'd like to create above.
                        </p>
                    </div>
                ) : (
                    <div>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#ffffff',
                            marginBottom: '24px'
                        }}>
                            Your Generated Nodes ({generatedNodes.length})
                        </h2>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                            gap: '24px'
                        }}>
                            {generatedNodes.map((node) => (
                                <NodeCard
                                    key={node.id}
                                    node={node}
                                    onDelete={handleDeleteNode}
                                    onDuplicate={handleDuplicateNode}
                                    onTest={handleTestNode}
                                    onEdit={(node) => {
                                        setEditingNode(node);
                                        setShowEditor(true);
                                    }}
                                    getIconForCategory={getIconForCategory}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>

            {/* LLM Settings Modal */}
            {showLLMSettings && (
                <LLMSettings onClose={() => setShowLLMSettings(false)} />
            )}
        </div>
    );
};

const NodeCard = ({ node, onDelete, onDuplicate, onTest, onEdit, getIconForCategory }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #2d2d2d',
            borderRadius: '16px',
            padding: '24px',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#8b5cf6';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#2d2d2d';
            e.currentTarget.style.boxShadow = 'none';
        }}
        >
            {/* Category Badge */}
            <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '4px 8px',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                color: '#a78bfa',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600'
            }}>
                {getIconForCategory(node.category)} {node.category}
            </div>

            {/* Node Header */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#8b5cf6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}>
                    <Box size={24} style={{ color: '#ffffff' }} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                        margin: '0 0 4px 0',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {node.name}
                    </h3>
                    <p style={{
                        margin: '0',
                        fontSize: '14px',
                        color: '#b3b3b3',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {node.description}
                    </p>
                </div>
            </div>

            {/* Node Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{
                    padding: '8px 12px',
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
                        Version
                    </div>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#ffffff'
                    }}>
                        v{node.version}
                    </div>
                </div>
                <div style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                    <div style={{
                        fontSize: '10px',
                        color: '#60a5fa',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '2px'
                    }}>
                        Created
                    </div>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#ffffff'
                    }}>
                        {new Date(node.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => onEdit(node)}
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: 'transparent',
                        border: '1px solid #404040',
                        borderRadius: '8px',
                        color: '#b3b3b3',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#2d2d2d';
                        e.target.style.borderColor = '#8b5cf6';
                        e.target.style.color = '#8b5cf6';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.borderColor = '#404040';
                        e.target.style.color = '#b3b3b3';
                    }}
                >
                    <Edit3 size={14} />
                    Edit
                </button>
                
                <button
                    onClick={() => onDuplicate(node.id, node.name)}
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: 'transparent',
                        border: '1px solid #404040',
                        borderRadius: '8px',
                        color: '#b3b3b3',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#2d2d2d';
                        e.target.style.borderColor = '#06b6d4';
                        e.target.style.color = '#06b6d4';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.borderColor = '#404040';
                        e.target.style.color = '#b3b3b3';
                    }}
                >
                    <Copy size={14} />
                    Copy
                </button>
                
                <button
                    onClick={() => onDelete(node.id, node.name)}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
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
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

export default NodeGenerator;