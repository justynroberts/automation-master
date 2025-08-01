import { create } from 'zustand';
import { generatedNodesAPI } from '../services/api';
import dynamicNodeRegistry from '../services/dynamicNodeRegistry';

const useGeneratedNodesStore = create((set, get) => ({
    // State
    generatedNodes: [],
    currentNode: null,
    nodeVersions: [],
    nodeStats: null,
    loading: false,
    error: null,
    generationInProgress: false,

    // Actions
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setGenerationInProgress: (inProgress) => set({ generationInProgress: inProgress }),

    // Generate new node using LLM
    generateNode: async (request, context = {}) => {
        set({ generationInProgress: true, error: null });
        try {
            const response = await generatedNodesAPI.generateNode(request, context);
            const newNode = response.data.node;
            
            set((state) => ({
                generatedNodes: [newNode, ...state.generatedNodes],
                currentNode: newNode,
                generationInProgress: false
            }));
            
            return newNode;
        } catch (error) {
            set({ 
                error: error.response?.data?.error || 'Failed to generate node', 
                generationInProgress: false 
            });
            throw error;
        }
    },

    // Fetch all generated nodes
    fetchGeneratedNodes: async () => {
        set({ loading: true, error: null });
        try {
            const response = await generatedNodesAPI.getGeneratedNodes();
            set({ generatedNodes: response.data, loading: false });
        } catch (error) {
            set({ 
                error: error.response?.data?.error || 'Failed to fetch generated nodes', 
                loading: false 
            });
        }
    },

    // Fetch specific generated node
    fetchGeneratedNode: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await generatedNodesAPI.getGeneratedNode(id);
            set({ currentNode: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ 
                error: error.response?.data?.error || 'Failed to fetch generated node', 
                loading: false 
            });
            throw error;
        }
    },

    // Update generated node
    updateGeneratedNode: async (id, updates, changeDescription = '') => {
        set({ loading: true, error: null });
        try {
            const response = await generatedNodesAPI.updateGeneratedNode(id, updates, changeDescription);
            const updatedNode = response.data.node;
            
            set((state) => ({
                generatedNodes: state.generatedNodes.map(node => 
                    node.id === id ? updatedNode : node
                ),
                currentNode: state.currentNode?.id === id ? updatedNode : state.currentNode,
                loading: false
            }));
            
            return updatedNode;
        } catch (error) {
            set({ 
                error: error.response?.data?.error || 'Failed to update generated node', 
                loading: false 
            });
            throw error;
        }
    },

    // Delete generated node
    deleteGeneratedNode: async (id) => {
        set({ loading: true, error: null });
        try {
            await generatedNodesAPI.deleteGeneratedNode(id);
            
            set((state) => ({
                generatedNodes: state.generatedNodes.filter(node => node.id !== id),
                currentNode: state.currentNode?.id === id ? null : state.currentNode,
                loading: false
            }));
            
            // Also refresh the dynamic node registry
            try {
                await dynamicNodeRegistry.refresh();
            } catch (registryError) {
                console.warn('Failed to refresh dynamic node registry:', registryError);
            }
        } catch (error) {
            set({ 
                error: error.response?.data?.error || 'Failed to delete generated node', 
                loading: false 
            });
            throw error;
        }
    },

    // Duplicate generated node
    duplicateNode: async (id, name) => {
        set({ loading: true, error: null });
        try {
            const response = await generatedNodesAPI.duplicateNode(id, name);
            const duplicatedNode = response.data.node;
            
            set((state) => ({
                generatedNodes: [duplicatedNode, ...state.generatedNodes],
                loading: false
            }));
            
            return duplicatedNode;
        } catch (error) {
            set({ 
                error: error.response?.data?.error || 'Failed to duplicate node', 
                loading: false 
            });
            throw error;
        }
    },

    // Test node execution
    testNode: async (id, inputs) => {
        set({ loading: true, error: null });
        try {
            const response = await generatedNodesAPI.testNode(id, inputs);
            set({ loading: false });
            return response.data;
        } catch (error) {
            set({ 
                error: error.response?.data?.error || 'Failed to test node', 
                loading: false 
            });
            throw error;
        }
    },

    // Fetch node versions
    fetchNodeVersions: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await generatedNodesAPI.getNodeVersions(id);
            set({ nodeVersions: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ 
                error: error.response?.data?.error || 'Failed to fetch node versions', 
                loading: false 
            });
            throw error;
        }
    },

    // Fetch node statistics
    fetchNodeStats: async () => {
        set({ loading: true, error: null });
        try {
            const response = await generatedNodesAPI.getNodeStats();
            set({ nodeStats: response.data, loading: false });
            return response.data;
        } catch (error) {
            set({ 
                error: error.response?.data?.error || 'Failed to fetch node statistics', 
                loading: false 
            });
            throw error;
        }
    },

    // Clear current node
    clearCurrentNode: () => set({ currentNode: null }),

    // Reset state
    reset: () => set({
        currentNode: null,
        nodeVersions: [],
        nodeStats: null,
        error: null
    }),
}));

export default useGeneratedNodesStore;