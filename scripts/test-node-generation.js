#!/usr/bin/env node

// Test node generation with valid auth token
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testNodeGeneration() {
    console.log('🤖 Testing Node Generation with Demo User...');
    
    try {
        // Login as demo user (from init.sql)
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'demo@example.com',
            password: 'password123'
        });
        
        const authToken = loginResponse.data.accessToken;
        console.log('✅ Logged in as demo user');
        console.log('🎫 Auth token:', authToken.substring(0, 20) + '...');
        
        // Test node generation
        console.log('\n🚀 Generating test node...');
        
        const generateResponse = await axios.post(
            `${API_BASE_URL}/generated-nodes/generate`,
            {
                request: 'Create a simple file processor node that reads text files',
                context: {}
            },
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout for LLM
            }
        );
        
        console.log('✅ Node generation successful!');
        console.log('📦 Generated node:', generateResponse.data.node.name);
        console.log('📝 Description:', generateResponse.data.node.description);
        console.log('🏷️ Category:', generateResponse.data.node.category);
        
        // Test fetching nodes
        console.log('\n📋 Fetching all generated nodes...');
        
        const fetchResponse = await axios.get(`${API_BASE_URL}/generated-nodes`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('✅ Fetch successful!');
        console.log('📊 Total nodes:', fetchResponse.data.length);
        
        if (fetchResponse.data.length > 0) {
            console.log('\n📋 Available nodes:');
            fetchResponse.data.forEach((node, index) => {
                console.log(`${index + 1}. ${node.name} (${node.category})`);
            });
        }
        
        console.log('\n🎯 To use in frontend:');
        console.log(`1. Open browser console on http://localhost:5002`);
        console.log(`2. Run: localStorage.setItem('accessToken', '${authToken}')`);
        console.log(`3. Refresh the page and try generating nodes`);
        
        return { authToken, nodeCount: fetchResponse.data.length };
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 429) {
            console.log('⏰ Rate limited - wait a few minutes and try again');
        }
        if (error.response?.status === 500) {
            console.log('💻 Server error - check backend logs');
        }
        throw error;
    }
}

// Run the test
testNodeGeneration()
    .then(result => {
        console.log('\n🎉 All tests passed!');
        console.log('Node count:', result.nodeCount);
        process.exit(0);
    })
    .catch(error => {
        console.log('\n💥 Tests failed');
        process.exit(1);
    });