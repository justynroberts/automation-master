const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const llmService = require('../services/llmService');
const router = express.Router();

// Generate code based on user request
router.post('/generate-code', authenticateToken, async (req, res) => {
    try {
        const { prompt, language = 'javascript', context = {} } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log(`🤖 User ${req.user.userId} requested code generation: "${prompt.substring(0, 50)}..."`);

        const fullPrompt = `Generate ${language} code for the following request: ${prompt}
        
Context: ${JSON.stringify(context)}

Requirements:
- Write clean, efficient, and well-documented code
- Include helpful comments
- Follow best practices for ${language}
- Ensure code is production-ready`;

        const code = await llmService.generateCode(fullPrompt, language, {
            temperature: 0.3,
            maxTokens: 1500
        });

        res.json({
            success: true,
            code: code.trim(),
            language,
            provider: llmService.getProviderInfo()
        });

    } catch (error) {
        console.error('Code generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate code',
            message: error.message 
        });
    }
});

// Explain existing code
router.post('/explain-code', authenticateToken, async (req, res) => {
    try {
        const { code, language = 'javascript' } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({ error: 'Code is required' });
        }

        console.log(`🤖 User ${req.user.userId} requested code explanation for ${language}`);

        const explanation = await llmService.explainCode(code, {
            temperature: 0.2,
            maxTokens: 1000
        });

        res.json({
            success: true,
            explanation: explanation.trim(),
            language,
            provider: llmService.getProviderInfo()
        });

    } catch (error) {
        console.error('Code explanation error:', error);
        res.status(500).json({ 
            error: 'Failed to explain code',
            message: error.message 
        });
    }
});

// Debug/fix code
router.post('/debug-code', authenticateToken, async (req, res) => {
    try {
        const { code, error: codeError, language = 'javascript' } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({ error: 'Code is required' });
        }

        console.log(`🤖 User ${req.user.userId} requested code debugging for ${language}`);

        const prompt = `Debug and fix this ${language} code:

Code:
${code}

${codeError ? `Error: ${codeError}` : ''}

Please:
1. Identify any issues or bugs
2. Provide the corrected code
3. Explain what was wrong and how you fixed it`;

        const response = await llmService.generateCompletion(prompt, {
            systemPrompt: `You are an expert ${language} debugger. Analyze code for bugs, performance issues, and best practices violations. Provide clear explanations and corrected code.`,
            temperature: 0.2,
            maxTokens: 1500
        });

        res.json({
            success: true,
            response: response.trim(),
            language,
            provider: llmService.getProviderInfo()
        });

    } catch (error) {
        console.error('Code debugging error:', error);
        res.status(500).json({ 
            error: 'Failed to debug code',
            message: error.message 
        });
    }
});

// General AI assistance
router.post('/ask', authenticateToken, async (req, res) => {
    try {
        const { question, context = {} } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Question is required' });
        }

        console.log(`🤖 User ${req.user.userId} asked: "${question.substring(0, 50)}..."`);

        const prompt = `${question}

Context: ${JSON.stringify(context)}`;

        const answer = await llmService.generateCompletion(prompt, {
            systemPrompt: 'You are a helpful AI assistant for a workflow automation platform. Provide clear, accurate, and helpful responses. Focus on practical solutions and best practices.',
            temperature: 0.4,
            maxTokens: 1000
        });

        res.json({
            success: true,
            answer: answer.trim(),
            provider: llmService.getProviderInfo()
        });

    } catch (error) {
        console.error('AI assistance error:', error);
        res.status(500).json({ 
            error: 'Failed to get AI assistance',
            message: error.message 
        });
    }
});

// Get provider status
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const info = llmService.getProviderInfo();
        res.json({
            ...info,
            ready: llmService.isConfigured(),
            endpoints: {
                generateCode: '/api/ai-assistant/generate-code',
                explainCode: '/api/ai-assistant/explain-code',
                debugCode: '/api/ai-assistant/debug-code',
                ask: '/api/ai-assistant/ask'
            }
        });
    } catch (error) {
        console.error('AI status error:', error);
        res.status(500).json({ error: 'Failed to get AI status' });
    }
});

module.exports = router;