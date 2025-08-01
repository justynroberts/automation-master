import React, { useState, useEffect } from 'react';
import { Bug, RefreshCw, Eye, EyeOff } from 'lucide-react';
import useDynamicNodes from '../hooks/useDynamicNodes';
import { generatedNodesAPI } from '../services/api';

const DebugPanel = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [apiData, setApiData] = useState(null);
    const [apiError, setApiError] = useState(null);
    const { 
        generatedNodes, 
        nodesByCategory, 
        loading, 
        error, 
        refreshNodes 
    } = useDynamicNodes();

    const testAPI = async () => {
        try {
            setApiError(null);
            const response = await generatedNodesAPI.getGeneratedNodes();
            setApiData(response);
        } catch (err) {
            setApiError(err.message);
            setApiData(null);
        }
    };

    useEffect(() => {
        if (isVisible) {
            testAPI();
        }
    }, [isVisible]);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 9999,
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
            >
                <Bug size={20} style={{ color: '#00d4aa' }} />
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: '#1a1a1a',
            border: '1px solid #404040',
            borderRadius: '12px',
            padding: '16px',
            width: '400px',
            maxHeight: '600px',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            fontFamily: '"Inter", sans-serif',
            fontSize: '12px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid #2d2d2d'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Bug size={16} style={{ color: '#00d4aa' }} />
                    <span style={{ color: '#ffffff', fontWeight: '600' }}>Debug Panel</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={refreshNodes}
                        style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            padding: '4px',
                            cursor: 'pointer',
                            color: '#b3b3b3'
                        }}
                    >
                        <RefreshCw size={12} />
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            padding: '4px',
                            cursor: 'pointer',
                            color: '#b3b3b3'
                        }}
                    >
                        <EyeOff size={12} />
                    </button>
                </div>
            </div>

            <div style={{ color: '#ffffff' }}>
                {/* Hook Status */}
                <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: '#00d4aa', margin: '0 0 8px 0' }}>Hook Status</h4>
                    <div style={{ color: '#b3b3b3' }}>
                        <div>Loading: {loading ? '✅ Yes' : '❌ No'}</div>
                        <div>Error: {error ? `❌ ${error}` : '✅ None'}</div>
                        <div>Nodes Count: {generatedNodes.length}</div>
                        <div>Categories: {Object.keys(nodesByCategory).length}</div>
                    </div>
                </div>

                {/* API Status */}
                <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: '#00d4aa', margin: '0 0 8px 0' }}>API Status</h4>
                    <div style={{ color: '#b3b3b3' }}>
                        <div>API Error: {apiError ? `❌ ${apiError}` : '✅ None'}</div>
                        <div>API Data: {apiData ? `✅ ${apiData.length || 0} nodes` : '❌ No data'}</div>
                    </div>
                </div>

                {/* Generated Nodes */}
                {generatedNodes.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#00d4aa', margin: '0 0 8px 0' }}>Generated Nodes</h4>
                        <div style={{ 
                            backgroundColor: '#0a0a0a', 
                            padding: '8px', 
                            borderRadius: '4px',
                            maxHeight: '200px',
                            overflow: 'auto'
                        }}>
                            {generatedNodes.map((node, index) => (
                                <div key={index} style={{ 
                                    marginBottom: '4px',
                                    fontSize: '11px',
                                    color: '#b3b3b3'
                                }}>
                                    <div style={{ color: '#ffffff' }}>{node.name}</div>
                                    <div>Type: {node.type} | Category: {node.category}</div>
                                    <div>ID: {node.generatedNodeId || node.id}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Raw API Data */}
                {apiData && (
                    <div>
                        <h4 style={{ color: '#00d4aa', margin: '0 0 8px 0' }}>Raw API Data</h4>
                        <div style={{ 
                            backgroundColor: '#0a0a0a', 
                            padding: '8px', 
                            borderRadius: '4px',
                            maxHeight: '200px',
                            overflow: 'auto',
                            fontSize: '10px',
                            fontFamily: 'monospace'
                        }}>
                            <pre style={{ 
                                margin: 0, 
                                color: '#b3b3b3',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {JSON.stringify(apiData, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebugPanel;