#!/bin/bash

# Entrypoint script for bash runner container
# This script sets up the environment and executes the user's bash script

set -e

# Check if script file exists
if [ ! -f "/workspace/script.sh" ]; then
    echo "Error: No script file found at /workspace/script.sh" >&2
    exit 1
fi

# Make script executable
chmod +x /workspace/script.sh

# Set up environment
echo "Starting bash script execution..."
echo "Environment variables available:"
env | grep -E '^[A-Z_][A-Z0-9_]*=' | sort

echo "----------------------------------------"
echo "Script output:"

# Execute the script with timeout protection
timeout 300 bash /workspace/script.sh

exit_code=$?

echo "----------------------------------------"
echo "Script completed with exit code: $exit_code"

exit $exit_code