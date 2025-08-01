import React from 'react';
import { Users } from 'lucide-react';
import BaseNode from './BaseNode';

const UserInputNode = (props) => {
    const { data } = props;
    
    const getDescription = () => {
        const fieldCount = data.fields?.length || 0;
        const title = data.title || 'User Input';
        return fieldCount > 0 ? `${title} (${fieldCount} fields)` : title;
    };

    return (
        <BaseNode
            {...props}
            type="User Input"
            color="#8b5cf6"
            icon={Users}
            inputs={data.allowMidFlow !== false}
            outputs={true}
        >
            {getDescription()}
        </BaseNode>
    );
};

export default UserInputNode;