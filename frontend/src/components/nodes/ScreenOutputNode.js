import React from 'react';
import { Monitor, Display } from 'lucide-react';

const ScreenOutputNode = ({ data, onUpdate, isReadOnly }) => {
    const nodeData = data || {};

    const handleFieldChange = (field, value) => {
        if (isReadOnly) return;
        
        onUpdate({
            ...nodeData,
            [field]: value
        });
    };

    return (
        <div style={{
            padding: '16px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            border: '1px solid #2d2d2d'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                color: '#10b981'
            }}>
                <Monitor size={16} />
                <span style={{ fontWeight: '600', color: '#ffffff' }}>Screen Output</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#888'
                }}>
                    Output Title
                </label>
                <input
                    type="text"
                    value={nodeData.title || ''}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="Result Title"
                    readOnly={isReadOnly}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#121212',
                        border: '1px solid #2d2d2d',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#ffffff',
                        outline: 'none'
                    }}
                />
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#888'
                }}>
                    Message/Content *
                </label>
                <textarea
                    value={nodeData.message || ''}
                    onChange={(e) => handleFieldChange('message', e.target.value)}
                    placeholder="Content to display on screen..."
                    readOnly={isReadOnly}
                    rows={4}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#121212',
                        border: '1px solid #2d2d2d',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#ffffff',
                        outline: 'none',
                        resize: 'vertical'
                    }}
                />
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#888'
                }}>
                    Format
                </label>
                <select
                    value={nodeData.format || 'text'}
                    onChange={(e) => handleFieldChange('format', e.target.value)}
                    readOnly={isReadOnly}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#121212',
                        border: '1px solid #2d2d2d',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#ffffff',
                        outline: 'none'
                    }}
                >
                    <option value="text">Plain Text</option>
                    <option value="json">JSON</option>
                    <option value="table">Table</option>
                    <option value="markdown">Markdown</option>
                </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#888'
                }}>
                    Level
                </label>
                <select
                    value={nodeData.level || 'info'}
                    onChange={(e) => handleFieldChange('level', e.target.value)}
                    readOnly={isReadOnly}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#121212',
                        border: '1px solid #2d2d2d',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#ffffff',
                        outline: 'none'
                    }}
                >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#888',
                    cursor: 'pointer'
                }}>
                    <input
                        type="checkbox"
                        checked={nodeData.includeTimestamp || false}
                        onChange={(e) => handleFieldChange('includeTimestamp', e.target.checked)}
                        disabled={isReadOnly}
                        style={{
                            accentColor: '#10b981'
                        }}
                    />
                    Include Timestamp
                </label>
            </div>
        </div>
    );
};

export default ScreenOutputNode;