import InputNode from './InputNode';
import ScriptNode from './ScriptNode';
import LogicNode from './LogicNode';
import OutputNode from './OutputNode';
import GeneratedNode from './GeneratedNode';
import APIPostNode from './APIPostNode';
import APIGetNode from './APIGetNode';
import SlackOutputNode from './SlackOutputNode';
import UserInputNode from './UserInputNode';

export const nodeTypes = {
    input: InputNode,
    script: ScriptNode,
    logic: LogicNode,
    output: OutputNode,
    generatedNode: GeneratedNode,
    apiPost: APIPostNode,
    apiGet: APIGetNode,
    slackOutput: SlackOutputNode,
    userInput: UserInputNode,
};

export const nodeTemplates = {
    input: {
        manual: {
            type: 'input',
            data: {
                label: 'Manual Input',
                inputType: 'manual',
                fields: [
                    { name: 'text_input', type: 'text', label: 'Text Input' }
                ]
            }
        },
        file: {
            type: 'input',
            data: {
                label: 'File Upload',
                inputType: 'file',
                fileType: 'csv'
            }
        },
        webhook: {
            type: 'input',
            data: {
                label: 'Webhook',
                inputType: 'webhook',
                endpoint: '/webhook'
            }
        },
        timer: {
            type: 'input',
            data: {
                label: 'Timer',
                inputType: 'timer',
                schedule: '0 9 * * *'
            }
        }
    },
    script: {
        javascript: {
            type: 'script',
            data: {
                label: 'JavaScript',
                scriptType: 'javascript',
                script: '// Your JavaScript code here\nconst result = input.data;\nreturn { output: result };'
            }
        },
        python: {
            type: 'script',
            data: {
                label: 'Python Script',
                scriptType: 'python',
                script: '# Your Python code here\nimport json\nresult = input_data\nprint(json.dumps({"output": result}))'
            }
        },
        bash: {
            type: 'script',
            data: {
                label: 'Bash Script',
                scriptType: 'bash',
                script: '#!/bin/bash\n# Your bash script here\necho "{\\"output\\": \\"$INPUT_JSON\\"}"'
            }
        }
    },
    logic: {
        condition: {
            type: 'logic',
            data: {
                label: 'Condition',
                logicType: 'condition',
                condition: 'input.value > 0'
            }
        },
        loop: {
            type: 'logic',
            data: {
                label: 'Loop',
                logicType: 'loop',
                loopType: 'forEach'
            }
        },
        merge: {
            type: 'logic',
            data: {
                label: 'Merge',
                logicType: 'merge',
                mergeType: 'combine'
            }
        },
        filter: {
            type: 'logic',
            data: {
                label: 'Filter',
                logicType: 'filter',
                filterCondition: 'item.active === true'
            }
        }
    },
    output: {
        file: {
            type: 'output',
            data: {
                label: 'File Export',
                outputType: 'file',
                format: 'json'
            }
        },
        api: {
            type: 'output',
            data: {
                label: 'API Call',
                outputType: 'api',
                endpoint: 'https://api.example.com/data'
            }
        },
        email: {
            type: 'output',
            data: {
                label: 'Send Email',
                outputType: 'email',
                recipients: 'user@example.com'
            }
        },
        database: {
            type: 'output',
            data: {
                label: 'Save to DB',
                outputType: 'database',
                table: 'results'
            }
        }
    },
    api: {
        post: {
            type: 'apiPost',
            data: {
                label: 'API POST',
                url: '',
                headers: '{"Content-Type": "application/json"}',
                body: '{}',
                timeout: 30
            }
        },
        get: {
            type: 'apiGet',
            data: {
                label: 'API GET',
                url: '',
                headers: '{"Content-Type": "application/json"}',
                params: '{}',
                timeout: 30
            }
        }
    },
    messaging: {
        slack: {
            type: 'slackOutput',
            data: {
                label: 'Slack Message',
                webhookUrl: '',
                channel: '',
                username: 'Workflow Bot',
                message: '',
                iconEmoji: ':robot_face:'
            }
        }
    },
    userInput: {
        basic: {
            type: 'userInput',
            data: {
                label: 'User Input',
                title: 'User Input Required',
                description: 'Please provide the following information:',
                allowMidFlow: true,
                fields: [
                    {
                        name: 'name',
                        type: 'text',
                        label: 'Name',
                        placeholder: 'Enter your name',
                        required: true
                    },
                    {
                        name: 'email',
                        type: 'email',
                        label: 'Email',
                        placeholder: 'Enter your email',
                        required: true
                    }
                ]
            }
        },
        approval: {
            type: 'userInput',
            data: {
                label: 'Approval Required',
                title: 'Approval Required',
                description: 'This workflow requires your approval to continue.',
                allowMidFlow: true,
                fields: [
                    {
                        name: 'approved',
                        type: 'select',
                        label: 'Decision',
                        required: true,
                        options: [
                            { value: 'approve', label: 'Approve' },
                            { value: 'reject', label: 'Reject' }
                        ]
                    },
                    {
                        name: 'comments',
                        type: 'textarea',
                        label: 'Comments',
                        placeholder: 'Optional comments...',
                        rows: 3
                    }
                ]
            }
        }
    }
};

export { InputNode, ScriptNode, LogicNode, OutputNode, GeneratedNode, APIPostNode, APIGetNode, SlackOutputNode, UserInputNode };