import React, { useEffect, useState } from 'react';
import { generatedNodesAPI } from '../services/api';
import dynamicNodeRegistry from '../services/dynamicNodeRegistry';

const NodeLoadingDebug = () => {
    const [debugInfo, setDebugInfo] = useState({
        directAPICall: null,
        registryNodes: null,
        error: null,
        token: null
    });

    useEffect(() => {
        const runDebug = async () => {
            try {
                // Check if we have a token
                const token = localStorage.getItem('accessToken');
                
                // Try direct API call
                console.log('🔍 Debug: Making direct API call...');
                const apiResponse = await generatedNodesAPI.getGeneratedNodes();
                console.log('✅ Direct API response:', apiResponse);
                
                // Check registry
                console.log('🔍 Debug: Checking registry...');
                const registryNodes = dynamicNodeRegistry.getAllGeneratedNodes();
                console.log('📦 Registry nodes:', registryNodes);
                
                // Try loading through registry
                console.log('🔍 Debug: Loading through registry...');
                await dynamicNodeRegistry.loadGeneratedNodes();
                const afterLoad = dynamicNodeRegistry.getAllGeneratedNodes();
                console.log('📦 Registry nodes after load:', afterLoad);
                
                setDebugInfo({
                    directAPICall: apiResponse.data,
                    registryNodes: afterLoad,
                    error: null,
                    token: token ? 'Present' : 'Missing'
                });
            } catch (error) {
                console.error('❌ Debug error:', error);
                setDebugInfo(prev => ({
                    ...prev,
                    error: {
                        message: error.message,
                        response: error.response?.data,
                        status: error.response?.status
                    }
                }));
            }
        };

        runDebug();
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#1a1a1a',
            border: '2px solid #00d4aa',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '400px',
            maxHeight: '600px',
            overflow: 'auto',
            zIndex: 10000,
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '12px'
        }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#00d4aa' }}>Node Loading Debug</h3>
            
            <div style={{ marginBottom: '12px' }}>
                <strong>Auth Token:</strong> {debugInfo.token}
            </div>
            
            {debugInfo.error && (
                <div style={{ 
                    backgroundColor: '#ff4444', 
                    padding: '8px', 
                    borderRadius: '4px',
                    marginBottom: '12px' 
                }}>
                    <strong>Error:</strong>
                    <pre style={{ margin: '4px 0 0 0' }}>
                        {JSON.stringify(debugInfo.error, null, 2)}
                    </pre>
                </div>
            )}
            
            <div style={{ marginBottom: '12px' }}>
                <strong>Direct API Response:</strong>
                <pre style={{ 
                    backgroundColor: '#0a0a0a', 
                    padding: '8px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                }}>
                    {JSON.stringify(debugInfo.directAPICall, null, 2)}
                </pre>
            </div>
            
            <div>
                <strong>Registry Nodes Count:</strong> {debugInfo.registryNodes?.length || 0}
                <pre style={{ 
                    backgroundColor: '#0a0a0a', 
                    padding: '8px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                }}>
                    {JSON.stringify(debugInfo.registryNodes?.map(n => ({
                        id: n.id,
                        name: n.name,
                        category: n.category
                    })), null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default NodeLoadingDebug;