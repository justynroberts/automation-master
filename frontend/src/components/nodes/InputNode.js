import React from 'react';
import { FileText, Upload, Webhook, Clock } from 'lucide-react';
import BaseNode from './BaseNode';

const InputNode = (props) => {
    const { data } = props;
    
    const getIcon = () => {
        switch (data.inputType) {
            case 'file': return Upload;
            case 'webhook': return Webhook;
            case 'timer': return Clock;
            default: return FileText;
        }
    };

    const getDescription = () => {
        switch (data.inputType) {
            case 'file': return `File upload: ${data.fileType || 'Any'}`;
            case 'webhook': return `Webhook: ${data.endpoint || '/hook'}`;
            case 'timer': return `Schedule: ${data.schedule || 'Not set'}`;
            case 'manual': return `Fields: ${data.fields?.length || 0}`;
            default: return 'Configure input source';
        }
    };

    return (
        <BaseNode
            {...props}
            type="Input"
            color="#10b981"
            icon={getIcon()}
            inputs={false}
            outputs={true}
        >
            {getDescription()}
        </BaseNode>
    );
};

export default InputNode;