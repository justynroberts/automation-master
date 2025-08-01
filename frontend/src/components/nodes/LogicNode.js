import React from 'react';
import { GitBranch, RotateCcw, Merge, Filter } from 'lucide-react';
import BaseNode from './BaseNode';

const LogicNode = (props) => {
    const { data } = props;
    
    const getIcon = () => {
        switch (data.logicType) {
            case 'condition': return GitBranch;
            case 'loop': return RotateCcw;
            case 'merge': return Merge;
            case 'filter': return Filter;
            default: return GitBranch;
        }
    };

    const getDescription = () => {
        switch (data.logicType) {
            case 'condition': return `If: ${data.condition || 'Not set'}`;
            case 'loop': return `Loop: ${data.loopType || 'forEach'}`;
            case 'merge': return `Merge: ${data.mergeType || 'combine'}`;
            case 'filter': return `Filter: ${data.filterCondition || 'Not set'}`;
            default: return 'Configure logic operation';
        }
    };

    return (
        <BaseNode
            {...props}
            type="Logic"
            color="#8b5cf6"
            icon={getIcon()}
            inputs={true}
            outputs={true}
        >
            {getDescription()}
        </BaseNode>
    );
};

export default LogicNode;