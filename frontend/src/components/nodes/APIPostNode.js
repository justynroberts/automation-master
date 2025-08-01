import React from 'react';
import { Globe, Send } from 'lucide-react';

const APIPostNode = ({ data, onUpdate, isReadOnly }) => {
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
                color: '#00d4aa'
            }}>
                <Send size={16} />
                <span style={{ fontWeight: '600' }}>API POST Request</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#888'
                }}>
                    URL *
                </label>
                <input
                    type="text"
                    value={nodeData.url || ''}
                    onChange={(e) => handleFieldChange('url', e.target.value)}
                    placeholder="https://api.example.com/endpoint"
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
                    Headers (JSON)
                </label>
                <textarea
                    value={nodeData.headers || '{"Content-Type": "application/json"}'}
                    onChange={(e) => handleFieldChange('headers', e.target.value)}
                    placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                    readOnly={isReadOnly}
                    rows={3}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#121212',
                        border: '1px solid #2d2d2d',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#ffffff',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'monospace'
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
                    Body (JSON)
                </label>
                <textarea
                    value={nodeData.body || '{}'}
                    onChange={(e) => handleFieldChange('body', e.target.value)}
                    placeholder='{"key": "value"}'
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
                        resize: 'vertical',
                        fontFamily: 'monospace'
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
                    Timeout (seconds)
                </label>
                <input
                    type="number"
                    value={nodeData.timeout || 30}
                    onChange={(e) => handleFieldChange('timeout', parseInt(e.target.value) || 30)}
                    min="1"
                    max="300"
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
        </div>
    );
};

export default APIPostNode;