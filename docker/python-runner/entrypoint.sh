#!/bin/bash

# Entrypoint script for Python runner container
# This script sets up the environment and executes the user's Python script

set -e

# Check if script file exists
if [ ! -f "/workspace/script.py" ]; then
    echo "Error: No script file found at /workspace/script.py" >&2
    exit 1
fi

# Set up environment
echo "Starting Python script execution..."
echo "Python version: $(python --version)"
echo "Environment variables available:"
env | grep -E '^[A-Z_][A-Z0-9_]*=' | sort

echo "----------------------------------------"
echo "Script output:"

# Execute the script with timeout protection
timeout 300 python /workspace/script.py

exit_code=$?

echo "----------------------------------------"
echo "Script completed with exit code: $exit_code"

exit $exit_code