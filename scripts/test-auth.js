#!/usr/bin/env node

// Simple script to test authentication and node generation
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testAuth() {
    console.log('🔐 Testing Authentication...');
    
    try {
        // Try to register a test user
        const testUser = {
            email: 'test@example.com',
            password: 'Test123!@#',
            firstName: 'Test',
            lastName: 'User'
        };

        let authToken;
        
        try {
            const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
            authToken = registerResponse.data.accessToken;
            console.log('✅ Registered new test user');
        } catch (error) {
            if (error.response?.status === 400 && error.response.data.error?.includes('already exists')) {
                // User exists, try to login
                const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                    email: testUser.email,
                    password: testUser.password
                });
                authToken = loginResponse.data.accessToken;
                console.log('✅ Logged in existing test user');
            } else {
                throw error;
            }
        }

        console.log('🎫 Auth token:', authToken?.substring(0, 20) + '...');
        
        // Test node generation
        console.log('\n🤖 Testing Node Generation...');
        
        const generateResponse = await axios.post(
            `${API_BASE_URL}/generated-nodes/generate`,
            {
                request: 'Create a simple file processor node',
                context: {}
            },
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Node generation successful!');
        console.log('📦 Generated node:', generateResponse.data.node.name);
        
        // Test fetching nodes
        console.log('\n📋 Testing Fetch Generated Nodes...');
        
        const fetchResponse = await axios.get(`${API_BASE_URL}/generated-nodes`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('✅ Fetch successful!');
        console.log('📊 Total nodes:', fetchResponse.data.length);
        
        return { authToken, nodeCount: fetchResponse.data.length };
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 429) {
            console.log('⏰ Rate limited - try again in a few minutes');
        }
        throw error;
    }
}

// Run the test
testAuth()
    .then(result => {
        console.log('\n🎉 All tests passed!');
        console.log('Token available:', !!result.authToken);
        console.log('Node count:', result.nodeCount);
        process.exit(0);
    })
    .catch(error => {
        console.log('\n💥 Tests failed');
        process.exit(1);
    });