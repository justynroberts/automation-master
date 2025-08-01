import React from 'react';
import { Download, Send, Mail, Database } from 'lucide-react';
import BaseNode from './BaseNode';

const OutputNode = (props) => {
    const { data } = props;
    
    const getIcon = () => {
        switch (data.outputType) {
            case 'file': return Download;
            case 'api': return Send;
            case 'email': return Mail;
            case 'database': return Database;
            default: return Download;
        }
    };

    const getDescription = () => {
        switch (data.outputType) {
            case 'file': return `Export: ${data.format || 'JSON'}`;
            case 'api': return `POST to: ${data.endpoint || 'URL not set'}`;
            case 'email': return `Send to: ${data.recipients || 'No recipients'}`;
            case 'database': return `Save to: ${data.table || 'No table'}`;
            default: return 'Configure output destination';
        }
    };

    return (
        <BaseNode
            {...props}
            type="Output"
            color="#ef4444"
            icon={getIcon()}
            inputs={true}
            outputs={false}
        >
            {getDescription()}
        </BaseNode>
    );
};

export default OutputNode;