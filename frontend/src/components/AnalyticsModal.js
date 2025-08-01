import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Filter, Calendar, TrendingUp, DollarSign, Timer } from 'lucide-react';

const AnalyticsModal = ({ isOpen, onClose }) => {
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        workflow_id: 'all',
        timeframe: '30d',
        page: 1
    });
    const [pagination, setPagination] = useState({});
    const [workflows, setWorkflows] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        failed: 0,
        running: 0,
        pending: 0
    });
    const [savings, setSavings] = useState({
        total_executions_completed: 0,
        total_time_saved_minutes: 0,
        total_time_saved_hours: 0,
        total_cost_saved: 0
    });

    useEffect(() => {
        if (isOpen) {
            fetchWorkflows();
            fetchExecutions();
        }
    }, [isOpen, filters]);

    const fetchWorkflows = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_BASE_URL}/workflows`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setWorkflows(data);
            } else {
                console.error('Failed to fetch workflows:', response.status, response.statusText);
            }
        } catch (err) {
            console.error('Failed to fetch workflows:', err);
        }
    };

    const fetchExecutions = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('accessToken');
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
            const queryParams = new URLSearchParams();
            
            if (filters.status !== 'all') queryParams.append('status', filters.status);
            if (filters.workflow_id !== 'all') queryParams.append('workflow_id', filters.workflow_id);
            if (filters.timeframe !== 'all') queryParams.append('timeframe', filters.timeframe);
            queryParams.append('page', filters.page);
            queryParams.append('limit', '20');

            const response = await fetch(`${API_BASE_URL}/executions?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setExecutions(data.executions);
                setPagination(data.pagination);
                
                // Calculate stats
                const stats = data.executions.reduce((acc, exec) => {
                    acc.total++;
                    acc[exec.status] = (acc[exec.status] || 0) + 1;
                    return acc;
                }, { total: 0, completed: 0, failed: 0, running: 0, pending: 0, cancelled: 0 });
                
                setStats(stats);
                
                // Set savings data from API response
                if (data.savings) {
                    setSavings(data.savings);
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch executions');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle style={{ width: '16px', height: '16px', color: '#22c55e' }} />;
            case 'failed':
                return <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
            case 'running':
                return <RefreshCw style={{ width: '16px', height: '16px', color: '#3b82f6' }} className="animate-spin" />;
            case 'pending':
                return <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
            case 'cancelled':
                return <AlertTriangle style={{ width: '16px', height: '16px', color: '#6b7280' }} />;
            default:
                return <Clock style={{ width: '16px', height: '16px', color: '#6b7280' }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return '#22c55e';
            case 'failed':
                return '#ef4444';
            case 'running':
                return '#3b82f6';
            case 'pending':
                return '#f59e0b';
            case 'cancelled':
                return '#6b7280';
            default:
                return '#6b7280';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (startDate, endDate) => {
        if (!endDate) return 'In progress';
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffMs = end - start;
        const diffSeconds = Math.floor(diffMs / 1000);
        
        if (diffSeconds < 60) return `${diffSeconds}s`;
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes}m ${diffSeconds % 60}s`;
        const diffHours = Math.floor(diffMinutes / 60);
        return `${diffHours}h ${diffMinutes % 60}m`;
    };

    if (!isOpen) return null;

    return (
        <>
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin {
                        animation: spin 1s linear infinite;
                    }
                `}
            </style>
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
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '16px',
                border: '1px solid #2d2d2d',
                maxWidth: '1200px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)'
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
                        <TrendingUp style={{ width: '24px', height: '24px', color: '#00d4aa' }} />
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#ffffff',
                            margin: 0
                        }}>
                            Workflow Analytics
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#8a8a8a',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#2d2d2d';
                            e.target.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#8a8a8a';
                        }}
                    >
                        <X style={{ width: '20px', height: '20px' }} />
                    </button>
                </div>

                {/* Stats Cards */}
                <div style={{ padding: '24px', borderBottom: '1px solid #2d2d2d' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            backgroundColor: '#121212',
                            border: '1px solid #2d2d2d',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
                                {stats.total}
                            </div>
                            <div style={{ fontSize: '14px', color: '#8a8a8a' }}>Total Executions</div>
                        </div>
                        <div style={{
                            backgroundColor: '#121212',
                            border: '1px solid #22c55e',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#22c55e', marginBottom: '8px' }}>
                                {stats.completed || 0}
                            </div>
                            <div style={{ fontSize: '14px', color: '#8a8a8a' }}>Completed</div>
                        </div>
                        <div style={{
                            backgroundColor: '#121212',
                            border: '1px solid #ef4444',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>
                                {stats.failed || 0}
                            </div>
                            <div style={{ fontSize: '14px', color: '#8a8a8a' }}>Failed</div>
                        </div>
                        <div style={{
                            backgroundColor: '#121212',
                            border: '1px solid #3b82f6',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px' }}>
                                {stats.running || 0}
                            </div>
                            <div style={{ fontSize: '14px', color: '#8a8a8a' }}>Running</div>
                        </div>
                        <div style={{
                            backgroundColor: '#121212',
                            border: '1px solid #f59e0b',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>
                                {stats.pending || 0}
                            </div>
                            <div style={{ fontSize: '14px', color: '#8a8a8a' }}>Pending</div>
                        </div>
                    </div>

                    {/* Savings Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px'
                    }}>
                        <div style={{
                            backgroundColor: '#121212',
                            border: '1px solid #00d4aa',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                                <Timer style={{ width: '20px', height: '20px', color: '#00d4aa' }} />
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#00d4aa' }}>
                                    {savings.total_time_saved_hours}h
                                </div>
                            </div>
                            <div style={{ fontSize: '14px', color: '#8a8a8a' }}>Time Saved</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                ({savings.total_time_saved_minutes} minutes)
                            </div>
                        </div>
                        <div style={{
                            backgroundColor: '#121212',
                            border: '1px solid #f59e0b',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                                <DollarSign style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                                    ${savings.total_cost_saved}
                                </div>
                            </div>
                            <div style={{ fontSize: '14px', color: '#8a8a8a' }}>Cost Saved</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                From {savings.total_executions_completed} successful runs
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ padding: '24px', borderBottom: '1px solid #2d2d2d' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter style={{ width: '16px', height: '16px', color: '#8a8a8a' }} />
                            <span style={{ fontSize: '14px', color: '#8a8a8a', fontWeight: '500' }}>Filters:</span>
                        </div>
                        
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#121212',
                                border: '1px solid #404040',
                                borderRadius: '8px',
                                color: '#ffffff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="running">Running</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            value={filters.workflow_id}
                            onChange={(e) => setFilters({ ...filters, workflow_id: e.target.value, page: 1 })}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#121212',
                                border: '1px solid #404040',
                                borderRadius: '8px',
                                color: '#ffffff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        >
                            <option value="all">All Workflows</option>
                            {workflows.map(workflow => (
                                <option key={workflow.id} value={workflow.id}>
                                    {workflow.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.timeframe}
                            onChange={(e) => setFilters({ ...filters, timeframe: e.target.value, page: 1 })}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#121212',
                                border: '1px solid #404040',
                                borderRadius: '8px',
                                color: '#ffffff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="all">All Time</option>
                        </select>

                        <button
                            onClick={fetchExecutions}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#00d4aa',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#000000',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#00c299'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#00d4aa'}
                        >
                            <RefreshCw style={{ width: '14px', height: '14px' }} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ height: '400px', overflow: 'auto' }}>
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#8a8a8a'
                        }}>
                            <RefreshCw style={{ width: '24px', height: '24px', marginRight: '12px' }} className="animate-spin" />
                            Loading executions...
                        </div>
                    ) : error ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#ef4444'
                        }}>
                            <XCircle style={{ width: '24px', height: '24px', marginRight: '12px' }} />
                            {error}
                        </div>
                    ) : executions.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#8a8a8a',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <Play style={{ width: '48px', height: '48px', opacity: 0.3 }} />
                            <span>No executions found</span>
                        </div>
                    ) : (
                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    margin: '0 0 16px 0'
                                }}>
                                    Recent Executions
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 200px 150px 150px 120px',
                                    gap: '16px',
                                    padding: '12px 16px',
                                    backgroundColor: '#121212',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#8a8a8a',
                                    marginBottom: '12px'
                                }}>
                                    <div>Workflow</div>
                                    <div>Status</div>
                                    <div>Started</div>
                                    <div>Duration</div>
                                    <div>ID</div>
                                </div>
                            </div>

                            {executions.map((execution) => (
                                <div
                                    key={execution.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 200px 150px 150px 120px',
                                        gap: '16px',
                                        padding: '16px',
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #2d2d2d',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        transition: 'all 0.2s ease',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#252525';
                                        e.target.style.borderColor = '#404040';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#1a1a1a';
                                        e.target.style.borderColor = '#2d2d2d';
                                    }}
                                >
                                    <div>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#ffffff',
                                            marginBottom: '4px'
                                        }}>
                                            {execution.workflow_name}
                                        </div>
                                        {execution.workflow_description && (
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#8a8a8a',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {execution.workflow_description}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {getStatusIcon(execution.status)}
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: getStatusColor(execution.status),
                                            textTransform: 'capitalize'
                                        }}>
                                            {execution.status}
                                        </span>
                                    </div>
                                    
                                    <div style={{ fontSize: '13px', color: '#b3b3b3' }}>
                                        {formatDate(execution.started_at)}
                                    </div>
                                    
                                    <div style={{ fontSize: '13px', color: '#b3b3b3' }}>
                                        {formatDuration(execution.started_at, execution.completed_at)}
                                    </div>
                                    
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#8a8a8a',
                                        fontFamily: 'monospace',
                                        backgroundColor: '#121212',
                                        padding: '4px 8px',
                                        borderRadius: '4px'
                                    }}>
                                        {execution.id.substring(0, 8)}...
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid #2d2d2d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ fontSize: '14px', color: '#8a8a8a' }}>
                            Page {pagination.currentPage} of {pagination.totalPages} 
                            ({pagination.totalCount} total executions)
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                disabled={!pagination.hasPreviousPage}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: pagination.hasPreviousPage ? '#2d2d2d' : '#1a1a1a',
                                    border: '1px solid #404040',
                                    borderRadius: '8px',
                                    color: pagination.hasPreviousPage ? '#ffffff' : '#8a8a8a',
                                    fontSize: '14px',
                                    cursor: pagination.hasPreviousPage ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                disabled={!pagination.hasNextPage}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: pagination.hasNextPage ? '#2d2d2d' : '#1a1a1a',
                                    border: '1px solid #404040',
                                    borderRadius: '8px',
                                    color: pagination.hasNextPage ? '#ffffff' : '#8a8a8a',
                                    fontSize: '14px',
                                    cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default AnalyticsModal;