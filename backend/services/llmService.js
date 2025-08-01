const { OpenAI } = require('openai');
const axios = require('axios');

/**
 * Centralized LLM Service for all AI operations across the platform
 * Used by: Node Generator, Code Nodes, AI Assistant, Workflow Analysis
 */
class LLMService {
    constructor() {
        this.refreshConfig();
    }

    /**
     * Refresh configuration from environment variables
     * Called after settings updates
     */
    refreshConfig() {
        this.llmProvider = process.env.LLM_PROVIDER || 'claude';
        
        // OpenAI configuration
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'demo-key',
        });
        
        // Ollama configuration
        this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1';
        
        // Claude configuration
        this.claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
        
        console.log(`🤖 LLM Service configured with provider: ${this.llmProvider}`);
    }

    /**
     * Generate completion using configured LLM provider
     * @param {string} prompt - The prompt to send to the LLM
     * @param {Object} options - Additional options (temperature, maxTokens, etc.)
     */
    async generateCompletion(prompt, options = {}) {
        const {
            temperature = 0.3,
            maxTokens = 2000,
            systemPrompt = null
        } = options;

        try {
            switch (this.llmProvider) {
                case 'claude':
                    return await this.generateWithClaude(prompt, systemPrompt, temperature, maxTokens);
                case 'openai':
                    return await this.generateWithOpenAI(prompt, systemPrompt, temperature, maxTokens);
                case 'ollama':
                    return await this.generateWithOllama(prompt, systemPrompt, temperature, maxTokens);
                default:
                    throw new Error(`Unsupported LLM provider: ${this.llmProvider}`);
            }
        } catch (error) {
            console.error(`❌ LLM generation failed with ${this.llmProvider}:`, error.message);
            throw error;
        }
    }

    /**
     * Generate structured JSON response (for node generation, etc.)
     */
    async generateJSON(prompt, schema, options = {}) {
        const systemPrompt = `You are an expert assistant that generates valid JSON responses.
Return only valid JSON that matches the requested format. Do not include any markdown formatting or code blocks.
${schema ? `Schema: ${JSON.stringify(schema)}` : ''}`;

        const response = await this.generateCompletion(prompt, {
            ...options,
            systemPrompt
        });

        try {
            return JSON.parse(response);
        } catch (error) {
            console.error('❌ Failed to parse JSON response:', response);
            throw new Error('LLM returned invalid JSON format');
        }
    }

    /**
     * Generate code with explanation
     */
    async generateCode(prompt, language = 'javascript', options = {}) {
        const systemPrompt = `You are an expert ${language} programmer. Generate clean, efficient, and well-documented code.
Follow best practices and include helpful comments. Return only the code without markdown formatting.`;

        return await this.generateCompletion(prompt, {
            ...options,
            systemPrompt
        });
    }

    /**
     * Analyze and explain code
     */
    async explainCode(code, options = {}) {
        const prompt = `Explain this code:\n\n${code}`;
        const systemPrompt = `You are a code analysis expert. Provide clear, concise explanations of code functionality, 
including what it does, how it works, and any notable patterns or potential issues.`;

        return await this.generateCompletion(prompt, {
            ...options,
            systemPrompt
        });
    }

    /**
     * Generate with Claude (Anthropic)
     */
    async generateWithClaude(prompt, systemPrompt, temperature, maxTokens) {
        if (!this.claudeApiKey || this.claudeApiKey === 'your_claude_api_key_here') {
            throw new Error('Claude API key not configured');
        }

        const messages = [
            { role: 'user', content: prompt }
        ];

        const requestData = {
            model: 'claude-3-sonnet-20240229',
            max_tokens: maxTokens,
            temperature: temperature,
            messages: messages
        };

        if (systemPrompt) {
            requestData.system = systemPrompt;
        }

        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            requestData,
            {
                headers: {
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60 second timeout
            }
        );

        return response.data.content[0].text;
    }

    /**
     * Generate with OpenAI
     */
    async generateWithOpenAI(prompt, systemPrompt, temperature, maxTokens) {
        const messages = [];
        
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        
        messages.push({ role: 'user', content: prompt });

        const response = await this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
            temperature: temperature,
            max_tokens: maxTokens
        });

        return response.choices[0].message.content;
    }

    /**
     * Generate with Ollama
     */
    async generateWithOllama(prompt, systemPrompt, temperature, maxTokens) {
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

        const response = await axios.post(
            `${this.ollamaBaseUrl}/api/generate`,
            {
                model: this.ollamaModel,
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: temperature,
                    num_predict: maxTokens
                }
            },
            {
                timeout: 120000 // 2 minute timeout for local models
            }
        );

        return response.data.response;
    }

    /**
     * Get current provider info
     */
    getProviderInfo() {
        return {
            provider: this.llmProvider,
            model: this.llmProvider === 'ollama' ? this.ollamaModel : 
                   this.llmProvider === 'openai' ? 'gpt-3.5-turbo' : 
                   this.llmProvider === 'claude' ? 'claude-3-sonnet' : 'unknown',
            configured: this.isConfigured()
        };
    }

    /**
     * Check if current provider is properly configured
     */
    isConfigured() {
        switch (this.llmProvider) {
            case 'claude':
                return this.claudeApiKey && this.claudeApiKey !== 'your_claude_api_key_here';
            case 'openai':
                return this.openai.apiKey && this.openai.apiKey !== 'demo-key';
            case 'ollama':
                return true; // Ollama doesn't need API key
            default:
                return false;
        }
    }
}

// Export singleton instance
const llmService = new LLMService();
module.exports = llmService;