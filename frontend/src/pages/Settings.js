import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Settings as SettingsIcon, Save, Check, AlertTriangle, Cpu, Brain, Cloud,
    ArrowLeft, Key, Database, Bell, Shield, Palette, Globe, User
} from 'lucide-react';
import api from '../services/api';

const Settings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('llm');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // LLM Configuration State
    const [llmConfig, setLlmConfig] = useState({
        provider: 'claude',
        claudeApiKey: '',
        openaiApiKey: '',
        ollamaBaseUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.1'
    });

    // Super Prompts State
    const [superPrompts, setSuperPrompts] = useState({
        nodeGeneration: { system: '', user: '' },
        codeGeneration: { system: '', user: '' }
    });

    // Other Settings State
    const [generalSettings, setGeneralSettings] = useState({
        theme: 'dark',
        notifications: true,
        autoSave: true,
        defaultTimeout: 120
    });

    const [securitySettings, setSecuritySettings] = useState({
        sessionTimeout: 15,
        requireMFA: false,
        allowApiAccess: true
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const [llmResponse, promptsResponse] = await Promise.all([
                api.get('/config/llm'),
                api.get('/prompts')
            ]);
            setLlmConfig(prev => ({ ...prev, ...llmResponse.data }));
            setSuperPrompts(promptsResponse.data);
        } catch (error) {
            console.log('Could not load all settings');
        }
    };

    const showMessage = (text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const saveLLMConfig = async () => {
        setLoading(true);
        try {
            await api.put('/config/llm', llmConfig);
            showMessage('LLM configuration saved successfully! This will be used throughout the product.', 'success');
        } catch (error) {
            showMessage(`Failed to save LLM configuration: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const testLLMConnection = async () => {
        setLoading(true);
        try {
            const response = await api.post('/config/llm/test', { provider: llmConfig.provider });
            showMessage(response.data.message, 'success');
        } catch (error) {
            showMessage(`Connection test failed: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const providers = [
        {
            id: 'claude',
            name: 'Claude (Anthropic)',
            icon: Brain,
            description: 'Fast, reliable, excellent for code generation and analysis',
            keyField: 'claudeApiKey',
            keyPlaceholder: 'sk-ant-api03-...',
            getKeyUrl: 'https://console.anthropic.com/',
            recommended: true,
            usedIn: ['Node Generator', 'Code Nodes', 'AI Assistant', 'Workflow Analysis']
        },
        {
            id: 'openai',
            name: 'OpenAI (GPT)',
            icon: Cloud,
            description: 'Popular choice with good performance',
            keyField: 'openaiApiKey',
            keyPlaceholder: 'sk-...',
            getKeyUrl: 'https://platform.openai.com/api-keys',
            usedIn: ['Node Generator', 'Code Nodes', 'AI Assistant', 'Workflow Analysis']
        },
        {
            id: 'ollama',
            name: 'Ollama (Local)',
            icon: Cpu,
            description: 'No API key needed, runs locally (slower)',
            noApiKey: true,
            usedIn: ['Node Generator', 'Code Nodes', 'AI Assistant']
        }
    ];

    const saveSuperPrompts = async () => {
        setLoading(true);
        try {
            await api.put('/prompts', superPrompts);
            showMessage('Super prompts updated successfully! Changes applied immediately.', 'success');
        } catch (error) {
            showMessage(`Failed to save super prompts: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetPromptsToDefaults = async () => {
        if (!window.confirm('Are you sure you want to reset all prompts to defaults? This cannot be undone.')) {
            return;
        }
        
        setLoading(true);
        try {
            const response = await api.post('/prompts/reset');
            setSuperPrompts(response.data.prompts);
            showMessage('Super prompts reset to defaults successfully!', 'success');
        } catch (error) {
            showMessage(`Failed to reset prompts: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'llm', name: 'AI & LLM', icon: Brain, description: 'Configure AI providers used throughout the platform' },
        { id: 'prompts', name: 'Super Prompts', icon: SettingsIcon, description: 'Customize AI prompts for node and code generation' },
        { id: 'general', name: 'General', icon: SettingsIcon, description: 'Application preferences and defaults' },
        { id: 'security', name: 'Security', icon: Shield, description: 'Authentication and access control' },
        { id: 'integrations', name: 'Integrations', icon: Globe, description: 'External service connections' }
    ];

    const renderLLMSettings = () => (
        <div>
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '8px'
                }}>
                    AI Language Model Configuration
                </h3>
                <p style={{
                    fontSize: '14px',
                    color: '#b3b3b3',
                    margin: '0 0 24px 0',
                    lineHeight: '1.5'
                }}>
                    This configuration will be used across all AI features in the platform, including the Node Generator, 
                    Code Nodes, AI Assistant, and workflow analysis.
                </p>

                <div style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                }}>
                    <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#60a5fa',
                        margin: '0 0 8px 0'
                    }}>
                        🔄 AI Integration Points:
                    </h4>
                    <ul style={{
                        fontSize: '14px',
                        color: '#d1d5db',
                        margin: '0',
                        paddingLeft: '20px'
                    }}>
                        <li><strong>Node Generator:</strong> Creating custom workflow nodes</li>
                        <li><strong>Code Nodes:</strong> Generating, explaining, and debugging code</li>
                        <li><strong>AI Assistant:</strong> Help and suggestions throughout the platform</li>
                        <li><strong>Workflow Analysis:</strong> Optimization and error detection</li>
                    </ul>
                </div>
            </div>

            {/* Provider Selection */}
            <div style={{ marginBottom: '32px' }}>
                <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '16px'
                }}>
                    Choose AI Provider
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {providers.map((provider) => {
                        const Icon = provider.icon;
                        const isSelected = llmConfig.provider === provider.id;
                        
                        return (
                            <div
                                key={provider.id}
                                onClick={() => setLlmConfig(prev => ({ ...prev, provider: provider.id }))}
                                style={{
                                    padding: '20px',
                                    border: `2px solid ${isSelected ? '#8b5cf6' : '#2d2d2d'}`,
                                    borderRadius: '12px',
                                    backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : '#121212',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                            >
                                {provider.recommended && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '16px',
                                        backgroundColor: '#8b5cf6',
                                        color: '#ffffff',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        padding: '4px 8px',
                                        borderRadius: '4px'
                                    }}>
                                        RECOMMENDED
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                    <Icon size={32} style={{ color: isSelected ? '#8b5cf6' : '#b3b3b3', marginTop: '4px' }} />
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#ffffff',
                                            margin: '0 0 8px 0'
                                        }}>
                                            {provider.name}
                                        </h4>
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#b3b3b3',
                                            margin: '0 0 12px 0'
                                        }}>
                                            {provider.description}
                                        </p>
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '6px'
                                        }}>
                                            {provider.usedIn.map((feature) => (
                                                <span key={feature} style={{
                                                    fontSize: '11px',
                                                    padding: '2px 6px',
                                                    backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : '#2d2d2d',
                                                    color: isSelected ? '#a78bfa' : '#8a8a8a',
                                                    borderRadius: '4px',
                                                    fontWeight: '500'
                                                }}>
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* API Key Configuration */}
            {llmConfig.provider !== 'ollama' && (
                <div style={{ marginBottom: '32px' }}>
                    <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '16px'
                    }}>
                        API Key Configuration
                    </h4>

                    {(() => {
                        const provider = providers.find(p => p.id === llmConfig.provider);
                        return (
                            <div>
                                <div style={{
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '16px'
                                }}>
                                    <p style={{
                                        fontSize: '14px',
                                        color: '#93c5fd',
                                        margin: '0 0 8px 0',
                                        fontWeight: '500'
                                    }}>
                                        🔑 How to get your API key:
                                    </p>
                                    <ol style={{
                                        fontSize: '14px',
                                        color: '#d1d5db',
                                        margin: '0',
                                        paddingLeft: '20px'
                                    }}>
                                        <li>Visit <a href={provider.getKeyUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>{provider.getKeyUrl}</a></li>
                                        <li>Sign up or log in to your account</li>
                                        <li>Create a new API key</li>
                                        <li>Copy and paste it below</li>
                                    </ol>
                                </div>

                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    marginBottom: '8px',
                                    color: '#ffffff'
                                }}>
                                    {provider.name} API Key
                                </label>
                                <input
                                    type="password"
                                    value={llmConfig[provider.keyField]}
                                    onChange={(e) => setLlmConfig(prev => ({ 
                                        ...prev, 
                                        [provider.keyField]: e.target.value 
                                    }))}
                                    placeholder={provider.keyPlaceholder}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#121212',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#ffffff',
                                        outline: 'none',
                                        fontFamily: 'monospace'
                                    }}
                                />
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Ollama Configuration */}
            {llmConfig.provider === 'ollama' && (
                <div style={{ marginBottom: '32px' }}>
                    <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '16px'
                    }}>
                        Ollama Configuration
                    </h4>

                    <div style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '16px'
                    }}>
                        <p style={{
                            fontSize: '14px',
                            color: '#4ade80',
                            margin: '0 0 8px 0',
                            fontWeight: '500'
                        }}>
                            🦙 Ollama Setup:
                        </p>
                        <ol style={{
                            fontSize: '14px',
                            color: '#d1d5db',
                            margin: '0',
                            paddingLeft: '20px'
                        }}>
                            <li>Install Ollama: <a href="https://ollama.ai/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80' }}>https://ollama.ai/</a></li>
                            <li>Run: <code style={{ backgroundColor: '#2d2d2d', padding: '2px 4px', borderRadius: '4px' }}>ollama pull llama3.1</code></li>
                            <li>Start: <code style={{ backgroundColor: '#2d2d2d', padding: '2px 4px', borderRadius: '4px' }}>ollama serve</code></li>
                        </ol>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '8px',
                                color: '#ffffff'
                            }}>
                                Ollama Base URL
                            </label>
                            <input
                                type="text"
                                value={llmConfig.ollamaBaseUrl}
                                onChange={(e) => setLlmConfig(prev => ({ ...prev, ollamaBaseUrl: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#121212',
                                    border: '1px solid #404040',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#ffffff',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '8px',
                                color: '#ffffff'
                            }}>
                                Model
                            </label>
                            <input
                                type="text"
                                value={llmConfig.ollamaModel}
                                onChange={(e) => setLlmConfig(prev => ({ ...prev, ollamaModel: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#121212',
                                    border: '1px solid #404040',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#ffffff',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={testLLMConnection}
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: 'transparent',
                        border: '1px solid #404040',
                        borderRadius: '8px',
                        color: '#b3b3b3',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {loading ? 'Testing...' : 'Test Connection'}
                </button>
                
                <button
                    onClick={saveLLMConfig}
                    disabled={loading}
                    style={{
                        flex: 2,
                        padding: '12px 16px',
                        background: loading ? '#404040' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <Save size={16} />
                    {loading ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );

    const renderGeneralSettings = () => (
        <div>
            <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '24px'
            }}>
                General Settings
            </h3>
            <p style={{ color: '#b3b3b3', marginBottom: '24px' }}>
                Configure application preferences and default behaviors.
            </p>
            
            <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2d2d2d',
                borderRadius: '12px',
                padding: '24px'
            }}>
                <p style={{ color: '#b3b3b3', textAlign: 'center' }}>
                    General settings coming soon...
                </p>
            </div>
        </div>
    );

    const renderSecuritySettings = () => (
        <div>
            <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '24px'
            }}>
                Security Settings
            </h3>
            <p style={{ color: '#b3b3b3', marginBottom: '24px' }}>
                Manage authentication, access control, and security policies.
            </p>
            
            <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2d2d2d',
                borderRadius: '12px',
                padding: '24px'
            }}>
                <p style={{ color: '#b3b3b3', textAlign: 'center' }}>
                    Security settings coming soon...
                </p>
            </div>
        </div>
    );

    const renderSuperPrompts = () => (
        <div>
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '8px'
                }}>
                    Super Prompts Configuration
                </h3>
                <p style={{
                    fontSize: '14px',
                    color: '#b3b3b3',
                    margin: '0 0 24px 0',
                    lineHeight: '1.5'
                }}>
                    Customize the AI prompts used for node generation and code generation. These prompts control how the AI behaves and what it generates.
                </p>

                <div style={{
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                }}>
                    <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#8b5cf6',
                        margin: '0 0 8px 0'
                    }}>
                        💡 Tips for effective prompts:
                    </h4>
                    <ul style={{
                        fontSize: '14px',
                        color: '#d1d5db',
                        margin: '0',
                        paddingLeft: '20px'
                    }}>
                        <li>Be specific about the desired output format</li>
                        <li>Include examples when possible</li>
                        <li>Set clear constraints and requirements</li>
                        <li>Use consistent terminology throughout</li>
                    </ul>
                </div>
            </div>

            {/* Node Generation Prompt */}
            <div style={{ marginBottom: '32px' }}>
                <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '16px'
                }}>
                    A) Node Generation Prompt
                </h4>
                <p style={{
                    fontSize: '14px',
                    color: '#b3b3b3',
                    marginBottom: '16px'
                }}>
                    This prompt controls how the AI generates new workflow nodes. It defines the structure, requirements, and output format.
                </p>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '8px',
                        color: '#ffffff'
                    }}>
                        System Prompt
                    </label>
                    <textarea
                        value={superPrompts.nodeGeneration?.system || ''}
                        onChange={(e) => setSuperPrompts(prev => ({
                            ...prev,
                            nodeGeneration: {
                                ...prev.nodeGeneration,
                                system: e.target.value
                            }
                        }))}
                        placeholder="Enter the system prompt for node generation..."
                        style={{
                            width: '100%',
                            height: '200px',
                            padding: '12px',
                            backgroundColor: '#121212',
                            border: '1px solid #404040',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#ffffff',
                            outline: 'none',
                            fontFamily: 'monospace',
                            resize: 'vertical',
                            lineHeight: '1.4'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '8px',
                        color: '#ffffff'
                    }}>
                        User Prompt Template
                    </label>
                    <textarea
                        value={superPrompts.nodeGeneration?.user || ''}
                        onChange={(e) => setSuperPrompts(prev => ({
                            ...prev,
                            nodeGeneration: {
                                ...prev.nodeGeneration,
                                user: e.target.value
                            }
                        }))}
                        placeholder="Enter the user prompt template (use {request} as placeholder for user input)..."
                        style={{
                            width: '100%',
                            height: '120px',
                            padding: '12px',
                            backgroundColor: '#121212',
                            border: '1px solid #404040',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#ffffff',
                            outline: 'none',
                            fontFamily: 'monospace',
                            resize: 'vertical',
                            lineHeight: '1.4'
                        }}
                    />
                    <p style={{
                        fontSize: '12px',
                        color: '#8a8a8a',
                        margin: '4px 0 0 0'
                    }}>
                        Use {'{request}'} as a placeholder for the user's node generation request
                    </p>
                </div>
            </div>

            {/* Code Generation Prompt */}
            <div style={{ marginBottom: '32px' }}>
                <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '16px'
                }}>
                    B) Code Generation Prompt
                </h4>
                <p style={{
                    fontSize: '14px',
                    color: '#b3b3b3',
                    marginBottom: '16px'
                }}>
                    This prompt controls how the AI generates and explains code within nodes and other code-related tasks.
                </p>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '8px',
                        color: '#ffffff'
                    }}>
                        System Prompt
                    </label>
                    <textarea
                        value={superPrompts.codeGeneration?.system || ''}
                        onChange={(e) => setSuperPrompts(prev => ({
                            ...prev,
                            codeGeneration: {
                                ...prev.codeGeneration,
                                system: e.target.value
                            }
                        }))}
                        placeholder="Enter the system prompt for code generation..."
                        style={{
                            width: '100%',
                            height: '200px',
                            padding: '12px',
                            backgroundColor: '#121212',
                            border: '1px solid #404040',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#ffffff',
                            outline: 'none',
                            fontFamily: 'monospace',
                            resize: 'vertical',
                            lineHeight: '1.4'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '8px',
                        color: '#ffffff'
                    }}>
                        User Prompt Template
                    </label>
                    <textarea
                        value={superPrompts.codeGeneration?.user || ''}
                        onChange={(e) => setSuperPrompts(prev => ({
                            ...prev,
                            codeGeneration: {
                                ...prev.codeGeneration,
                                user: e.target.value
                            }
                        }))}
                        placeholder="Enter the user prompt template for code generation..."
                        style={{
                            width: '100%',
                            height: '120px',
                            padding: '12px',
                            backgroundColor: '#121212',
                            border: '1px solid #404040',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#ffffff',
                            outline: 'none',
                            fontFamily: 'monospace',
                            resize: 'vertical',
                            lineHeight: '1.4'
                        }}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={resetPromptsToDefaults}
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: 'transparent',
                        border: '1px solid #dc2626',
                        borderRadius: '8px',
                        color: '#dc2626',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {loading ? 'Resetting...' : 'Reset to Defaults'}
                </button>
                
                <button
                    onClick={saveSuperPrompts}
                    disabled={loading}
                    style={{
                        flex: 2,
                        padding: '12px 16px',
                        background: loading ? '#404040' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <Save size={16} />
                    {loading ? 'Saving...' : 'Save Super Prompts'}
                </button>
            </div>
        </div>
    );

    const renderIntegrationsSettings = () => (
        <div>
            <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '24px'
            }}>
                Integrations
            </h3>
            <p style={{ color: '#b3b3b3', marginBottom: '24px' }}>
                Connect external services and configure API integrations.
            </p>
            
            <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2d2d2d',
                borderRadius: '12px',
                padding: '24px'
            }}>
                <p style={{ color: '#b3b3b3', textAlign: 'center' }}>
                    Integration settings coming soon...
                </p>
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0a0a0a',
            fontFamily: '"Inter", sans-serif',
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(0, 212, 170, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(31, 186, 211, 0.05) 0%, transparent 50%)'
        }}>
            {/* Header */}
            <div style={{
                backgroundColor: '#121212',
                borderBottom: '1px solid #2d2d2d',
                padding: '16px 24px'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                backgroundColor: 'transparent',
                                border: '1px solid #404040',
                                borderRadius: '8px',
                                color: '#b3b3b3',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#2d2d2d';
                                e.target.style.borderColor = '#505050';
                                e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.borderColor = '#404040';
                                e.target.style.color = '#b3b3b3';
                            }}
                        >
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </button>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
                            }}>
                                <SettingsIcon size={24} style={{ color: '#ffffff' }} />
                            </div>
                            <div>
                                <h1 style={{
                                    fontSize: '28px',
                                    fontWeight: '700',
                                    color: '#ffffff',
                                    margin: '0',
                                    letterSpacing: '-0.025em'
                                }}>
                                    Settings
                                </h1>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#b3b3b3',
                                    margin: '0'
                                }}>
                                    Configure AI providers and platform preferences
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Bar */}
            {message && (
                <div style={{
                    padding: '12px 24px',
                    backgroundColor: message.type === 'error' ? '#2d1b1b' : 
                                   message.type === 'success' ? '#1b2d20' : '#1b202d',
                    borderBottom: '1px solid #2d2d2d',
                    color: message.type === 'error' ? '#ff8a8a' : 
                           message.type === 'success' ? '#86efac' : '#93c5fd',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center'
                }}>
                    {message.type === 'success' && <Check size={16} />}
                    {message.type === 'error' && <AlertTriangle size={16} />}
                    {message.text}
                </div>
            )}

            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '32px 24px',
                display: 'grid',
                gridTemplateColumns: '280px 1fr',
                gap: '32px'
            }}>
                {/* Sidebar */}
                <div>
                    <nav style={{ position: 'sticky', top: '32px' }}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px',
                                        backgroundColor: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                        border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                                        borderRadius: '12px',
                                        color: isActive ? '#8b5cf6' : '#b3b3b3',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        textAlign: 'left',
                                        marginBottom: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                            e.target.style.color = '#ffffff';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.target.style.backgroundColor = 'transparent';
                                            e.target.style.color = '#b3b3b3';
                                        }
                                    }}
                                >
                                    <Icon size={20} />
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                                            {tab.name}
                                        </div>
                                        <div style={{ 
                                            fontSize: '12px', 
                                            opacity: 0.8,
                                            marginTop: '2px'
                                        }}>
                                            {tab.description}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content */}
                <div style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2d2d2d',
                    borderRadius: '16px',
                    padding: '32px'
                }}>
                    {activeTab === 'llm' && renderLLMSettings()}
                    {activeTab === 'prompts' && renderSuperPrompts()}
                    {activeTab === 'general' && renderGeneralSettings()}
                    {activeTab === 'security' && renderSecuritySettings()}
                    {activeTab === 'integrations' && renderIntegrationsSettings()}
                </div>
            </div>
        </div>
    );
};

export default Settings;