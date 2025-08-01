import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    Panel,
    useNodesState,
    useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import NodePalette from './NodePalette';
import NodeEditor from './NodeEditor';
import { v4 as uuidv4 } from 'uuid';

const EnhancedWorkflowCanvas = ({ 
    initialNodes = [], 
    initialEdges = [],
    onSave,
    onExecute,
    readOnly = false 
}) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState(null);
    const [showNodeEditor, setShowNodeEditor] = useState(false);
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    // Update nodes and edges when initial props change
    useEffect(() => {
        setNodes(initialNodes);
    }, [initialNodes, setNodes]);

    useEffect(() => {
        setEdges(initialEdges);
    }, [initialEdges, setEdges]);

    const onConnect = useCallback(
        (params) => {
            setEdges((eds) => addEdge({
                ...params,
                id: uuidv4(),
                animated: true,
                style: { stroke: '#6b7280', strokeWidth: 2 }
            }, eds));
        },
        [setEdges]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const templateData = event.dataTransfer.getData('application/reactflow');

            if (typeof templateData === 'undefined' || !templateData) {
                return;
            }

            const template = JSON.parse(templateData);
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            const newNode = {
                id: uuidv4(),
                type: template.type,
                position,
                data: { 
                    ...template.data,
                    id: uuidv4()
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
        setShowNodeEditor(true);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setShowNodeEditor(false);
    }, []);

    const addNodeFromPalette = useCallback((template) => {
        const newNode = {
            id: uuidv4(),
            type: template.type,
            position: { 
                x: Math.random() * 400 + 100, 
                y: Math.random() * 300 + 100 
            },
            data: { 
                ...template.data,
                id: uuidv4()
            },
        };

        setNodes((nds) => nds.concat(newNode));
    }, [setNodes]);

    const updateNodeData = useCallback((nodeId, newData) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, ...newData } }
                    : node
            )
        );
        setShowNodeEditor(false);
    }, [setNodes]);

    const deleteNode = useCallback((nodeId) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => 
            edge.source !== nodeId && edge.target !== nodeId
        ));
        setShowNodeEditor(false);
    }, [setNodes, setEdges]);

    const handleSave = useCallback(() => {
        const workflowData = {
            nodes: nodes.map(node => ({
                ...node,
                data: { ...node.data }
            })),
            edges: edges.map(edge => ({ ...edge }))
        };
        
        if (onSave) {
            onSave(workflowData);
        }
    }, [nodes, edges, onSave]);

    const handleExecute = useCallback(() => {
        if (onExecute) {
            onExecute({ nodes, edges });
        }
    }, [nodes, edges, onExecute]);

    return (
        <div style={{ 
            display: 'flex', 
            height: '100%', 
            width: '100%',
            position: 'relative'
        }}>
            {/* Node Palette */}
            {!readOnly && (
                <NodePalette onAddNode={addNodeFromPalette} />
            )}

            {/* Canvas */}
            <div 
                ref={reactFlowWrapper}
                style={{ flex: 1, position: 'relative' }}
            >
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-gray-50"
                >
                    <Panel position="top-right">
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleSave}
                                disabled={readOnly}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: readOnly ? 'not-allowed' : 'pointer',
                                    opacity: readOnly ? 0.5 : 1,
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                Save
                            </button>
                            <button
                                onClick={handleExecute}
                                disabled={nodes.length === 0}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
                                    opacity: nodes.length === 0 ? 0.5 : 1,
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                Execute
                            </button>
                        </div>
                    </Panel>

                    <Panel position="bottom-left">
                        <div style={{
                            backgroundColor: 'white',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#6b7280',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            Nodes: {nodes.length} | Connections: {edges.length}
                        </div>
                    </Panel>

                    <Background />
                    <Controls />
                    <MiniMap 
                        nodeColor={(node) => {
                            switch (node.type) {
                                case 'input': return '#10b981';
                                case 'script': return '#3b82f6';
                                case 'logic': return '#8b5cf6';
                                case 'output': return '#ef4444';
                                default: return '#6b7280';
                            }
                        }}
                        style={{ background: 'white' }}
                    />
                </ReactFlow>
            </div>

            {/* Node Editor Modal */}
            {showNodeEditor && selectedNode && (
                <NodeEditor
                    node={selectedNode}
                    onSave={updateNodeData}
                    onDelete={deleteNode}
                    onClose={() => setShowNodeEditor(false)}
                />
            )}
        </div>
    );
};

export default EnhancedWorkflowCanvas;