import React from 'react';
import { Handle, Position } from '@xyflow/react';

const BaseNode = ({ 
    data, 
    id, 
    selected,
    type,
    children,
    color = '#3b82f6',
    icon: Icon,
    inputs = true,
    outputs = true,
    onEdit
}) => {
    const handleClick = () => {
        if (onEdit) {
            onEdit(id, data);
        }
    };

    return (
        <div
            onClick={handleClick}
            style={{
                background: '#1a1a1a',
                border: `2px solid ${selected ? color : '#404040'}`,
                borderRadius: '8px',
                padding: '8px',
                minWidth: '120px',
                maxWidth: '180px',
                boxShadow: selected ? `0 4px 12px ${color}40` : '0 2px 8px rgba(0,0,0,0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: '"Inter", sans-serif'
            }}
        >
            {/* Input Handle */}
            {inputs && (
                <Handle
                    type="target"
                    position={Position.Left}
                    style={{
                        background: color,
                        width: '12px',
                        height: '12px',
                        border: '2px solid white'
                    }}
                />
            )}

            {/* Node Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px'
            }}>
                {Icon && (
                    <div style={{
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: color,
                        borderRadius: '4px',
                        color: '#000000'
                    }}>
                        <Icon size={10} />
                    </div>
                )}
                <div style={{
                    fontWeight: '600',
                    fontSize: '12px',
                    color: '#ffffff',
                    lineHeight: '1.2'
                }}>
                    {data.label || type}
                </div>
            </div>

            {/* Node Content */}
            <div style={{
                fontSize: '10px',
                color: '#b3b3b3',
                lineHeight: '1.3',
                marginBottom: '4px'
            }}>
                {children || data.description || 'Configure this node'}
            </div>

            {/* Status Indicator */}
            {data.status && (
                <div style={{
                    marginTop: '8px',
                    padding: '2px 6px',
                    backgroundColor: data.status === 'success' ? '#1b5e20' : 
                                   data.status === 'error' ? '#d32f2f' : '#404040',
                    color: data.status === 'success' ? '#4caf50' : 
                           data.status === 'error' ? '#f44336' : '#ffffff',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '500'
                }}>
                    {data.status}
                </div>
            )}

            {/* Output Handle */}
            {outputs && (
                <Handle
                    type="source"
                    position={Position.Right}
                    style={{
                        background: color,
                        width: '12px',
                        height: '12px',
                        border: '2px solid white'
                    }}
                />
            )}
        </div>
    );
};

export default BaseNode;