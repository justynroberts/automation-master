class WorkflowService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
    }

    getAuthHeaders() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No authentication token found');
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            
            // Special handling for USER_INPUT_REQUIRED
            if (error.message && error.message.includes('USER_INPUT_REQUIRED')) {
                const userInputError = new Error('USER_INPUT_REQUIRED');
                userInputError.userInputRequired = error.userInputRequired || {};
                throw userInputError;
            }
            
            throw new Error(error.message || `HTTP ${response.status}`);
        }
        return response.json();
    }

    async getAllWorkflows() {
        try {
            const response = await fetch(`${this.baseURL}/workflows`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
            throw error;
        }
    }

    async getWorkflow(id) {
        try {
            const response = await fetch(`${this.baseURL}/workflows/${id}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Failed to fetch workflow ${id}:`, error);
            throw error;
        }
    }

    async createWorkflow(workflowData) {
        try {
            const response = await fetch(`${this.baseURL}/workflows`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(workflowData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Failed to create workflow:', error);
            throw error;
        }
    }

    async updateWorkflow(id, workflowData) {
        try {
            const response = await fetch(`${this.baseURL}/workflows/${id}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(workflowData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Failed to update workflow ${id}:`, error);
            throw error;
        }
    }

    async deleteWorkflow(id) {
        try {
            const response = await fetch(`${this.baseURL}/workflows/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Failed to delete workflow ${id}:`, error);
            throw error;
        }
    }

    async executeWorkflow(id, inputData = {}) {
        try {
            const response = await fetch(`${this.baseURL}/workflows/${id}/execute`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ inputData })
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Failed to execute workflow ${id}:`, error);
            throw error;
        }
    }

    async getExecution(executionId) {
        try {
            const response = await fetch(`${this.baseURL}/executions/${executionId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Failed to fetch execution ${executionId}:`, error);
            throw error;
        }
    }

    async getExecutionLogs(executionId) {
        try {
            const response = await fetch(`${this.baseURL}/executions/${executionId}/logs`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Failed to fetch execution logs ${executionId}:`, error);
            throw error;
        }
    }

    async cancelExecution(executionId) {
        try {
            const response = await fetch(`${this.baseURL}/executions/${executionId}/cancel`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Failed to cancel execution ${executionId}:`, error);
            throw error;
        }
    }
}

const workflowService = new WorkflowService();
export default workflowService;