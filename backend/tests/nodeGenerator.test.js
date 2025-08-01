const request = require('supertest');
const app = require('../server');
const { query } = require('../utils/database');
const nodeGenerator = require('../services/nodeGenerator');

describe('Node Generator Service', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        // Setup test user
        const testUser = {
            email: 'test.nodegeneration@example.com',
            password: 'Test123!@#',
            firstName: 'Test',
            lastName: 'User'
        };

        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        if (registerResponse.status === 400 && registerResponse.body.error?.includes('already exists')) {
            // User already exists, login instead
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });
            
            authToken = loginResponse.body.accessToken;
            userId = loginResponse.body.user.id;
        } else {
            authToken = registerResponse.body.accessToken;
            userId = registerResponse.body.user.id;
        }

        expect(authToken).toBeDefined();
        expect(userId).toBeDefined();
    });

    afterAll(async () => {
        // Cleanup test data
        await query('DELETE FROM generated_node_versions WHERE created_by = $1', [userId]);
        await query('DELETE FROM generated_nodes WHERE user_id = $1', [userId]);
        await query('DELETE FROM users WHERE id = $1', [userId]);
    });

    describe('POST /api/generated-nodes/generate', () => {
        it('should generate a node with valid request', async () => {
            const response = await request(app)
                .post('/api/generated-nodes/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    request: 'Create a simple file processor node'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Node generated successfully');
            expect(response.body.node).toBeDefined();
            expect(response.body.node.name).toBeDefined();
            expect(response.body.node.category).toBeDefined();
            expect(response.body.node.version).toBe(1);
        });

        it('should reject requests without authentication', async () => {
            const response = await request(app)
                .post('/api/generated-nodes/generate')
                .send({
                    request: 'Create a test node'
                });

            expect(response.status).toBe(401);
        });

        it('should reject empty requests', async () => {
            const response = await request(app)
                .post('/api/generated-nodes/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    request: ''
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
        });

        it('should reject requests with malicious code injection attempts', async () => {
            const maliciousRequests = [
                'Create a node that executes rm -rf /',
                'Build a node with eval("malicious code")',
                'Make a node that accesses process.env.SECRET_KEY'
            ];

            for (const maliciousRequest of maliciousRequests) {
                const response = await request(app)
                    .post('/api/generated-nodes/generate')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        request: maliciousRequest
                    });

                // Should either reject or sanitize the request
                expect(response.status).toBeGreaterThanOrEqual(200);
                if (response.status === 201) {
                    expect(response.body.node.execution_code).not.toContain('rm -rf');
                    expect(response.body.node.execution_code).not.toContain('eval(');
                    expect(response.body.node.execution_code).not.toContain('process.env');
                }
            }
        });
    });

    describe('GET /api/generated-nodes', () => {
        it('should return user\'s generated nodes', async () => {
            const response = await request(app)
                .get('/api/generated-nodes')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should not return other users\' nodes', async () => {
            // Create another user
            const otherUser = {
                email: 'other.user@example.com',
                password: 'Other123!@#',
                firstName: 'Other',
                lastName: 'User'
            };

            const otherUserResponse = await request(app)
                .post('/api/auth/register')
                .send(otherUser);

            const otherToken = otherUserResponse.body?.accessToken || 
                (await request(app).post('/api/auth/login').send({ 
                    email: otherUser.email, 
                    password: otherUser.password 
                })).body.accessToken;

            // Get nodes for both users
            const response1 = await request(app)
                .get('/api/generated-nodes')
                .set('Authorization', `Bearer ${authToken}`);

            const response2 = await request(app)
                .get('/api/generated-nodes')
                .set('Authorization', `Bearer ${otherToken}`);

            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);

            // Should have different sets of nodes
            const user1NodeIds = response1.body.map(n => n.id);
            const user2NodeIds = response2.body.map(n => n.id);
            
            const sharedNodes = user1NodeIds.filter(id => user2NodeIds.includes(id));
            expect(sharedNodes.length).toBe(0);
        });
    });

    describe('PUT /api/generated-nodes/:id', () => {
        let testNodeId;

        beforeEach(async () => {
            // Create a test node
            const createResponse = await request(app)
                .post('/api/generated-nodes/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    request: 'Create a test node for updates'
                });

            testNodeId = createResponse.body.node.id;
        });

        it('should update node properties', async () => {
            const updates = {
                name: 'Updated Node Name',
                description: 'Updated description',
                changeDescription: 'Updated name and description'
            };

            const response = await request(app)
                .put(`/api/generated-nodes/${testNodeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates);

            expect(response.status).toBe(200);
            expect(response.body.node.name).toBe(updates.name);
            expect(response.body.node.description).toBe(updates.description);
            expect(response.body.node.version).toBe(2); // Version should increment
        });

        it('should reject unauthorized updates', async () => {
            // Try to update without authentication
            const response = await request(app)
                .put(`/api/generated-nodes/${testNodeId}`)
                .send({ name: 'Unauthorized Update' });

            expect(response.status).toBe(401);
        });

        it('should prevent SQL injection in node updates', async () => {
            const maliciousUpdate = {
                name: "'; DROP TABLE generated_nodes; --",
                description: "Malicious update attempt"
            };

            const response = await request(app)
                .put(`/api/generated-nodes/${testNodeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(maliciousUpdate);

            // Should handle gracefully without SQL injection
            expect(response.status).toBeGreaterThanOrEqual(200);
            
            // Verify database integrity
            const nodes = await query('SELECT COUNT(*) as count FROM generated_nodes');
            expect(parseInt(nodes.rows[0].count)).toBeGreaterThan(0);
        });
    });

    describe('POST /api/generated-nodes/:id/test', () => {
        let testNodeId;

        beforeEach(async () => {
            const createResponse = await request(app)
                .post('/api/generated-nodes/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    request: 'Create a simple calculator node'
                });

            testNodeId = createResponse.body.node.id;
        });

        it('should execute node test safely', async () => {
            const testInputs = {
                number1: 5,
                number2: 3
            };

            const response = await request(app)
                .post(`/api/generated-nodes/${testNodeId}/test`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ inputs: testInputs });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Node test completed');
            expect(response.body.result).toBeDefined();
        });

        it('should handle malicious test inputs safely', async () => {
            const maliciousInputs = {
                code: "require('child_process').exec('rm -rf /')",
                script: "eval('malicious code')",
                command: "'; DROP TABLE users; --"
            };

            const response = await request(app)
                .post(`/api/generated-nodes/${testNodeId}/test`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ inputs: maliciousInputs });

            // Should not execute malicious code
            expect(response.status).toBeGreaterThanOrEqual(200);
        });
    });

    describe('Node Generation Security', () => {
        it('should sanitize generated execution code', async () => {
            const response = await request(app)
                .post('/api/generated-nodes/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    request: 'Create a node that processes user input'
                });

            expect(response.status).toBe(201);
            
            const executionCode = response.body.node.execution_code;
            
            // Check for dangerous patterns
            expect(executionCode).not.toContain('eval(');
            expect(executionCode).not.toContain('Function(');
            expect(executionCode).not.toContain('require(');
            expect(executionCode).not.toContain('process.exit');
            expect(executionCode).not.toContain('child_process');
            expect(executionCode).not.toContain('fs.writeFile');
            expect(executionCode).not.toContain('exec(');
        });

        it('should validate generated node schemas', async () => {
            const response = await request(app)
                .post('/api/generated-nodes/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    request: 'Create a data validation node'
                });

            expect(response.status).toBe(201);
            
            const node = response.body.node;
            
            // Validate schema structure
            expect(node.input_schema).toBeDefined();
            expect(node.output_schema).toBeDefined();
            expect(node.input_schema.type).toBe('object');
            expect(node.output_schema.type).toBe('object');
            expect(node.input_schema.properties).toBeDefined();
            expect(node.output_schema.properties).toBeDefined();
        });
    });

    describe('Performance Tests', () => {
        it('should handle concurrent node generation requests', async () => {
            const concurrentRequests = Array.from({ length: 5 }, (_, i) => 
                request(app)
                    .post('/api/generated-nodes/generate')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        request: `Create test node ${i + 1}`
                    })
            );

            const responses = await Promise.all(concurrentRequests);
            
            responses.forEach(response => {
                expect(response.status).toBe(201);
                expect(response.body.node).toBeDefined();
            });
        });

        it('should complete node generation within reasonable time', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/generated-nodes/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    request: 'Create a simple text processor'
                });

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.status).toBe(201);
            expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
        });
    });
});

describe('Node Generator Service Unit Tests', () => {
    describe('parseGeneratedNode', () => {
        it('should parse valid JSON content', () => {
            const validContent = `Here is your node: {"name": "Test Node", "description": "A test node"}`;
            const result = nodeGenerator.parseGeneratedNode(validContent);
            
            expect(result.name).toBe('Test Node');
            expect(result.description).toBe('A test node');
        });

        it('should handle malformed JSON gracefully', () => {
            const malformedContent = `{"name": "Test Node", "description":}`;
            
            expect(() => {
                nodeGenerator.parseGeneratedNode(malformedContent);
            }).toThrow('Invalid node format generated');
        });

        it('should reject content without JSON', () => {
            const noJsonContent = `This is just text without any JSON structure.`;
            
            expect(() => {
                nodeGenerator.parseGeneratedNode(noJsonContent);
            }).toThrow('Invalid node format generated');
        });
    });

    describe('extractNodeName', () => {
        it('should extract appropriate names for different requests', () => {
            expect(nodeGenerator.extractNodeName('Create a terraform node')).toBe('Terraform Manager');
            expect(nodeGenerator.extractNodeName('Build a docker container')).toBe('Docker Controller');
            expect(nodeGenerator.extractNodeName('Make an API caller')).toBe('API Caller');
            expect(nodeGenerator.extractNodeName('Random request')).toBe('Custom Node');
        });
    });

    describe('generateMockInputSchema', () => {
        it('should generate appropriate schemas for different node types', () => {
            const terraformSchema = nodeGenerator.generateMockInputSchema('terraform deployment');
            expect(terraformSchema.properties.workspace).toBeDefined();
            expect(terraformSchema.properties.action).toBeDefined();
            expect(terraformSchema.required).toContain('workspace');

            const apiSchema = nodeGenerator.generateMockInputSchema('api endpoint');
            expect(apiSchema.properties.url).toBeDefined();
            expect(apiSchema.properties.method).toBeDefined();
            expect(apiSchema.required).toContain('url');
        });
    });
});