import React, { useState, useRef, useEffect } from 'react';
import { Play, Copy, RotateCcw, Download, Maximize2, Minimize2, Sparkles, X, Settings, FileText } from 'lucide-react';

const CodeEditor = ({ 
    value, 
    onChange, 
    language = 'javascript', 
    placeholder = '',
    onRun = null 
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lineNumbers, setLineNumbers] = useState([]);
    const [showAIPrompt, setShowAIPrompt] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [claudeApiKey, setClaudeApiKey] = useState(localStorage.getItem('claudeApiKey') || '');
    const [masterPrompt, setMasterPrompt] = useState(localStorage.getItem('masterPrompt') || '');
    const [showMasterPromptSetup, setShowMasterPromptSetup] = useState(false);
    const textareaRef = useRef(null);
    const lineNumbersRef = useRef(null);

    useEffect(() => {
        updateLineNumbers();
    }, [value]);

    const updateLineNumbers = () => {
        const lines = value ? value.split('\n').length : 1;
        setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
    };

    const handleScroll = (e) => {
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = e.target.scrollTop;
        }
    };

    const handleKeyDown = (e) => {
        const textarea = e.target;
        const { selectionStart, selectionEnd } = textarea;

        // Tab key handling
        if (e.key === 'Tab') {
            e.preventDefault();
            const beforeSelection = value.substring(0, selectionStart);
            const afterSelection = value.substring(selectionEnd);
            const newValue = beforeSelection + '    ' + afterSelection;
            onChange(newValue);
            
            // Set cursor position after the tab
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = selectionStart + 4;
            }, 0);
        }

        // Auto-indent on Enter
        if (e.key === 'Enter') {
            const lines = value.substring(0, selectionStart).split('\n');
            const currentLine = lines[lines.length - 1];
            const indent = currentLine.match(/^\s*/)[0];
            
            // Add extra indent for opening braces/brackets
            const extraIndent = /[{\[\(]\s*$/.test(currentLine.trim()) ? '    ' : '';
            
            e.preventDefault();
            const newValue = value.substring(0, selectionStart) + '\n' + indent + extraIndent + value.substring(selectionEnd);
            onChange(newValue);
            
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + indent.length + extraIndent.length;
            }, 0);
        }
    };

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(value);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    const resetCode = () => {
        onChange(placeholder);
    };

    const downloadCode = () => {
        const extension = language === 'python' ? 'py' : language === 'bash' ? 'sh' : 'js';
        const blob = new Blob([value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `script.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const saveApiKey = () => {
        localStorage.setItem('claudeApiKey', claudeApiKey);
        setShowSettings(false);
    };

    const saveMasterPrompt = () => {
        localStorage.setItem('masterPrompt', masterPrompt);
        setShowMasterPromptSetup(false);
    };

    const generateAICode = async () => {
        if (!claudeApiKey) {
            alert('Please configure your Claude API key in settings first.');
            setShowSettings(true);
            return;
        }

        if (!aiPrompt.trim()) {
            alert('Please enter a description for the code you want to generate.');
            return;
        }

        setIsGenerating(true);
        
        try {
            let systemPrompt = `You are a professional ${language} developer. Generate clean, well-structured, and commented ${language} code based on the user's description. Follow these guidelines:

1. Write idiomatic ${language} code
2. Include appropriate comments explaining complex logic
3. Use proper variable/function naming conventions for ${language}
4. Follow ${language} best practices and conventions
5. Make the code production-ready and error-resistant
6. Only return the code - no explanations or markdown formatting
7. Ensure the code is complete and runnable

Language-specific guidelines:
${language === 'python' ? '- Use proper Python conventions (snake_case, PEP 8)\n- Include docstrings for functions\n- Use type hints where appropriate' : 
  language === 'javascript' ? '- Use modern ES6+ features\n- Use camelCase naming\n- Include JSDoc comments for functions' :
  language === 'bash' ? '- Use proper shell scripting practices\n- Include error handling with set -e\n- Use meaningful variable names in UPPER_CASE' : 
  '- Follow standard coding conventions'}`;
            
            // Add master prompt if configured
            if (masterPrompt && masterPrompt.trim()) {
                systemPrompt += `\n\nAdditional Context & Instructions:\n${masterPrompt.trim()}`;
            }

            console.log('Generating code with Claude API via backend proxy...');
            console.log('API Key:', claudeApiKey ? `${claudeApiKey.substring(0, 10)}...` : 'Not set');
            console.log('Master Prompt:', masterPrompt ? 'Configured' : 'Not configured');
            
            // Get auth token for backend API
            const authToken = localStorage.getItem('accessToken');
            if (!authToken) {
                throw new Error('Please login to use AI code generation');
            }
            
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_BASE_URL}/ai/generate-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    language: language,
                    masterPrompt: masterPrompt,
                    claudeApiKey: claudeApiKey
                })
            });

            if (!response.ok) {
                let errorMessage = `API request failed with status ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                    
                    // Handle specific Claude API errors
                    if (errorData.claudeStatus) {
                        if (errorData.claudeStatus === 401) {
                            errorMessage = 'Invalid Claude API key. Please check your API key in settings.';
                        } else if (errorData.claudeStatus === 429) {
                            errorMessage = 'Claude API rate limit exceeded. Please try again later.';
                        }
                    }
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const generatedCode = data.code;
            
            if (!generatedCode) {
                throw new Error('No code was generated. Please try again with a different prompt.');
            }
            
            onChange(generatedCode);
            console.log(`✅ Generated ${generatedCode.length} characters of code using ${data.model}`);
            setShowAIPrompt(false);
            setAiPrompt('');
        } catch (error) {
            console.error('AI Code generation failed:', error);
            alert(`Failed to generate code: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const getSyntaxHighlighting = () => {
        // Basic syntax highlighting patterns
        const patterns = {
            javascript: [
                { pattern: /\b(function|const|let|var|if|else|for|while|return|class|import|export|async|await)\b/g, className: 'keyword' },
                { pattern: /\/\/.*$/gm, className: 'comment' },
                { pattern: /\/\*[\s\S]*?\*\//g, className: 'comment' },
                { pattern: /"[^"]*"/g, className: 'string' },
                { pattern: /'[^']*'/g, className: 'string' },
                { pattern: /`[^`]*`/g, className: 'string' }
            ],
            python: [
                { pattern: /\b(def|class|if|else|elif|for|while|import|from|return|try|except|with|as)\b/g, className: 'keyword' },
                { pattern: /#.*$/gm, className: 'comment' },
                { pattern: /"[^"]*"/g, className: 'string' },
                { pattern: /'[^']*'/g, className: 'string' }
            ],
            bash: [
                { pattern: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function)\b/g, className: 'keyword' },
                { pattern: /#.*$/gm, className: 'comment' },
                { pattern: /"[^"]*"/g, className: 'string' },
                { pattern: /'[^']*'/g, className: 'string' }
            ]
        };
        return patterns[language] || patterns.javascript;
    };

    return (
        <>
            <style>
                {`
                    .code-editor-keyword { color: #c678dd; font-weight: 500; }
                    .code-editor-comment { color: #5c6370; font-style: italic; }
                    .code-editor-string { color: #98c379; }
                    .code-editor-number { color: #d19a66; }
                    .code-editor-operator { color: #56b6c2; }
                `}
            </style>
            <div style={{
                position: isFullscreen ? 'fixed' : 'relative',
                top: isFullscreen ? 0 : 'auto',
                left: isFullscreen ? 0 : 'auto',
                right: isFullscreen ? 0 : 'auto',
                bottom: isFullscreen ? 0 : 'auto',
                zIndex: isFullscreen ? 9999 : 'auto',
                backgroundColor: '#0a0a0a',
                border: '1px solid #404040',
                borderRadius: isFullscreen ? 0 : '8px',
                overflow: 'hidden',
                fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", "Consolas", monospace'
            }}>
                {/* Toolbar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: '#1a1a1a',
                    borderBottom: '1px solid #404040'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            fontSize: '12px',
                            color: '#b3b3b3',
                            textTransform: 'uppercase',
                            fontWeight: '600',
                            letterSpacing: '0.5px'
                        }}>
                            {language}
                        </span>
                        <div style={{
                            width: '1px',
                            height: '16px',
                            backgroundColor: '#404040'
                        }} />
                        <span style={{
                            fontSize: '12px',
                            color: '#8a8a8a'
                        }}>
                            {lineNumbers.length} lines
                        </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                            onClick={() => setShowAIPrompt(true)}
                            style={{
                                padding: '6px',
                                backgroundColor: '#8b5cf6',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
                            title="Generate Code with AI"
                        >
                            <Sparkles size={14} />
                        </button>
                        <button
                            onClick={() => setShowMasterPromptSetup(true)}
                            style={{
                                padding: '6px',
                                backgroundColor: masterPrompt ? '#8b5cf6' : 'transparent',
                                color: masterPrompt ? '#ffffff' : '#b3b3b3',
                                border: '1px solid #404040',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!masterPrompt) {
                                    e.target.style.backgroundColor = '#2d2d2d';
                                    e.target.style.color = '#ffffff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!masterPrompt) {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = '#b3b3b3';
                                }
                            }}
                            title="Master Prompt Setup"
                        >
                            <FileText size={14} />
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            style={{
                                padding: '6px',
                                backgroundColor: 'transparent',
                                color: '#b3b3b3',
                                border: '1px solid #404040',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#2d2d2d';
                                e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#b3b3b3';
                            }}
                            title="AI Settings"
                        >
                            <Settings size={14} />
                        </button>
                        {onRun && (
                            <button
                                onClick={() => onRun(value)}
                                style={{
                                    padding: '6px',
                                    backgroundColor: '#00d4aa',
                                    color: '#000000',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#00c299'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#00d4aa'}
                                title="Run Code"
                            >
                                <Play size={14} />
                            </button>
                        )}
                        <button
                            onClick={copyCode}
                            style={{
                                padding: '6px',
                                backgroundColor: 'transparent',
                                color: '#b3b3b3',
                                border: '1px solid #404040',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#2d2d2d';
                                e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#b3b3b3';
                            }}
                            title="Copy Code"
                        >
                            <Copy size={14} />
                        </button>
                        <button
                            onClick={resetCode}
                            style={{
                                padding: '6px',
                                backgroundColor: 'transparent',
                                color: '#b3b3b3',
                                border: '1px solid #404040',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#2d2d2d';
                                e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#b3b3b3';
                            }}
                            title="Reset Code"
                        >
                            <RotateCcw size={14} />
                        </button>
                        <button
                            onClick={downloadCode}
                            style={{
                                padding: '6px',
                                backgroundColor: 'transparent',
                                color: '#b3b3b3',
                                border: '1px solid #404040',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#2d2d2d';
                                e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#b3b3b3';
                            }}
                            title="Download Code"
                        >
                            <Download size={14} />
                        </button>
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            style={{
                                padding: '6px',
                                backgroundColor: 'transparent',
                                color: '#b3b3b3',
                                border: '1px solid #404040',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#2d2d2d';
                                e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#b3b3b3';
                            }}
                            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div style={{
                    display: 'flex',
                    height: isFullscreen ? 'calc(100vh - 49px)' : '400px',
                    backgroundColor: '#0a0a0a'
                }}>
                    {/* Line Numbers */}
                    <div
                        ref={lineNumbersRef}
                        style={{
                            width: '50px',
                            backgroundColor: '#121212',
                            borderRight: '1px solid #404040',
                            padding: '12px 8px',
                            fontSize: '12px',
                            color: '#6b7280',
                            fontFamily: 'inherit',
                            lineHeight: '1.5',
                            textAlign: 'right',
                            userSelect: 'none',
                            overflow: 'hidden'
                        }}
                    >
                        {lineNumbers.map(num => (
                            <div key={num} style={{ minHeight: '18px' }}>{num}</div>
                        ))}
                    </div>

                    {/* Code Input */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onScroll={handleScroll}
                        placeholder={placeholder}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            lineHeight: '1.5',
                            resize: 'none',
                            whiteSpace: 'pre',
                            overflowWrap: 'normal',
                            overflowX: 'auto'
                        }}
                        spellCheck={false}
                    />
                </div>

                {/* AI Prompt Modal */}
                {showAIPrompt && (
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
                        zIndex: 10000
                    }}>
                        <div style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #404040',
                            borderRadius: '12px',
                            padding: '24px',
                            width: '500px',
                            maxWidth: '90vw'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '18px',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Sparkles size={20} style={{ color: '#8b5cf6' }} />
                                    Generate {language} Code
                                </h3>
                                <button
                                    onClick={() => setShowAIPrompt(false)}
                                    style={{
                                        padding: '4px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: '#b3b3b3',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder={`Describe the ${language} code you want to generate...\n\nExample: "Create a function that validates email addresses and returns true/false"`}
                                style={{
                                    width: '100%',
                                    height: '120px',
                                    padding: '12px',
                                    backgroundColor: '#0a0a0a',
                                    border: '1px solid #404040',
                                    borderRadius: '6px',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontFamily: '"Inter", sans-serif',
                                    resize: 'vertical',
                                    outline: 'none',
                                    marginBottom: '16px'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                onBlur={(e) => e.target.style.borderColor = '#404040'}
                            />
                            
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowAIPrompt(false)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#2d2d2d',
                                        color: '#ffffff',
                                        border: '1px solid #404040',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={generateAICode}
                                    disabled={isGenerating || !aiPrompt.trim()}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: isGenerating || !aiPrompt.trim() ? '#404040' : '#8b5cf6',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: isGenerating || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {isGenerating ? (
                                        <>
                                            <div style={{
                                                width: '14px',
                                                height: '14px',
                                                border: '2px solid transparent',
                                                borderTop: '2px solid #ffffff',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }} />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={14} />
                                            Generate Code
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Modal */}
                {showSettings && (
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
                        zIndex: 10000
                    }}>
                        <div style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #404040',
                            borderRadius: '12px',
                            padding: '24px',
                            width: '400px',
                            maxWidth: '90vw'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '18px',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Settings size={20} style={{ color: '#00d4aa' }} />
                                    AI Settings
                                </h3>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    style={{
                                        padding: '4px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: '#b3b3b3',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    marginBottom: '8px',
                                    color: '#ffffff'
                                }}>
                                    Claude API Key
                                </label>
                                <input
                                    type="password"
                                    value={claudeApiKey}
                                    onChange={(e) => setClaudeApiKey(e.target.value)}
                                    placeholder="sk-ant-api03-..."
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#0a0a0a',
                                        border: '1px solid #404040',
                                        borderRadius: '6px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontFamily: '"JetBrains Mono", monospace',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00d4aa'}
                                    onBlur={(e) => e.target.style.borderColor = '#404040'}
                                />
                                <p style={{
                                    fontSize: '12px',
                                    color: '#b3b3b3',
                                    margin: '8px 0 0 0'
                                }}>
                                    Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#00d4aa' }}>Anthropic Console</a>
                                </p>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#2d2d2d',
                                        color: '#ffffff',
                                        border: '1px solid #404040',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveApiKey}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#00d4aa',
                                        color: '#000000',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Master Prompt Setup Modal */}
                {showMasterPromptSetup && (
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
                        zIndex: 10000
                    }}>
                        <div style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #404040',
                            borderRadius: '12px',
                            padding: '24px',
                            width: '600px',
                            maxWidth: '90vw'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '18px',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <FileText size={20} style={{ color: '#8b5cf6' }} />
                                    Master Prompt Setup
                                </h3>
                                <button
                                    onClick={() => setShowMasterPromptSetup(false)}
                                    style={{
                                        padding: '4px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: '#b3b3b3',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    marginBottom: '8px',
                                    color: '#ffffff'
                                }}>
                                    Master Prompt Instructions
                                </label>
                                <textarea
                                    value={masterPrompt}
                                    onChange={(e) => setMasterPrompt(e.target.value)}
                                    placeholder={`Enter overall context and instructions that will be included with every AI code generation request...

Examples:
- "This is for a React application using TypeScript and Material-UI"
- "Follow company coding standards: use camelCase, include error handling, add logging"
- "This workflow is for data processing, prioritize performance and memory efficiency"
- "Include comprehensive error handling and user-friendly error messages"`}
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        padding: '12px',
                                        backgroundColor: '#0a0a0a',
                                        border: '1px solid #404040',
                                        borderRadius: '6px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontFamily: '"Inter", sans-serif',
                                        resize: 'vertical',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                    onBlur={(e) => e.target.style.borderColor = '#404040'}
                                />
                                <p style={{
                                    fontSize: '12px',
                                    color: '#b3b3b3',
                                    margin: '8px 0 0 0'
                                }}>
                                    This master prompt will be included with every AI code generation request to provide consistent context and instructions.
                                </p>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowMasterPromptSetup(false)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#2d2d2d',
                                        color: '#ffffff',
                                        border: '1px solid #404040',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveMasterPrompt}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#8b5cf6',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Save Master Prompt
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </>
    );
};

export default CodeEditor;