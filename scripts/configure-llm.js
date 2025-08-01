#!/usr/bin/env node

// LLM Configuration Script
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const envPath = path.join(__dirname, '../backend/.env');

function updateEnvFile(provider, apiKey) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update LLM provider
    envContent = envContent.replace(/LLM_PROVIDER=.*/g, `LLM_PROVIDER=${provider}`);
    
    // Update API key based on provider
    if (provider === 'claude') {
        envContent = envContent.replace(/CLAUDE_API_KEY=.*/g, `CLAUDE_API_KEY=${apiKey}`);
    } else if (provider === 'openai') {
        envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${apiKey}`);
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Configuration updated! LLM Provider: ${provider}`);
}

function promptConfiguration() {
    console.log('\n🤖 LLM Configuration Setup');
    console.log('==========================');
    console.log('Choose your LLM provider:');
    console.log('1. Claude (Anthropic) - Fast, reliable');
    console.log('2. OpenAI (GPT) - Popular, good performance');
    console.log('3. Ollama (Local) - No API key needed, slower');
    console.log('');

    rl.question('Enter your choice (1-3): ', (choice) => {
        switch (choice) {
            case '1':
                console.log('\n📋 Claude Configuration');
                console.log('To get a Claude API key:');
                console.log('1. Go to https://console.anthropic.com/');
                console.log('2. Sign up/login');
                console.log('3. Create a new API key');
                console.log('4. Copy the key (starts with sk-ant-api03-)');
                console.log('');
                
                rl.question('Enter your Claude API key: ', (apiKey) => {
                    if (apiKey && apiKey.startsWith('sk-ant-api03-')) {
                        updateEnvFile('claude', apiKey);
                        console.log('🔄 Restart the backend to apply changes: npm start');
                        rl.close();
                    } else {
                        console.log('❌ Invalid Claude API key format. Must start with sk-ant-api03-');
                        rl.close();
                    }
                });
                break;
                
            case '2':
                console.log('\n📋 OpenAI Configuration');
                console.log('To get an OpenAI API key:');
                console.log('1. Go to https://platform.openai.com/api-keys');
                console.log('2. Sign up/login');
                console.log('3. Create a new API key');
                console.log('4. Copy the key (starts with sk-)');
                console.log('');
                
                rl.question('Enter your OpenAI API key: ', (apiKey) => {
                    if (apiKey && apiKey.startsWith('sk-')) {
                        updateEnvFile('openai', apiKey);
                        console.log('🔄 Restart the backend to apply changes: npm start');
                        rl.close();
                    } else {
                        console.log('❌ Invalid OpenAI API key format. Must start with sk-');
                        rl.close();
                    }
                });
                break;
                
            case '3':
                console.log('\n📋 Ollama Configuration');
                console.log('Using local Ollama (no API key needed)');
                console.log('Make sure Ollama is installed and running:');
                console.log('1. Install: https://ollama.ai/');
                console.log('2. Run: ollama pull llama3.1');
                console.log('3. Start: ollama serve');
                updateEnvFile('ollama', '');
                console.log('🔄 Restart the backend to apply changes: npm start');
                rl.close();
                break;
                
            default:
                console.log('❌ Invalid choice. Please run the script again.');
                rl.close();
        }
    });
}

// Show current configuration
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const currentProvider = envContent.match(/LLM_PROVIDER=(.*)/)?.[1] || 'not set';
    console.log(`\n📊 Current LLM Provider: ${currentProvider}`);
    
    if (currentProvider === 'claude') {
        const hasKey = envContent.includes('CLAUDE_API_KEY=sk-ant-api03-') && 
                      !envContent.includes('CLAUDE_API_KEY=sk-ant-api03-your_claude_api_key_here');
        console.log(`Claude API Key: ${hasKey ? '✅ Configured' : '❌ Not configured'}`);
    } else if (currentProvider === 'openai') {
        const hasKey = envContent.includes('OPENAI_API_KEY=sk-') && 
                      !envContent.includes('OPENAI_API_KEY=your_openai_api_key_here');
        console.log(`OpenAI API Key: ${hasKey ? '✅ Configured' : '❌ Not configured'}`);
    }
} catch (error) {
    console.log('❌ Could not read configuration file');
}

promptConfiguration();