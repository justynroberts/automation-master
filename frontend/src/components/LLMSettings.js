import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, AlertTriangle, Cpu, Brain, Cloud } from 'lucide-react';
import api from '../services/api';

const LLMSettings = ({ onClose }) => {
    const [config, setConfig] = useState({
        provider: 'claude',
        claudeApiKey: '',
        openaiApiKey: '',
        ollamaBaseUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.1'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        loadCurrentConfig();
    }, []);

    const loadCurrentConfig = async () => {
        try {
            const response = await api.get('/config/llm');
            setConfig(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.log('Could not load current config');
        }
    };

    const showMessage = (text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const saveConfig = async () => {
        setLoading(true);
        try {
            await api.put('/config/llm', config);
            showMessage('Configuration saved successfully! Backend will restart automatically.', 'success');
            setTimeout(() => {
                if (onClose) onClose();
            }, 2000);
        } catch (error) {
            showMessage(`Failed to save configuration: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        setTesting(true);
        try {
            const response = await api.post('/config/llm/test', { provider: config.provider });
            showMessage(response.data.message, 'success');
        } catch (error) {
            showMessage(`Connection test failed: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setTesting(false);
        }
    };

    const providers = [
        {
            id: 'claude',
            name: 'Claude (Anthropic)',
            icon: Brain,
            description: 'Fast, reliable, excellent JSON formatting',
            keyField: 'claudeApiKey',
            keyPlaceholder: 'sk-ant-api03-...',
            getKeyUrl: 'https://console.anthropic.com/',
            recommended: true
        },
        {
            id: 'openai',
            name: 'OpenAI (GPT)',
            icon: Cloud,
            description: 'Popular, good performance',
            keyField: 'openaiApiKey',
            keyPlaceholder: 'sk-...',
            getKeyUrl: 'https://platform.openai.com/api-keys'
        },
        {
            id: 'ollama',
            name: 'Ollama (Local)',
            icon: Cpu,
            description: 'No API key needed, runs locally (slower)',
            noApiKey: true
        }
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2d2d2d',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                fontFamily: '"Inter", sans-serif'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #2d2d2d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Settings size={24} style={{ color: '#8b5cf6' }} />
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#ffffff',
                            margin: '0'
                        }}>
                            LLM Configuration
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#b3b3b3',
                            cursor: 'pointer',
                            fontSize: '24px',
                            padding: '4px'
                        }}
                    >
                        ×
                    </button>
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
                        gap: '8px'
                    }}>
                        {message.type === 'success' && <Check size={16} />}
                        {message.type === 'error' && <AlertTriangle size={16} />}
                        {message.text}
                    </div>
                )}

                <div style={{ padding: '24px' }}>
                    {/* Provider Selection */}
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '16px'
                    }}>
                        Choose LLM Provider
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {providers.map((provider) => {
                            const Icon = provider.icon;
                            const isSelected = config.provider === provider.id;
                            
                            return (
                                <div
                                    key={provider.id}
                                    onClick={() => setConfig(prev => ({ ...prev, provider: provider.id }))}
                                    style={{
                                        padding: '16px',
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
                                            right: '12px',
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
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Icon size={24} style={{ color: isSelected ? '#8b5cf6' : '#b3b3b3' }} />
                                        <div>
                                            <h4 style={{
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#ffffff',
                                                margin: '0 0 4px 0'
                                            }}>
                                                {provider.name}
                                            </h4>
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#b3b3b3',
                                                margin: '0'
                                            }}>
                                                {provider.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* API Key Configuration */}
                    {config.provider !== 'ollama' && (
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#ffffff',
                                marginBottom: '16px'
                            }}>
                                API Key Configuration
                            </h3>

                            {(() => {
                                const provider = providers.find(p => p.id === config.provider);
                                return (
                                    <div>
                                        <div style={{
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            marginBottom: '16px'
                                        }}>
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#93c5fd',
                                                margin: '0 0 8px 0',
                                                fontWeight: '500'
                                            }}>
                                                💡 How to get your API key:
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
                                            value={config[provider.keyField]}
                                            onChange={(e) => setConfig(prev => ({ 
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
                    {config.provider === 'ollama' && (
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#ffffff',
                                marginBottom: '16px'
                            }}>
                                Ollama Configuration
                            </h3>

                            <div style={{
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                borderRadius: '8px',
                                padding: '12px',
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
                                        value={config.ollamaBaseUrl}
                                        onChange={(e) => setConfig(prev => ({ ...prev, ollamaBaseUrl: e.target.value }))}
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
                                        value={config.ollamaModel}
                                        onChange={(e) => setConfig(prev => ({ ...prev, ollamaModel: e.target.value }))}
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
                            onClick={testConnection}
                            disabled={testing}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                backgroundColor: 'transparent',
                                border: '1px solid #404040',
                                borderRadius: '8px',
                                color: '#b3b3b3',
                                cursor: testing ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {testing ? 'Testing...' : 'Test Connection'}
                        </button>
                        
                        <button
                            onClick={saveConfig}
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
            </div>
        </div>
    );
};

export default LLMSettings;