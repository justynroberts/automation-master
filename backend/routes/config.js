const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const llmService = require('../services/llmService');
const router = express.Router();

const envPath = path.join(__dirname, '../.env');

// Get current LLM configuration
router.get('/llm', authenticateToken, async (req, res) => {
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        const config = {
            provider: envContent.match(/LLM_PROVIDER=(.*)/)?.[1] || 'claude',
            claudeApiKey: envContent.match(/CLAUDE_API_KEY=(.*)/)?.[1]?.replace('your_claude_api_key_here', '') || '',
            openaiApiKey: envContent.match(/OPENAI_API_KEY=(.*)/)?.[1]?.replace('your_openai_api_key_here', '') || '',
            ollamaBaseUrl: envContent.match(/OLLAMA_BASE_URL=(.*)/)?.[1] || 'http://localhost:11434',
            ollamaModel: envContent.match(/OLLAMA_MODEL=(.*)/)?.[1] || 'llama3.1'
        };

        // Don't send full API keys, just indicate if they're set
        config.claudeApiKey = config.claudeApiKey && config.claudeApiKey !== 'sk-ant-api03-your_claude_api_key_here' ? '••••••••' : '';
        config.openaiApiKey = config.openaiApiKey && config.openaiApiKey !== 'your_openai_api_key_here' ? '••••••••' : '';

        res.json(config);
    } catch (error) {
        console.error('Failed to read LLM config:', error);
        res.status(500).json({ error: 'Failed to read configuration' });
    }
});

// Update LLM configuration
router.put('/llm', authenticateToken, async (req, res) => {
    try {
        const { provider, claudeApiKey, openaiApiKey, ollamaBaseUrl, ollamaModel } = req.body;

        if (!['claude', 'openai', 'ollama'].includes(provider)) {
            return res.status(400).json({ error: 'Invalid LLM provider' });
        }

        let envContent = fs.readFileSync(envPath, 'utf8');

        // Update provider
        envContent = envContent.replace(/LLM_PROVIDER=.*/g, `LLM_PROVIDER=${provider}`);

        // Update API keys only if provided (not masked)
        if (claudeApiKey && claudeApiKey !== '••••••••') {
            if (!claudeApiKey.startsWith('sk-ant-api03-')) {
                return res.status(400).json({ error: 'Invalid Claude API key format' });
            }
            envContent = envContent.replace(/CLAUDE_API_KEY=.*/g, `CLAUDE_API_KEY=${claudeApiKey}`);
        }

        if (openaiApiKey && openaiApiKey !== '••••••••') {
            if (!openaiApiKey.startsWith('sk-')) {
                return res.status(400).json({ error: 'Invalid OpenAI API key format' });
            }
            envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${openaiApiKey}`);
        }

        // Update Ollama settings
        if (ollamaBaseUrl) {
            envContent = envContent.replace(/OLLAMA_BASE_URL=.*/g, `OLLAMA_BASE_URL=${ollamaBaseUrl}`);
        }
        if (ollamaModel) {
            envContent = envContent.replace(/OLLAMA_MODEL=.*/g, `OLLAMA_MODEL=${ollamaModel}`);
        }

        fs.writeFileSync(envPath, envContent);

        console.log(`🔧 LLM configuration updated: ${provider}`);
        
        // Refresh LLM service configuration
        llmService.refreshConfig();
        
        res.json({ message: 'Configuration updated successfully. LLM service refreshed.' });
    } catch (error) {
        console.error('Failed to update LLM config:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

// Get LLM provider info
router.get('/llm/info', authenticateToken, async (req, res) => {
    try {
        const info = llmService.getProviderInfo();
        res.json(info);
    } catch (error) {
        console.error('Failed to get LLM info:', error);
        res.status(500).json({ error: 'Failed to get LLM information' });
    }
});

// Test LLM connection
router.post('/llm/test', authenticateToken, async (req, res) => {
    try {
        const { provider } = req.body;
        const axios = require('axios');

        switch (provider) {
            case 'claude':
                try {
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const apiKey = envContent.match(/CLAUDE_API_KEY=(.*)/)?.[1];
                    
                    if (!apiKey || apiKey === 'your_claude_api_key_here') {
                        return res.status(400).json({ error: 'Claude API key not configured' });
                    }

                    // Test Claude API
                    await axios.post('https://api.anthropic.com/v1/messages', {
                        model: 'claude-3-sonnet-20240229',
                        max_tokens: 10,
                        messages: [{ role: 'user', content: 'Hello' }]
                    }, {
                        headers: {
                            'x-api-key': apiKey,
                            'anthropic-version': '2023-06-01',
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    });

                    res.json({ message: 'Claude connection successful!' });
                } catch (error) {
                    if (error.response?.status === 401) {
                        res.status(400).json({ error: 'Invalid Claude API key' });
                    } else {
                        res.status(400).json({ error: 'Claude connection failed' });
                    }
                }
                break;

            case 'openai':
                try {
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const apiKey = envContent.match(/OPENAI_API_KEY=(.*)/)?.[1];
                    
                    if (!apiKey || apiKey === 'your_openai_api_key_here') {
                        return res.status(400).json({ error: 'OpenAI API key not configured' });
                    }

                    // Test OpenAI API
                    await axios.post('https://api.openai.com/v1/chat/completions', {
                        model: 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: 'Hello' }],
                        max_tokens: 10
                    }, {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    });

                    res.json({ message: 'OpenAI connection successful!' });
                } catch (error) {
                    if (error.response?.status === 401) {
                        res.status(400).json({ error: 'Invalid OpenAI API key' });
                    } else {
                        res.status(400).json({ error: 'OpenAI connection failed' });
                    }
                }
                break;

            case 'ollama':
                try {
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const baseUrl = envContent.match(/OLLAMA_BASE_URL=(.*)/)?.[1] || 'http://localhost:11434';
                    
                    // Test Ollama API
                    await axios.get(`${baseUrl}/api/version`, { timeout: 5000 });
                    res.json({ message: 'Ollama connection successful!' });
                } catch (error) {
                    res.status(400).json({ error: 'Ollama connection failed. Make sure Ollama is running.' });
                }
                break;

            default:
                res.status(400).json({ error: 'Invalid provider for testing' });
        }
    } catch (error) {
        console.error('LLM test failed:', error);
        res.status(500).json({ error: 'Test failed' });
    }
});

module.exports = router;