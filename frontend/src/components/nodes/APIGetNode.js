import React from 'react';
import { Globe, Download } from 'lucide-react';

const APIGetNode = ({ data, onUpdate, isReadOnly }) => {
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
                color: '#4ade80'
            }}>
                <Download size={16} />
                <span style={{ fontWeight: '600' }}>API GET Request</span>
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
                    placeholder="https://api.example.com/data"
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
                    placeholder='{"Authorization": "Bearer token", "Accept": "application/json"}'
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
                    Query Parameters (JSON)
                </label>
                <textarea
                    value={nodeData.params || '{}'}
                    onChange={(e) => handleFieldChange('params', e.target.value)}
                    placeholder='{"limit": 10, "sort": "desc"}'
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

export default APIGetNode;