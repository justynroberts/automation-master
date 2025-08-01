import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000, // 2 minutes for LLM requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
        console.log('🌐 API Base URL:', config.baseURL);
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('❌ API Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.status, response.config.url);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    console.log('🔄 Attempting to refresh expired token...');
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);
                    if (newRefreshToken) {
                        localStorage.setItem('refreshToken', newRefreshToken);
                    }

                    console.log('✅ Token refreshed successfully');
                    
                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } else {
                    console.log('❌ No refresh token available');
                    throw new Error('No refresh token');
                }
            } catch (refreshError) {
                console.error('❌ Token refresh failed:', refreshError.message);
                // Refresh failed, clear tokens and redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                
                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        // Handle 403 forbidden errors (expired tokens)
        if (error.response?.status === 403 && error.response?.data?.error?.includes('expired')) {
            console.warn('🔒 Token expired, clearing session...');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Auth API methods
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// User API methods
export const userAPI = {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (updates) => api.put('/user/profile', updates),
    createApiToken: (tokenData) => api.post('/user/tokens', tokenData),
    getApiTokens: () => api.get('/user/tokens'),
    deleteApiToken: (tokenId) => api.delete(`/user/tokens/${tokenId}`),
};

// Workflow API methods
export const workflowAPI = {
    getWorkflows: () => api.get('/workflows'),
    getWorkflow: (id) => api.get(`/workflows/${id}`),
    createWorkflow: (workflow) => api.post('/workflows', workflow),
    updateWorkflow: (id, updates) => api.put(`/workflows/${id}`, updates),
    deleteWorkflow: (id) => api.delete(`/workflows/${id}`),
    executeWorkflow: (id, inputData) => api.post(`/workflows/${id}/execute`, { inputData }),
};

// Execution API methods
export const executionAPI = {
    getExecution: (id) => api.get(`/executions/${id}`),
    getExecutionLogs: (id) => api.get(`/executions/${id}/logs`),
    getNodeLogs: (id, nodeId) => api.get(`/executions/${id}/nodes/${nodeId}/logs`),
    cancelExecution: (id) => api.post(`/executions/${id}/cancel`),
};

// Generated Nodes API methods
export const generatedNodesAPI = {
    generateNode: (request, context) => api.post('/generated-nodes/generate', { request, context }),
    getGeneratedNodes: () => api.get('/generated-nodes'),
    getGeneratedNode: (id) => api.get(`/generated-nodes/${id}`),
    updateGeneratedNode: (id, updates, changeDescription) => api.put(`/generated-nodes/${id}`, { ...updates, changeDescription }),
    deleteGeneratedNode: (id) => api.delete(`/generated-nodes/${id}`),
    getNodeVersions: (id) => api.get(`/generated-nodes/${id}/versions`),
    duplicateNode: (id, name) => api.post(`/generated-nodes/${id}/duplicate`, { name }),
    testNode: (id, inputs) => api.post(`/generated-nodes/${id}/test`, { inputs }),
    getNodeStats: () => api.get('/generated-nodes/stats/categories'),
};

export default api;