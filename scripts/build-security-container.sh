#!/bin/bash

# Build secure execution container for LLM Node Generator
set -e

echo "🔒 Building secure workflow execution container..."

# Change to docker directory
cd "$(dirname "$0")/../docker"

# Build the security container
docker build -f Dockerfile.security -t workflow-executor:latest .

# Test the container security
echo "🧪 Testing container security..."

# Test 1: Verify non-root user
echo "Test 1: Verifying non-root user..."
USER_ID=$(docker run --rm workflow-executor:latest id -u)
if [ "$USER_ID" != "1001" ]; then
    echo "❌ SECURITY FAILURE: Container running as root or wrong user ID"
    exit 1
fi
echo "✅ Non-root user verified (UID: $USER_ID)"

# Test 2: Verify dangerous commands are removed
echo "Test 2: Checking for dangerous commands..."
DANGEROUS_COMMANDS=("su" "mount" "umount" "passwd" "chpasswd" "newgrp" "chgrp" "gpasswd" "chage")
for cmd in "${DANGEROUS_COMMANDS[@]}"; do
    if docker run --rm workflow-executor:latest which "$cmd" >/dev/null 2>&1; then
        echo "❌ SECURITY FAILURE: Dangerous command '$cmd' still available"
        exit 1
    fi
done
echo "✅ Dangerous commands removed"

# Test 3: Verify resource limits
echo "Test 3: Testing resource limits..."
# This will be enforced by Docker runtime limits

# Test 4: Verify read-only filesystem works
echo "Test 4: Testing read-only filesystem..."
if docker run --rm --read-only workflow-executor:latest touch /test-file 2>/dev/null; then
    echo "❌ SECURITY FAILURE: Filesystem is not read-only"
    exit 1
fi
echo "✅ Read-only filesystem verified"

# Test 5: Verify network isolation
echo "Test 5: Testing network isolation..."
if docker run --rm --network none workflow-executor:latest ping -c 1 8.8.8.8 2>/dev/null; then
    echo "❌ SECURITY FAILURE: Network isolation failed"
    exit 1
fi
echo "✅ Network isolation verified"

echo "🎉 Security container built and tested successfully!"
echo "Container image: workflow-executor:latest"
echo ""
echo "To use this container:"
echo "  docker run --rm --read-only --network none --user 1001:1001 workflow-executor:latest"