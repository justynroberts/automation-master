import React, { useCallback, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useWorkflowStore from '../hooks/useWorkflow';
import { Play, Save } from 'lucide-react';

const nodeTypes = {
    // Custom node types will be added here
};

const WorkflowCanvas = () => {
    const {
        nodes: storeNodes,
        edges: storeEdges,
        setNodes: setStoreNodes,
        setEdges: setStoreEdges,
        saveWorkflowDefinition,
        executeWorkflow,
        currentWorkflow
    } = useWorkflowStore();

    const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

    // Sync local state with store
    useEffect(() => {
        setNodes(storeNodes);
        setEdges(storeEdges);
    }, [storeNodes, storeEdges, setNodes, setEdges]);

    // Update store when local state changes
    useEffect(() => {
        setStoreNodes(nodes);
    }, [nodes, setStoreNodes]);

    useEffect(() => {
        setStoreEdges(edges);
    }, [edges, setStoreEdges]);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const handleSave = async () => {
        try {
            await saveWorkflowDefinition();
            // Show success message
        } catch (error) {
            // Show error message
            console.error('Save failed:', error);
        }
    };

    const handleExecute = async () => {
        try {
            const execution = await executeWorkflow();
            // Navigate to execution view or show status
            console.log('Execution started:', execution);
        } catch (error) {
            // Show error message
            console.error('Execution failed:', error);
        }
    };

    return (
        <div className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-gray-50"
            >
                <Panel position="top-right" className="space-x-2">
                    <button
                        onClick={handleSave}
                        disabled={!currentWorkflow}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                    </button>
                    <button
                        onClick={handleExecute}
                        disabled={!currentWorkflow || nodes.length === 0}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Play className="h-4 w-4" />
                        <span>Execute</span>
                    </button>
                </Panel>

                <Background />
                <Controls />
                <MiniMap 
                    nodeColor="#3b82f6"
                    className="bg-white border border-gray-200"
                />
            </ReactFlow>
        </div>
    );
};

export default WorkflowCanvas;