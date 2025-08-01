import { create } from 'zustand';
import { workflowAPI } from '../services/api';

const useWorkflowStore = create((set, get) => ({
    // State
    workflows: [],
    currentWorkflow: null,
    nodes: [],
    edges: [],
    loading: false,
    error: null,

    // Actions
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    // Workflow CRUD operations
    fetchWorkflows: async () => {
        set({ loading: true, error: null });
        try {
            const response = await workflowAPI.getWorkflows();
            set({ workflows: response.data, loading: false });
        } catch (error) {
            set({ error: error.response?.data?.error || 'Failed to fetch workflows', loading: false });
        }
    },

    fetchWorkflow: async (id) => {
        console.log(`🔍 Fetching workflow: ${id}`);
        set({ loading: true, error: null });
        try {
            const response = await workflowAPI.getWorkflow(id);
            const workflow = response.data;
            const definition = workflow.definition || { nodes: [], edges: [] };
            
            console.log(`✅ Loaded workflow: ${workflow.name}`, { 
                nodeCount: definition.nodes?.length || 0,
                edgeCount: definition.edges?.length || 0 
            });
            
            set({ 
                currentWorkflow: workflow,
                nodes: definition.nodes || [],
                edges: definition.edges || [],
                loading: false 
            });
        } catch (error) {
            console.error(`❌ Failed to fetch workflow ${id}:`, error);
            set({ error: error.response?.data?.error || 'Failed to fetch workflow', loading: false });
            throw error;
        }
    },

    createWorkflow: async (workflowData) => {
        set({ loading: true, error: null });
        try {
            const response = await workflowAPI.createWorkflow(workflowData);
            const newWorkflow = response.data.workflow;
            
            set((state) => ({
                workflows: [newWorkflow, ...state.workflows],
                currentWorkflow: newWorkflow,
                loading: false
            }));
            
            return newWorkflow;
        } catch (error) {
            set({ error: error.response?.data?.error || 'Failed to create workflow', loading: false });
            throw error;
        }
    },

    updateWorkflow: async (id, updates) => {
        set({ loading: true, error: null });
        try {
            const response = await workflowAPI.updateWorkflow(id, updates);
            const updatedWorkflow = response.data.workflow;
            
            set((state) => ({
                workflows: state.workflows.map(w => w.id === id ? updatedWorkflow : w),
                currentWorkflow: state.currentWorkflow?.id === id ? updatedWorkflow : state.currentWorkflow,
                loading: false
            }));
            
            return updatedWorkflow;
        } catch (error) {
            set({ error: error.response?.data?.error || 'Failed to update workflow', loading: false });
            throw error;
        }
    },

    deleteWorkflow: async (id) => {
        set({ loading: true, error: null });
        try {
            await workflowAPI.deleteWorkflow(id);
            
            set((state) => ({
                workflows: state.workflows.filter(w => w.id !== id),
                currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
                loading: false
            }));
        } catch (error) {
            set({ error: error.response?.data?.error || 'Failed to delete workflow', loading: false });
            throw error;
        }
    },

    // Canvas operations
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    
    addNode: (node) => set((state) => ({
        nodes: [...state.nodes, node]
    })),
    
    updateNode: (nodeId, updates) => set((state) => ({
        nodes: state.nodes.map(node => 
            node.id === nodeId ? { ...node, ...updates } : node
        )
    })),
    
    removeNode: (nodeId) => set((state) => ({
        nodes: state.nodes.filter(node => node.id !== nodeId),
        edges: state.edges.filter(edge => 
            edge.source !== nodeId && edge.target !== nodeId
        )
    })),

    addEdge: (edge) => set((state) => ({
        edges: [...state.edges, edge]
    })),

    removeEdge: (edgeId) => set((state) => ({
        edges: state.edges.filter(edge => edge.id !== edgeId)
    })),

    // Save workflow definition
    saveWorkflowDefinition: async () => {
        const { currentWorkflow, nodes, edges } = get();
        if (!currentWorkflow) return;

        const definition = { nodes, edges };
        await get().updateWorkflow(currentWorkflow.id, { definition });
    },

    // Execute workflow
    executeWorkflow: async (inputData = {}) => {
        const { currentWorkflow } = get();
        if (!currentWorkflow) throw new Error('No workflow selected');

        try {
            const response = await workflowAPI.executeWorkflow(currentWorkflow.id, inputData);
            return response.data.execution;
        } catch (error) {
            throw error.response?.data?.error || 'Failed to execute workflow';
        }
    },

    // Reset state
    reset: () => {
        console.log('🔄 Resetting workflow store state');
        set({
            currentWorkflow: null,
            nodes: [],
            edges: [],
            error: null,
            loading: false
        });
    },

    // Clear workflow cache to prevent stale data
    clearWorkflow: () => {
        console.log('🧹 Clearing current workflow');
        set({
            currentWorkflow: null,
            nodes: [],
            edges: []
        });
    },
}));

export default useWorkflowStore;