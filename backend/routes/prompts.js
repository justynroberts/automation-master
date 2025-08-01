const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const promptsPath = path.join(__dirname, '../config/prompts.json');

// Default super prompts
const defaultPrompts = {
    nodeGeneration: {
        system: `You are an expert workflow node generator. Create complete, functional workflow nodes.

!!!CRITICAL RULES!!!:
1. Return ONLY valid JSON - NO explanations, comments, or text outside JSON
2. Do NOT include markdown code blocks (no \`\`\`json or \`\`\`)
3. Do NOT add any text before or after the JSON object
4. Use double quotes for all JSON strings
5. Ensure all JSON properties are properly closed with commas
6. The executionCode must be a properly escaped JSON string

JSON STRUCTURE REQUIRED:
{
  "name": "Node Name",
  "description": "What this node does",
  "category": "Infrastructure",
  "icon": "server",
  "nodeDefinition": {
    "type": "custom",
    "resizable": true,
    "draggable": true
  },
  "uiConfig": {
    "formFields": [
      {
        "name": "field1",
        "type": "text",
        "label": "Field Label",
        "required": true,
        "placeholder": "Enter value"
      }
    ]
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "field1": {
        "type": "string",
        "description": "Field description"
      }
    },
    "required": ["field1"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": {"type": "object", "description": "Operation result"},
      "status": {"type": "string", "description": "Status"}
    }
  },
  "executionCode": "const executeNode = async (inputs, context) => {\\n  try {\\n    // Implementation here\\n    return { result: inputs, status: 'success' };\\n  } catch (error) {\\n    throw new Error(\`Execution failed: \${error.message}\`);\\n  }\\n};"
}

VALIDATION RULES:
- All strings must use double quotes
- No trailing commas
- executionCode must be properly escaped
- No JavaScript comments in JSON
- Start response immediately with {`,
        
        user: `Generate node for: "{request}"

Requirements:
- Production-ready with error handling
- User-friendly interface
- Comprehensive validation
- Return ONLY the JSON object (no explanations)`
    },
    
    codeGeneration: {
        system: `You are an expert software engineer specializing in {language} development. Generate clean, efficient, and well-documented code following best practices.

GUIDELINES:
1. Write production-ready code with proper error handling
2. Include helpful comments explaining complex logic
3. Follow language-specific best practices and conventions
4. Ensure code is secure and follows security guidelines
5. Make code maintainable and readable
6. Include input validation where appropriate
7. Handle edge cases gracefully
8. Use appropriate libraries and frameworks
9. Write efficient and optimized code
10. Ensure code is testable

STYLE:
- Use descriptive variable and function names
- Follow consistent code formatting
- Add docstrings/JSDoc for functions
- Include type hints where applicable
- Group related functionality logically
- Keep functions focused and single-purpose`,

        user: `Generate {language} code for the following request:

{request}

Context: {context}

Requirements:
- Write clean, efficient, and well-documented code
- Include helpful comments
- Follow best practices for {language}
- Ensure code is production-ready
- Handle errors gracefully
- Include input validation
- Make it maintainable and readable

Return only the code without markdown formatting.`
    }
};

// Initialize prompts file if it doesn't exist
function initializePrompts() {
    if (!fs.existsSync(promptsPath)) {
        const dir = path.dirname(promptsPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(promptsPath, JSON.stringify(defaultPrompts, null, 2));
    }
}

// Get all prompts
router.get('/', authenticateToken, async (req, res) => {
    try {
        initializePrompts();
        const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
        res.json(prompts);
    } catch (error) {
        console.error('Failed to read prompts:', error);
        res.status(500).json({ error: 'Failed to read prompts' });
    }
});

// Update prompts
router.put('/', authenticateToken, async (req, res) => {
    try {
        const { nodeGeneration, codeGeneration } = req.body;
        
        if (!nodeGeneration || !codeGeneration) {
            return res.status(400).json({ error: 'Both nodeGeneration and codeGeneration prompts are required' });
        }

        const prompts = {
            nodeGeneration: {
                system: nodeGeneration.system || defaultPrompts.nodeGeneration.system,
                user: nodeGeneration.user || defaultPrompts.nodeGeneration.user
            },
            codeGeneration: {
                system: codeGeneration.system || defaultPrompts.codeGeneration.system,
                user: codeGeneration.user || defaultPrompts.codeGeneration.user
            }
        };

        fs.writeFileSync(promptsPath, JSON.stringify(prompts, null, 2));
        
        console.log('🎯 Super prompts updated successfully');
        res.json({ message: 'Prompts updated successfully', prompts });
    } catch (error) {
        console.error('Failed to update prompts:', error);
        res.status(500).json({ error: 'Failed to update prompts' });
    }
});

// Reset to defaults
router.post('/reset', authenticateToken, async (req, res) => {
    try {
        fs.writeFileSync(promptsPath, JSON.stringify(defaultPrompts, null, 2));
        console.log('🔄 Super prompts reset to defaults');
        res.json({ message: 'Prompts reset to defaults', prompts: defaultPrompts });
    } catch (error) {
        console.error('Failed to reset prompts:', error);
        res.status(500).json({ error: 'Failed to reset prompts' });
    }
});

// Get prompt templates/examples
router.get('/templates', authenticateToken, async (req, res) => {
    const templates = {
        nodeGeneration: {
            creative: {
                name: "Creative Node Generator",
                system: defaultPrompts.nodeGeneration.system.replace(
                    'REQUIREMENTS:',
                    'CREATIVE MODE: Be innovative and think outside the box.\n\nREQUIREMENTS:'
                )
            },
            enterprise: {
                name: "Enterprise Node Generator", 
                system: defaultPrompts.nodeGeneration.system.replace(
                    'REQUIREMENTS:',
                    'ENTERPRISE MODE: Focus on scalability, security, and compliance.\n\nREQUIREMENTS:'
                )
            },
            simple: {
                name: "Simple Node Generator",
                system: defaultPrompts.nodeGeneration.system.replace(
                    'Generate nodes that follow established patterns',
                    'Generate simple, easy-to-understand nodes with minimal complexity'
                )
            }
        },
        codeGeneration: {
            performance: {
                name: "Performance-Focused",
                system: defaultPrompts.codeGeneration.system + "\n\nPRIORITY: Optimize for maximum performance and efficiency."
            },
            security: {
                name: "Security-First",
                system: defaultPrompts.codeGeneration.system + "\n\nPRIORITY: Implement comprehensive security measures and input validation."
            },
            readability: {
                name: "Readability-First",
                system: defaultPrompts.codeGeneration.system + "\n\nPRIORITY: Write extremely clear and well-documented code for easy maintenance."
            }
        }
    };
    
    res.json(templates);
});

module.exports = router;