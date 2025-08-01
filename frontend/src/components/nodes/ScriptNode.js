import React from 'react';
import { Code, Terminal, Zap } from 'lucide-react';
import BaseNode from './BaseNode';

const ScriptNode = (props) => {
    const { data } = props;
    
    const getIcon = () => {
        switch (data.scriptType) {
            case 'python': return Zap;
            case 'bash': return Terminal;
            case 'javascript': 
            default: return Code;
        }
    };

    const getColor = () => {
        switch (data.scriptType) {
            case 'python': return '#f59e0b';
            case 'bash': return '#374151';
            case 'javascript': 
            default: return '#3b82f6';
        }
    };

    const getDescription = () => {
        const type = data.scriptType || 'javascript';
        const lines = data.script ? data.script.split('\n').length : 0;
        return `${type.toUpperCase()} script (${lines} lines)`;
    };

    return (
        <BaseNode
            {...props}
            type="Script"
            color={getColor()}
            icon={getIcon()}
            inputs={true}
            outputs={true}
        >
            {getDescription()}
        </BaseNode>
    );
};

export default ScriptNode;