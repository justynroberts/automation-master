import React, { useState, useEffect, useCallback } from 'react';
import { X, Square, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Maximize2, Copy, Download, ChevronDown, ChevronRight } from 'lucide-react';
import workflowService from '../services/workflowService';

const ExecutionMonitor = ({ executionId, onClose }) => {
    const [execution, setExecution] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [showStdoutModal, setShowStdoutModal] = useState(false);
    const [showStderrModal, setShowStderrModal] = useState(false);
    const [showLogs, setShowLogs] = useState(true);
    const [showOutputData, setShowOutputData] = useState(true);

    const fetchExecution = useCallback(async () => {
        try {
            const executionData = await workflowService.getExecution(executionId);
            setExecution(executionData);
            
            // Fetch logs
            const logsData = await workflowService.getExecutionLogs(executionId);
            console.log('Fetched logs:', logsData); // Debug log
            setLogs(Array.isArray(logsData) ? logsData : []);
            
            // Stop auto-refresh if execution is complete
            if (executionData.status === 'completed' || executionData.status === 'failed' || executionData.status === 'cancelled') {
                setAutoRefresh(false);
            }
        } catch (error) {
            console.error('Failed to fetch execution:', error);
        } finally {
            setLoading(false);
        }
    }, [executionId]);

    useEffect(() => {
        fetchExecution();
    }, [fetchExecution]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchExecution();
        }, 2000);

        return () => clearInterval(interval);
    }, [autoRefresh, fetchExecution]);

    const handleCancel = async () => {
        try {
            await workflowService.cancelExecution(executionId);
            fetchExecution();
        } catch (error) {
            console.error('Failed to cancel execution:', error);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock size={16} style={{ color: '#fbbf24' }} />;
            case 'running': return <RefreshCw size={16} style={{ color: '#00d4aa', animation: 'spin 1s linear infinite' }} />;
            case 'completed': return <CheckCircle size={16} style={{ color: '#22c55e' }} />;
            case 'failed': return <XCircle size={16} style={{ color: '#ef4444' }} />;
            case 'cancelled': return <Square size={16} style={{ color: '#94a3b8' }} />;
            default: return <AlertCircle size={16} style={{ color: '#94a3b8' }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#fbbf24';
            case 'running': return '#00d4aa';
            case 'completed': return '#22c55e';
            case 'failed': return '#ef4444';
            case 'cancelled': return '#94a3b8';
            default: return '#94a3b8';
        }
    };

    const formatDuration = (startTime, endTime) => {
        if (!startTime) return '-';
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const diff = end - start;
        
        if (diff < 1000) return `${diff}ms`;
        if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
        return `${(diff / 60000).toFixed(1)}m`;
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const getAllStdout = () => {
        console.log('Getting stdout from execution:', execution); // Debug log
        
        if (execution && execution.output_data) {
            console.log('Output data:', execution.output_data); // Debug log
            
            // Check if output_data is a string
            if (typeof execution.output_data === 'string') {
                return execution.output_data;
            }
            
            // Check for direct stdout field
            if (execution.output_data.stdout) {
                return execution.output_data.stdout;
            }
            
            // Check for results object containing node results
            if (execution.output_data.results) {
                const allStdout = [];
                
                // Iterate through all node results to find stdout
                Object.values(execution.output_data.results).forEach(nodeResult => {
                    if (nodeResult.stdout) {
                        allStdout.push(nodeResult.stdout);
                    } else if (nodeResult.result && typeof nodeResult.result === 'string') {
                        allStdout.push(nodeResult.result);
                    }
                });
                
                if (allStdout.length > 0) {
                    return allStdout.join('\n');
                }
            }
            
            // Check for direct result field
            if (execution.output_data.result) {
                return typeof execution.output_data.result === 'string' 
                    ? execution.output_data.result 
                    : JSON.stringify(execution.output_data.result, null, 2);
            }
        }
        
        // Fallback to logs that contain actual output (not engine logs)
        const outputLogs = logs.filter(log => 
            log.log_level === 'info' && 
            log.source !== 'engine' &&
            !log.message.includes('Starting execution') &&
            !log.message.includes('Processing node') &&
            !log.message.includes('completed successfully')
        );
        
        if (outputLogs.length > 0) {
            return outputLogs.map(log => log.message).join('\n');
        }
        
        // Final fallback - return all non-error logs
        const allLogs = logs.filter(log => log.log_level !== 'error').map(log => log.message).join('\n');
        return allLogs || 'No output available';
    };

    const getAllStderr = () => {
        console.log('Getting stderr from execution:', execution); // Debug log
        
        if (execution && execution.output_data) {
            // Check for direct stderr field
            if (execution.output_data.stderr) {
                return execution.output_data.stderr;
            }
            
            // Check for results object containing node stderr
            if (execution.output_data.results) {
                const allStderr = [];
                
                // Iterate through all node results to find stderr
                Object.values(execution.output_data.results).forEach(nodeResult => {
                    if (nodeResult.stderr) {
                        allStderr.push(nodeResult.stderr);
                    }
                });
                
                if (allStderr.length > 0) {
                    return allStderr.join('\n');
                }
            }
        }
        
        // Get error messages from execution
        if (execution && execution.error_message) {
            return execution.error_message;
        }
        
        // Fallback to error logs
        const errorLogs = logs.filter(log => 
            log.log_level === 'error'
        );
        
        if (errorLogs.length > 0) {
            return errorLogs.map(log => log.message).join('\n');
        }
        
        return 'No errors available';
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    const downloadAsFile = (content, filename) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '500px',
                height: '100vh',
                backgroundColor: '#121212',
                boxShadow: '-2px 0 8px rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Inter", sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px', color: '#00d4aa' }} />
                    <div style={{ color: '#ffffff' }}>Loading execution details...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '500px',
            height: '100vh',
            backgroundColor: '#121212',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Inter", sans-serif'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #2d2d2d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#1a1a1a'
            }}>
                <div>
                    <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#ffffff'
                    }}>
                        Execution Monitor
                    </h3>
                    {execution && (
                        <div style={{
                            fontSize: '12px',
                            color: '#b3b3b3',
                            marginTop: '2px'
                        }}>
                            {execution.workflow_name} • {execution.id.substr(0, 8)}
                        </div>
                    )}
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: '#b3b3b3',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Execution Status */}
            {execution && (
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #2d2d2d',
                    backgroundColor: '#1a1a1a'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px'
                    }}>
                        {getStatusIcon(execution.status)}
                        <span style={{
                            fontSize: '16px',
                            fontWeight: '500',
                            color: getStatusColor(execution.status),
                            textTransform: 'capitalize'
                        }}>
                            {execution.status}
                        </span>
                        {(execution.status === 'running' || execution.status === 'pending') && (
                            <button
                                onClick={handleCancel}
                                style={{
                                    marginLeft: 'auto',
                                    padding: '4px 8px',
                                    backgroundColor: '#dc2626',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Square size={12} />
                                Cancel
                            </button>
                        )}
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        fontSize: '12px',
                        color: '#b3b3b3'
                    }}>
                        <div>
                            <div style={{ fontWeight: '500', marginBottom: '2px', color: '#ffffff' }}>Started</div>
                            <div>{execution.started_at ? formatTimestamp(execution.started_at) : '-'}</div>
                        </div>
                        <div>
                            <div style={{ fontWeight: '500', marginBottom: '2px', color: '#ffffff' }}>Duration</div>
                            <div>{formatDuration(execution.started_at, execution.completed_at)}</div>
                        </div>
                        {execution.completed_at && (
                            <>
                                <div>
                                    <div style={{ fontWeight: '500', marginBottom: '2px', color: '#ffffff' }}>Completed</div>
                                    <div>{formatTimestamp(execution.completed_at)}</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: '500', marginBottom: '2px', color: '#ffffff' }}>Result</div>
                                    <div style={{ 
                                        color: execution.status === 'completed' ? '#10b981' : '#ef4444',
                                        fontWeight: '500'
                                    }}>
                                        {execution.status === 'completed' ? 'Success' : 'Failed'}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {execution.error_message && (
                        <div style={{
                            marginTop: '12px',
                            padding: '8px',
                            backgroundColor: '#2d1b1b',
                            border: '1px solid #dc2626',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#ff8a8a'
                        }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px', color: '#ff8a8a' }}>Error:</div>
                            <div>{execution.error_message}</div>
                        </div>
                    )}

                </div>
            )}

            {/* Controls */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #2d2d2d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#b3b3b3',
                backgroundColor: '#1a1a1a'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Auto-refresh logs</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#ffffff' }}>
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                style={{ margin: 0 }}
                            />
                            <span>{autoRefresh ? 'On' : 'Off'}</span>
                        </label>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(logs.length > 0 || (execution && execution.output_data)) && (
                            <button
                                onClick={() => setShowStdoutModal(true)}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#00d4aa',
                                    color: '#000000',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#00c299';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#00d4aa';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <Maximize2 size={12} />
                                Output
                            </button>
                        )}
                        
                        {(logs.some(log => log.log_level === 'error') || (execution && (execution.error_message || execution.status === 'failed'))) && (
                            <button
                                onClick={() => setShowStderrModal(true)}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#ef4444',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#dc2626';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#ef4444';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <AlertCircle size={12} />
                                Errors
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Logs Section */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '200px'
            }}>
                {/* Logs Header */}
                <div style={{
                    padding: '16px 16px 8px',
                    borderBottom: showLogs ? '1px solid #2d2d2d' : 'none',
                    backgroundColor: '#1a1a1a'
                }}>
                    <h4 style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }}
                    onClick={() => setShowLogs(!showLogs)}
                    >
                        {showLogs ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        Execution Logs ({logs.length})
                        {autoRefresh && (
                            <RefreshCw size={12} style={{ 
                                color: '#00d4aa',
                                animation: 'spin 2s linear infinite'
                            }} />
                        )}
                    </h4>
                </div>

                {/* Logs Content */}
                {showLogs && (
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: '"JetBrains Mono", Monaco, Consolas, monospace',
                    backgroundColor: '#0a0a0a'
                }}>
                
                    {logs.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            color: '#6b7280',
                            padding: '40px 20px',
                            fontSize: '12px'
                        }}>
                            <AlertCircle size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                            <div>No logs available yet</div>
                        </div>
                ) : (
                    <div style={{ lineHeight: '1.6' }}>
                        {logs.map((log, index) => {
                            const isError = log.log_level === 'error';
                            const isWarn = log.log_level === 'warn' || log.log_level === 'warning';
                            const isInfo = log.log_level === 'info';
                            
                            return (
                                <div
                                    key={index}
                                    style={{
                                        marginBottom: '8px',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: isError ? '#2d1b1b' : 
                                                       isWarn ? '#2d2719' : '#1a1a1a',
                                        border: `1px solid ${isError ? '#dc2626' : 
                                                             isWarn ? '#f59e0b' : '#404040'}`
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '4px'
                                    }}>
                                        <span style={{ 
                                            color: '#6b7280',
                                            fontSize: '11px',
                                            fontFamily: '\"JetBrains Mono\", monospace'
                                        }}>
                                            {formatTimestamp(log.timestamp)}
                                        </span>
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '12px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            backgroundColor: isError ? '#dc2626' :
                                                            isWarn ? '#f59e0b' : 
                                                            isInfo ? '#00d4aa' : '#6b7280',
                                            color: isError ? '#ffffff' :
                                                   isWarn ? '#000000' :
                                                   isInfo ? '#000000' : '#ffffff',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {log.log_level}
                                        </span>
                                        {log.node_id && log.node_id !== 'system' && (
                                            <span style={{
                                                padding: '3px 8px',
                                                borderRadius: '12px',
                                                fontSize: '10px',
                                                fontWeight: '500',
                                                backgroundColor: '#404040',
                                                color: '#ffffff',
                                                fontFamily: '\"JetBrains Mono\", monospace'
                                            }}>
                                                {log.node_id.substring(0, 8)}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        color: isError ? '#ff8a8a' :
                                               isWarn ? '#fbbf24' : '#ffffff',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        lineHeight: '1.4',
                                        fontFamily: '\"JetBrains Mono\", monospace'
                                    }}>
                                        {log.message}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    )}
                </div>
                )}
            </div>

            {/* Output Data Section */}
            {execution && execution.output_data && Object.keys(execution.output_data).length > 0 && (
                <div style={{
                    borderTop: '1px solid #2d2d2d',
                    backgroundColor: '#1a1a1a'
                }}>
                    <div style={{
                        padding: '16px 16px 8px',
                        borderBottom: showOutputData ? '1px solid #2d2d2d' : 'none'
                    }}>
                        <h4 style={{
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }}
                        onClick={() => setShowOutputData(!showOutputData)}
                        >
                            {showOutputData ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            Output Data
                        </h4>
                    </div>
                    {showOutputData && (
                    <div style={{
                        padding: '16px',
                        backgroundColor: '#0a0a0a',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#1b2d20',
                            border: '1px solid #22c55e',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#86efac'
                        }}>
                            <pre style={{
                                margin: 0,
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: '11px',
                                lineHeight: '1.4',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {JSON.stringify(execution.output_data, null, 2)}
                            </pre>
                        </div>
                    </div>
                    )}
                </div>
            )}

            {/* Stdout Modal */}
            {showStdoutModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        backgroundColor: '#121212',
                        border: '1px solid #2d2d2d',
                        borderRadius: '16px',
                        width: '90vw',
                        maxWidth: '1200px',
                        height: '85vh',
                        maxHeight: '800px',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
                        fontFamily: '"Inter", sans-serif'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '24px',
                            borderBottom: '1px solid #2d2d2d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: '#00d4aa',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Maximize2 size={20} style={{ color: '#000000' }} />
                                </div>
                                <div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '20px',
                                        fontWeight: '600',
                                        color: '#ffffff'
                                    }}>
                                        Output
                                    </h3>
                                    <p style={{
                                        margin: '4px 0 0 0',
                                        fontSize: '14px',
                                        color: '#b3b3b3'
                                    }}>
                                        Raw output for analysis and reporting
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={() => copyToClipboard(getAllStdout())}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#2d2d2d',
                                        color: '#ffffff',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#404040';
                                        e.target.style.borderColor = '#505050';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#2d2d2d';
                                        e.target.style.borderColor = '#404040';
                                    }}
                                >
                                    <Copy size={14} />
                                    Copy
                                </button>
                                <button
                                    onClick={() => downloadAsFile(getAllStdout(), `execution-${executionId}-output.txt`)}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#2d2d2d',
                                        color: '#ffffff',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#404040';
                                        e.target.style.borderColor = '#505050';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#2d2d2d';
                                        e.target.style.borderColor = '#404040';
                                    }}
                                >
                                    <Download size={14} />
                                    Download
                                </button>
                                <button
                                    onClick={() => setShowStdoutModal(false)}
                                    style={{
                                        padding: '8px',
                                        backgroundColor: 'transparent',
                                        color: '#b3b3b3',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
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
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div style={{
                            flex: 1,
                            padding: '24px',
                            backgroundColor: '#0a0a0a',
                            borderBottomLeftRadius: '16px',
                            borderBottomRightRadius: '16px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #2d2d2d',
                                borderRadius: '8px',
                                padding: '16px'
                            }}>
                                <pre style={{
                                    margin: 0,
                                    fontFamily: '"JetBrains Mono", Monaco, Consolas, monospace',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    color: '#ffffff',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}>
                                    {getAllStdout() || 'No output available'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stderr Modal */}
            {showStderrModal && (
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
                    zIndex: 2000,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: '16px',
                        width: '90vw',
                        maxWidth: '1000px',
                        height: '80vh',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '24px',
                            borderBottom: '1px solid #2d2d2d',
                            backgroundColor: '#1a1a1a'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '16px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: '#ef4444',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <AlertCircle size={20} style={{ color: '#ffffff' }} />
                                </div>
                                <div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '20px',
                                        fontWeight: '600',
                                        color: '#ffffff'
                                    }}>
                                        Errors
                                    </h3>
                                    <p style={{
                                        margin: '4px 0 0 0',
                                        fontSize: '14px',
                                        color: '#b3b3b3'
                                    }}>
                                        Error messages and stderr output for debugging
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={() => copyToClipboard(getAllStderr())}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#2d2d2d',
                                        color: '#ffffff',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#404040';
                                        e.target.style.borderColor = '#505050';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#2d2d2d';
                                        e.target.style.borderColor = '#404040';
                                    }}
                                >
                                    <Copy size={14} />
                                    Copy
                                </button>
                                <button
                                    onClick={() => downloadAsFile(getAllStderr(), `execution-${executionId}-errors.txt`)}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#2d2d2d',
                                        color: '#ffffff',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#404040';
                                        e.target.style.borderColor = '#505050';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#2d2d2d';
                                        e.target.style.borderColor = '#404040';
                                    }}
                                >
                                    <Download size={14} />
                                    Download
                                </button>
                                <button
                                    onClick={() => setShowStderrModal(false)}
                                    style={{
                                        padding: '8px',
                                        backgroundColor: 'transparent',
                                        color: '#b3b3b3',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
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
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div style={{
                            flex: 1,
                            padding: '24px',
                            backgroundColor: '#0a0a0a',
                            borderBottomLeftRadius: '16px',
                            borderBottomRightRadius: '16px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #2d2d2d',
                                borderRadius: '8px',
                                padding: '16px'
                            }}>
                                <pre style={{
                                    margin: 0,
                                    fontFamily: '"JetBrains Mono", Monaco, Consolas, monospace',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    color: '#ff8a8a',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}>
                                    {getAllStderr() || 'No errors available'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutionMonitor;