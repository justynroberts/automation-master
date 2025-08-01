import React from 'react';
import { Shuffle, Code, Filter, Zap } from 'lucide-react';

const TransformNode = ({ data, onUpdate, isReadOnly }) => {
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            border: '2px solid #4c63d2',
            minWidth: '280px',
            color: 'white'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                gap: '8px'
            }}>
                <Shuffle size={18} />
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    Transform
                </span>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                }}>
                    Input Data
                </label>
                <input
                    type="text"
                    value={nodeData.inputData || '{{previous}}'}
                    onChange={(e) => handleFieldChange('inputData', e.target.value)}
                    placeholder="{{previous}} or {{results.nodeId}}"
                    disabled={isReadOnly}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#333'
                    }}
                />
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                }}>
                    Transform Type
                </label>
                <select
                    value={nodeData.transformType || 'jq'}
                    onChange={(e) => handleFieldChange('transformType', e.target.value)}
                    disabled={isReadOnly}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#333'
                    }}
                >
                    <option value="jq">JQ</option>
                    <option value="jsonpath">JSONPath</option>
                    <option value="javascript">JavaScript</option>
                    <option value="template">Template</option>
                </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                }}>
                    Expression
                </label>
                <textarea
                    value={nodeData.expression || '.'}
                    onChange={(e) => handleFieldChange('expression', e.target.value)}
                    placeholder={getPlaceholderForType(nodeData.transformType)}
                    disabled={isReadOnly}
                    rows={3}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#333',
                        fontFamily: 'Monaco, "Lucida Console", monospace',
                        resize: 'vertical'
                    }}
                />
            </div>

            <div style={{ marginBottom: '8px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                }}>
                    Output Variable Name
                </label>
                <input
                    type="text"
                    value={nodeData.outputVariable || 'transformed'}
                    onChange={(e) => handleFieldChange('outputVariable', e.target.value)}
                    placeholder="Variable name for result"
                    disabled={isReadOnly}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#333'
                    }}
                />
            </div>

            {/* Examples based on transform type */}
            <div style={{
                fontSize: '10px',
                opacity: 0.8,
                marginTop: '8px',
                lineHeight: '1.4'
            }}>
                <strong>Examples:</strong><br />
                {getExamplesForType(nodeData.transformType)}
            </div>
        </div>
    );
};

function getPlaceholderForType(type) {
    switch (type) {
        case 'jq':
            return '.field | length';
        case 'jsonpath':
            return '$.field[0]';
        case 'javascript':
            return 'data.field.map(x => x.value)';
        case 'template':
            return 'Value: {{data.field}}';
        default:
            return '.';
    }
}

function getExamplesForType(type) {
    switch (type) {
        case 'jq':
            return '• . (identity) • .field • keys • length • .[0] • .items | length';
        case 'jsonpath':
            return '• $ (root) • $.field • $.items[0] • $.*.name';
        case 'javascript':
            return '• data.field • data.items.length • data.map(x => x.id)';
        case 'template':
            return '• {{data.name}} • Count: {{data.items.length}} • {{data.field}}';
        default:
            return '';
    }
}

export default TransformNode;