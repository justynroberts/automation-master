#!/bin/bash

# Test script for generated nodes functionality
echo "🧪 Testing Generated Nodes Functionality"
echo "========================================"

# Frontend URL
FRONTEND_URL="http://localhost:5002"
BACKEND_URL="http://localhost:5001"

echo "1. Testing frontend accessibility..."
if curl -s "${FRONTEND_URL}" > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    exit 1
fi

echo ""
echo "2. Testing backend health..."
if curl -s "${BACKEND_URL}/api/health" > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not healthy"
    exit 1
fi

echo ""
echo "3. Testing Node Generator page..."
echo "📱 Opening Node Generator in browser..."

# Open the Node Generator page
if command -v open >/dev/null 2>&1; then
    open "${FRONTEND_URL}/node-generator"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${FRONTEND_URL}/node-generator"
fi

echo ""
echo "4. Testing Workflow Manager page..."
echo "📱 Opening Workflow Manager in browser..."

# Open the Workflow Manager page  
if command -v open >/dev/null 2>&1; then
    open "${FRONTEND_URL}/workflow-manager"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${FRONTEND_URL}/workflow-manager"
fi

echo ""
echo "🎯 Manual Testing Instructions:"
echo "================================"
echo ""
echo "Node Generator (${FRONTEND_URL}/node-generator):"
echo "1. Try creating a simple node (e.g., 'Create a file processor node')"
echo "2. Check if the node appears in the generated nodes list"
echo "3. Try editing/duplicating/deleting nodes"
echo ""
echo "Workflow Manager (${FRONTEND_URL}/workflow-manager):"
echo "1. Create a new workflow"
echo "2. Check if generated nodes appear in the node palette"
echo "3. Try adding a generated node to the workflow"
echo "4. Test workflow editing (name, tags, ROI)"
echo "5. Try saving and updating workflows"
echo ""
echo "✅ Test script completed"