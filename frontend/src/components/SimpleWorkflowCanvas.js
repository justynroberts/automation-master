import React, { useState, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Sample initial nodes and edges for testing
const initialNodes = [
    {
        id: '1',
        type: 'input',
        data: { label: 'Start Node' },
        position: { x: 250, y: 25 },
    },
    {
        id: '2',
        type: 'default',
        data: { label: 'Process Node' },
        position: { x: 100, y: 125 },
    },
    {
        id: '3',
        type: 'output',
        data: { label: 'Output Node' },
        position: { x: 250, y: 250 },
    },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
];

const SimpleWorkflowCanvas = () => {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

    const onNodesChange = useCallback((changes) => {
        console.log('Nodes changed:', changes);
        // For now, just log changes
    }, []);

    const onEdgesChange = useCallback((changes) => {
        console.log('Edges changed:', changes);
        // For now, just log changes
    }, []);

    const onConnect = useCallback(
        (params) => {
            console.log('Connection:', params);
            setEdges((eds) => addEdge(params, eds));
        },
        [setEdges]
    );

    const addNode = () => {
        const newNode = {
            id: `${nodes.length + 1}`,
            type: 'default',
            data: { label: `New Node ${nodes.length + 1}` },
            position: { x: Math.random() * 400, y: Math.random() * 400 },
        };
        setNodes([...nodes, newNode]);
    };

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                style={{ background: '#f8fafc' }}
            >
                <Panel position="top-left">
                    <button
                        onClick={addNode}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '8px'
                        }}
                    >
                        Add Node
                    </button>
                    <span style={{ color: '#666' }}>
                        Nodes: {nodes.length} | Edges: {edges.length}
                    </span>
                </Panel>
                
                <Background />
                <Controls />
                <MiniMap 
                    nodeColor="#3b82f6"
                    style={{ background: 'white' }}
                />
            </ReactFlow>
        </div>
    );
};

export default SimpleWorkflowCanvas;