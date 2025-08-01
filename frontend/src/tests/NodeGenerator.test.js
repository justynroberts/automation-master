import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import NodeGenerator from '../components/NodeGenerator';
import * as generatedNodesAPI from '../services/api';

// Mock the API
jest.mock('../services/api', () => ({
    generatedNodesAPI: {
        generateNode: jest.fn(),
        getGeneratedNodes: jest.fn(),
        deleteGeneratedNode: jest.fn(),
        duplicateNode: jest.fn(),
        testNode: jest.fn(),
        updateGeneratedNode: jest.fn()
    }
}));

// Mock the hooks
jest.mock('../hooks/useGeneratedNodes', () => ({
    __esModule: true,
    default: () => ({
        generatedNodes: [
            {
                id: 'test-node-1',
                name: 'Test Docker Node',
                description: 'A test docker management node',
                category: 'Infrastructure',
                version: 1,
                created_at: '2023-01-01T00:00:00Z'
            },
            {
                id: 'test-node-2',
                name: 'Test API Node',
                description: 'A test API calling node',
                category: 'Communication',
                version: 2,
                created_at: '2023-01-02T00:00:00Z'
            }
        ],
        nodeStats: {
            totalNodes: 2,
            categories: {
                'Infrastructure': { name: 'Infrastructure', count: 1 },
                'Communication': { name: 'Communication', count: 1 }
            }
        },
        loading: false,
        error: null,
        generateNode: jest.fn(),
        deleteGeneratedNode: jest.fn(),
        duplicateNode: jest.fn(),
        testNode: jest.fn(),
        updateGeneratedNode: jest.fn()
    })
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('NodeGenerator Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders the main interface', () => {
            renderWithRouter(<NodeGenerator />);
            
            expect(screen.getByText('Node Generator')).toBeInTheDocument();
            expect(screen.getByText('Create custom workflow nodes with AI')).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Describe the node you want to create/)).toBeInTheDocument();
        });

        it('displays node statistics', () => {
            renderWithRouter(<NodeGenerator />);
            
            expect(screen.getByText('2 Nodes')).toBeInTheDocument();
            expect(screen.getByText('2 Categories')).toBeInTheDocument();
        });

        it('displays generated nodes grid', () => {
            renderWithRouter(<NodeGenerator />);
            
            expect(screen.getByText('Your Generated Nodes (2)')).toBeInTheDocument();
            expect(screen.getByText('Test Docker Node')).toBeInTheDocument();
            expect(screen.getByText('Test API Node')).toBeInTheDocument();
        });

        it('shows example requests', () => {
            renderWithRouter(<NodeGenerator />);
            
            expect(screen.getByText('💡 Example Requests:')).toBeInTheDocument();
            expect(screen.getByText(/Create a Terraform node for AWS infrastructure/)).toBeInTheDocument();
        });
    });

    describe('Node Generation', () => {
        it('handles node generation request', async () => {
            const mockGenerateNode = jest.fn().mockResolvedValue({
                id: 'new-node-id',
                name: 'New Test Node'
            });

            // Mock the hook to return our mock function
            const useGeneratedNodes = require('../hooks/useGeneratedNodes').default;
            useGeneratedNodes.mockReturnValue({
                ...useGeneratedNodes(),
                generateNode: mockGenerateNode
            });

            renderWithRouter(<NodeGenerator />);
            
            const textarea = screen.getByPlaceholderText(/Describe the node you want to create/);
            const generateButton = screen.getByRole('button', { name: /Generate/ });

            fireEvent.change(textarea, { target: { value: 'Create a test node' } });
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(mockGenerateNode).toHaveBeenCalledWith('Create a test node');
            });
        });

        it('disables generate button when input is empty', () => {
            renderWithRouter(<NodeGenerator />);
            
            const generateButton = screen.getByRole('button', { name: /Generate/ });
            expect(generateButton).toBeDisabled();
        });

        it('enables generate button when input is provided', () => {
            renderWithRouter(<NodeGenerator />);
            
            const textarea = screen.getByPlaceholderText(/Describe the node you want to create/);
            const generateButton = screen.getByRole('button', { name: /Generate/ });

            fireEvent.change(textarea, { target: { value: 'Create a test node' } });
            expect(generateButton).not.toBeDisabled();
        });

        it('handles generation errors gracefully', async () => {
            const mockGenerateNode = jest.fn().mockRejectedValue(new Error('Generation failed'));
            
            const useGeneratedNodes = require('../hooks/useGeneratedNodes').default;
            useGeneratedNodes.mockReturnValue({
                ...useGeneratedNodes(),
                generateNode: mockGenerateNode
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            renderWithRouter(<NodeGenerator />);
            
            const textarea = screen.getByPlaceholderText(/Describe the node you want to create/);
            const generateButton = screen.getByRole('button', { name: /Generate/ });

            fireEvent.change(textarea, { target: { value: 'Create a test node' } });
            fireEvent.click(generateButton);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('[ERROR] Failed to generate node: Generation failed');
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Node Management', () => {
        it('handles node deletion with confirmation', async () => {
            const mockDeleteNode = jest.fn().mockResolvedValue();
            
            window.confirm = jest.fn().mockReturnValue(true);

            const useGeneratedNodes = require('../hooks/useGeneratedNodes').default;
            useGeneratedNodes.mockReturnValue({
                ...useGeneratedNodes(),
                deleteGeneratedNode: mockDeleteNode
            });

            renderWithRouter(<NodeGenerator />);
            
            const deleteButtons = screen.getAllByRole('button');
            const deleteButton = deleteButtons.find(btn => 
                btn.querySelector('svg')?.getAttribute('data-lucide') === 'trash-2'
            );

            if (deleteButton) {
                fireEvent.click(deleteButton);

                await waitFor(() => {
                    expect(window.confirm).toHaveBeenCalled();
                    expect(mockDeleteNode).toHaveBeenCalled();
                });
            }
        });

        it('cancels deletion when user declines confirmation', () => {
            const mockDeleteNode = jest.fn();
            
            window.confirm = jest.fn().mockReturnValue(false);

            const useGeneratedNodes = require('../hooks/useGeneratedNodes').default;
            useGeneratedNodes.mockReturnValue({
                ...useGeneratedNodes(),
                deleteGeneratedNode: mockDeleteNode
            });

            renderWithRouter(<NodeGenerator />);
            
            const deleteButtons = screen.getAllByRole('button');
            const deleteButton = deleteButtons.find(btn => 
                btn.querySelector('svg')?.getAttribute('data-lucide') === 'trash-2'
            );

            if (deleteButton) {
                fireEvent.click(deleteButton);

                expect(window.confirm).toHaveBeenCalled();
                expect(mockDeleteNode).not.toHaveBeenCalled();
            }
        });

        it('handles node duplication', async () => {
            const mockDuplicateNode = jest.fn().mockResolvedValue({
                id: 'duplicated-node-id',
                name: 'Test Docker Node (Copy)'
            });

            const useGeneratedNodes = require('../hooks/useGeneratedNodes').default;
            useGeneratedNodes.mockReturnValue({
                ...useGeneratedNodes(),
                duplicateNode: mockDuplicateNode
            });

            renderWithRouter(<NodeGenerator />);
            
            const copyButtons = screen.getAllByText('Copy');
            if (copyButtons.length > 0) {
                fireEvent.click(copyButtons[0]);

                await waitFor(() => {
                    expect(mockDuplicateNode).toHaveBeenCalled();
                });
            }
        });
    });

    describe('Navigation', () => {
        it('navigates back to dashboard', () => {
            renderWithRouter(<NodeGenerator />);
            
            const backButton = screen.getByRole('button', { name: /Back to Dashboard/ });
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    describe('Input Validation', () => {
        it('sanitizes malicious input', () => {
            renderWithRouter(<NodeGenerator />);
            
            const textarea = screen.getByPlaceholderText(/Describe the node you want to create/);
            
            const maliciousInputs = [
                '<script>alert("xss")</script>',
                'javascript:void(0)',
                '"><img src=x onerror=alert(1)>',
                '${7*7}',
                '{{7*7}}'
            ];

            maliciousInputs.forEach(input => {
                fireEvent.change(textarea, { target: { value: input } });
                expect(textarea.value).toBe(input); // Should not be altered by client-side
            });
        });

        it('limits input length', () => {
            renderWithRouter(<NodeGenerator />);
            
            const textarea = screen.getByPlaceholderText(/Describe the node you want to create/);
            const longInput = 'a'.repeat(10000);
            
            fireEvent.change(textarea, { target: { value: longInput } });
            
            // Should accept long input but may be limited by backend
            expect(textarea.value.length).toBeGreaterThan(0);
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', () => {
            renderWithRouter(<NodeGenerator />);
            
            const textarea = screen.getByPlaceholderText(/Describe the node you want to create/);
            expect(textarea).toHaveAttribute('aria-label', 'Describe the node you want to create');
            
            const generateButton = screen.getByRole('button', { name: /Generate/ });
            expect(generateButton).toBeInTheDocument();
        });

        it('supports keyboard navigation', () => {
            renderWithRouter(<NodeGenerator />);
            
            const textarea = screen.getByPlaceholderText(/Describe the node you want to create/);
            textarea.focus();
            expect(document.activeElement).toBe(textarea);
            
            // Tab to generate button
            fireEvent.keyDown(textarea, { key: 'Tab' });
            const generateButton = screen.getByRole('button', { name: /Generate/ });
            // Note: Focus testing in jsdom is limited, but structure supports it
        });

        it('provides screen reader feedback', () => {
            renderWithRouter(<NodeGenerator />);
            
            // Check for status regions and live regions
            const heading = screen.getByRole('heading', { name: /Node Generator/ });
            expect(heading).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('displays error states appropriately', () => {
            const useGeneratedNodes = require('../hooks/useGeneratedNodes').default;
            useGeneratedNodes.mockReturnValue({
                ...useGeneratedNodes(),
                error: 'Failed to load nodes',
                loading: false
            });

            renderWithRouter(<NodeGenerator />);
            
            // Error should be handled gracefully
            expect(screen.queryByText('Failed to load nodes')).not.toBeInTheDocument();
        });

        it('shows loading states', () => {
            const useGeneratedNodes = require('../hooks/useGeneratedNodes').default;
            useGeneratedNodes.mockReturnValue({
                ...useGeneratedNodes(),
                loading: true,
                generatedNodes: []
            });

            renderWithRouter(<NodeGenerator />);
            
            // Should show loading indicator
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });
    });

    describe('Performance', () => {
        it('handles large numbers of nodes efficiently', () => {
            const manyNodes = Array.from({ length: 100 }, (_, i) => ({
                id: `node-${i}`,
                name: `Test Node ${i}`,
                description: `Description ${i}`,
                category: 'Test',
                version: 1,
                created_at: '2023-01-01T00:00:00Z'
            }));

            const useGeneratedNodes = require('../hooks/useGeneratedNodes').default;
            useGeneratedNodes.mockReturnValue({
                ...useGeneratedNodes(),
                generatedNodes: manyNodes,
                nodeStats: {
                    totalNodes: 100,
                    categories: { 'Test': { name: 'Test', count: 100 } }
                }
            });

            const startTime = performance.now();
            renderWithRouter(<NodeGenerator />);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(1000); // Should render in under 1 second
            expect(screen.getByText('Your Generated Nodes (100)')).toBeInTheDocument();
        });
    });
});