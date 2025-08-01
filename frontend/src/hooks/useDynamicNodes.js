import { useState, useEffect, useCallback } from 'react';
import dynamicNodeRegistry from '../services/dynamicNodeRegistry';
import { useAuth } from '../contexts/AuthContext';

const useDynamicNodes = () => {
    const { accessToken, isAuthenticated } = useAuth();
    const [generatedNodes, setGeneratedNodes] = useState([]);
    const [nodesByCategory, setNodesByCategory] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Update state when registry changes
    const handleRegistryUpdate = useCallback((nodes) => {
        setGeneratedNodes(nodes);
        setNodesByCategory(dynamicNodeRegistry.getGeneratedNodesByCategory());
    }, []);

    // Load generated nodes
    const loadNodes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            await dynamicNodeRegistry.loadGeneratedNodes();
            handleRegistryUpdate(dynamicNodeRegistry.getAllGeneratedNodes());
            console.log('✅ Generated nodes loaded successfully');
        } catch (err) {
            setError(err.message);
            console.error('❌ Failed to load dynamic nodes:', err);
        } finally {
            setLoading(false);
        }
    }, [handleRegistryUpdate]);

    // Refresh nodes from backend
    const refreshNodes = useCallback(async () => {
        return await loadNodes();
    }, [loadNodes]);

    // Get node by ID
    const getNode = useCallback((nodeId) => {
        return dynamicNodeRegistry.getGeneratedNode(nodeId);
    }, []);

    // Register a new node
    const registerNode = useCallback((nodeData) => {
        dynamicNodeRegistry.registerGeneratedNode(nodeData);
        handleRegistryUpdate(dynamicNodeRegistry.getAllGeneratedNodes());
    }, [handleRegistryUpdate]);

    // Remove a node
    const removeNode = useCallback((nodeId) => {
        dynamicNodeRegistry.removeGeneratedNode(nodeId);
        handleRegistryUpdate(dynamicNodeRegistry.getAllGeneratedNodes());
    }, [handleRegistryUpdate]);

    // Setup and cleanup
    useEffect(() => {
        // Add listener to registry
        dynamicNodeRegistry.addListener(handleRegistryUpdate);
        
        // Cleanup
        return () => {
            dynamicNodeRegistry.removeListener(handleRegistryUpdate);
        };
    }, [handleRegistryUpdate]);
    
    // Load nodes when authentication changes
    useEffect(() => {
        if (isAuthenticated && accessToken) {
            console.log('🔑 User authenticated, loading generated nodes...');
            loadNodes();
        } else if (!isAuthenticated) {
            console.log('🔒 User not authenticated, clearing generated nodes');
            setGeneratedNodes([]);
            setNodesByCategory({});
            dynamicNodeRegistry.clearGeneratedNodes();
        }
    }, [isAuthenticated, accessToken, loadNodes]);

    return {
        generatedNodes,
        nodesByCategory,
        loading,
        error,
        loadNodes,
        refreshNodes,
        getNode,
        registerNode,
        removeNode
    };
};

export default useDynamicNodes;