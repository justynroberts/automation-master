import React from 'react';
import { MessageSquare, Send } from 'lucide-react';

const SlackOutputNode = ({ data, onUpdate, isReadOnly }) => {
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
                color: '#4a154b'
            }}>
                <MessageSquare size={16} />
                <span style={{ fontWeight: '600', color: '#ffffff' }}>Slack Message</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#888'
                }}>
                    Webhook URL *
                </label>
                <input
                    type="text"
                    value={nodeData.webhookUrl || ''}
                    onChange={(e) => handleFieldChange('webhookUrl', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
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
                    Channel (optional)
                </label>
                <input
                    type="text"
                    value={nodeData.channel || ''}
                    onChange={(e) => handleFieldChange('channel', e.target.value)}
                    placeholder="#general or @username"
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
                    Username (optional)
                </label>
                <input
                    type="text"
                    value={nodeData.username || ''}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                    placeholder="Workflow Bot"
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
                    Message *
                </label>
                <textarea
                    value={nodeData.message || ''}
                    onChange={(e) => handleFieldChange('message', e.target.value)}
                    placeholder="Your message here..."
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
                    Icon Emoji (optional)
                </label>
                <input
                    type="text"
                    value={nodeData.iconEmoji || ''}
                    onChange={(e) => handleFieldChange('iconEmoji', e.target.value)}
                    placeholder=":robot_face:"
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

export default SlackOutputNode;