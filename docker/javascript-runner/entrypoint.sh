#!/bin/bash

# Entrypoint script for JavaScript runner container
# This script sets up the environment and executes the user's JavaScript script

set -e

# Check if script file exists
if [ ! -f "/workspace/script.js" ]; then
    echo "Error: No script file found at /workspace/script.js" >&2
    exit 1
fi

# Set up environment
echo "Starting JavaScript script execution..."
echo "Node.js version: $(node --version)"
echo "Environment variables available:"
env | grep -E '^[A-Z_][A-Z0-9_]*=' | sort

echo "----------------------------------------"
echo "Script output:"

# Execute the script with timeout protection
timeout 300 node /workspace/script.js

exit_code=$?

echo "----------------------------------------"
echo "Script completed with exit code: $exit_code"

exit $exit_code