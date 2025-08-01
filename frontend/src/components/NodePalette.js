import React, { useState } from 'react';
import { 
    FileText, Upload, Webhook, Clock,
    Code, Terminal, Zap,
    GitBranch, RotateCcw, Merge, Filter,
    Download, Send, Mail, Database,
    ChevronDown, ChevronRight, Sparkles, Box,
    Globe, MessageSquare, Users
} from 'lucide-react';
import { nodeTemplates } from './nodes';
import useDynamicNodes from '../hooks/useDynamicNodes';

const NodePalette = ({ onAddNode }) => {
    console.log('🔧 NodePalette component rendering');
    console.log('🔧 NodeTemplates imported:', Object.keys(nodeTemplates));
    const { generatedNodes, nodesByCategory, loading: loadingNodes } = useDynamicNodes();
    const [expandedCategories, setExpandedCategories] = useState({
        input: true,
        script: true,
        logic: false,
        output: false,
        api: false,
        messaging: false,
        userInput: true,
        generated: true
    });

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handleDragStart = (event, nodeTemplate) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeTemplate));
        event.dataTransfer.effectAllowed = 'move';
    };

    const categories = {
        input: {
            title: 'Input Nodes',
            color: '#10b981',
            items: {
                manual: { icon: FileText, label: 'Manual Input' },
                file: { icon: Upload, label: 'File Upload' },
                webhook: { icon: Webhook, label: 'Webhook' },
                timer: { icon: Clock, label: 'Timer' }
            }
        },
        script: {
            title: 'Script Nodes',
            color: '#3b82f6',
            items: {
                javascript: { icon: Code, label: 'JavaScript' },
                python: { icon: Zap, label: 'Python' },
                bash: { icon: Terminal, label: 'Bash Script' }
            }
        },
        logic: {
            title: 'Logic Nodes',
            color: '#8b5cf6',
            items: {
                condition: { icon: GitBranch, label: 'Condition' },
                loop: { icon: RotateCcw, label: 'Loop' },
                merge: { icon: Merge, label: 'Merge' },
                filter: { icon: Filter, label: 'Filter' }
            }
        },
        output: {
            title: 'Output Nodes',
            color: '#ef4444',
            items: {
                file: { icon: Download, label: 'File Export' },
                api: { icon: Send, label: 'API Call' },
                email: { icon: Mail, label: 'Send Email' },
                database: { icon: Database, label: 'Database' }
            }
        },
        api: {
            title: 'API Nodes',
            color: '#f59e0b',
            items: {
                post: { icon: Send, label: 'API POST' },
                get: { icon: Globe, label: 'API GET' }
            }
        },
        messaging: {
            title: 'Messaging Nodes',
            color: '#06b6d4',
            items: {
                slack: { icon: MessageSquare, label: 'Slack Message' }
            }
        },
        userInput: {
            title: 'User Input Nodes',
            color: '#8b5cf6',
            items: {
                basic: { icon: Users, label: 'User Input Form' },
                approval: { icon: Users, label: 'Approval Required' }
            }
        }
    };

    console.log('NodePalette - Available categories:', Object.keys(categories));
    console.log('NodePalette - UserInput category:', categories.userInput);

    return (
        <div style={{
            width: '250px',
            backgroundColor: '#121212',
            borderRight: '1px solid #2d2d2d',
            padding: '16px',
            overflowY: 'auto',
            height: '100%',
            fontFamily: '"Inter", sans-serif'
        }}>
            <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#ffffff'
            }}>
                Node Library
            </h3>

            {/* Generated Nodes Section */}
            {generatedNodes.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <button
                        onClick={() => toggleCategory('generated')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#ec4899',
                                borderRadius: '50%'
                            }} />
                            <Sparkles size={16} style={{ color: '#ec4899' }} />
                            <span>Generated Nodes ({generatedNodes.length})</span>
                        </div>
                        {expandedCategories.generated ? 
                            <ChevronDown size={16} style={{ color: '#8a8a8a' }} /> : 
                            <ChevronRight size={16} style={{ color: '#8a8a8a' }} />
                        }
                    </button>
                    
                    {expandedCategories.generated && (
                        <div style={{ marginLeft: '16px', marginTop: '8px' }}>
                            {loadingNodes ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px',
                                    color: '#8a8a8a',
                                    fontSize: '12px'
                                }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        border: '2px solid #2d2d2d',
                                        borderTop: '2px solid #ec4899',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    Loading nodes...
                                </div>
                            ) : (
                                Object.entries(nodesByCategory).map(([categoryName, nodes]) => (
                                    <div key={categoryName} style={{ marginBottom: '12px' }}>
                                        {Object.keys(nodesByCategory).length > 1 && (
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#8a8a8a',
                                                marginBottom: '4px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {categoryName}
                                            </div>
                                        )}
                                        {nodes.map((node) => (
                                            <div
                                                key={node.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, node)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '8px 12px',
                                                    backgroundColor: '#1a1a1a',
                                                    borderRadius: '6px',
                                                    marginBottom: '4px',
                                                    cursor: 'grab',
                                                    transition: 'all 0.2s ease',
                                                    border: '1px solid #2d2d2d'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = '#2d2d2d';
                                                    e.target.style.borderColor = node.style?.backgroundColor || '#ec4899';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = '#1a1a1a';
                                                    e.target.style.borderColor = '#2d2d2d';
                                                }}
                                            >
                                                <div style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    backgroundColor: node.style?.backgroundColor || '#ec4899',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Box size={10} style={{ color: '#ffffff' }} />
                                                </div>
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: '#ffffff',
                                                    fontWeight: '500'
                                                }}>
                                                    {node.name}
                                                </span>
                                                <span style={{
                                                    fontSize: '10px',
                                                    color: '#8a8a8a',
                                                    marginLeft: 'auto'
                                                }}>
                                                    v{node.version}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Standard Node Categories */}
            {Object.entries(categories).map(([categoryKey, category]) => (
                <div key={categoryKey} style={{ marginBottom: '16px' }}>
                    <button
                        onClick={() => toggleCategory(categoryKey)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            background: 'none',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#ffffff',
                            cursor: 'pointer'
                        }}
                    >
                        <span>{category.title}</span>
                        {expandedCategories[categoryKey] ? 
                            <ChevronDown size={16} /> : 
                            <ChevronRight size={16} />
                        }
                    </button>

                    {expandedCategories[categoryKey] && (
                        <div style={{ marginLeft: '8px' }}>
                            {Object.entries(category.items).map(([itemKey, item]) => {
                                const template = nodeTemplates[categoryKey][itemKey];
                                const Icon = item.icon;
                                
                                console.log(`🔧 Rendering ${categoryKey}.${itemKey}:`, template);
                                
                                if (!template) {
                                    console.error(`❌ Template not found for ${categoryKey}.${itemKey}`);
                                    return null;
                                }
                                
                                return (
                                    <div
                                        key={itemKey}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, template)}
                                        onClick={() => onAddNode && onAddNode(template)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px',
                                            margin: '4px 0',
                                            borderRadius: '8px',
                                            cursor: 'grab',
                                            backgroundColor: '#1a1a1a',
                                            border: '1px solid #404040',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#2d2d2d';
                                            e.target.style.borderColor = category.color;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#1a1a1a';
                                            e.target.style.borderColor = '#404040';
                                        }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: category.color,
                                            borderRadius: '4px',
                                            color: '#000000'
                                        }}>
                                            <Icon size={12} />
                                        </div>
                                        <span style={{
                                            fontSize: '12px',
                                            color: '#ffffff',
                                            fontWeight: '500'
                                        }}>
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
            
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default NodePalette;