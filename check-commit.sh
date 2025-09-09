#!/bin/bash
echo "Ì¥ç Checking for forbidden files..."

# Check for .env files
if git diff --staged --name-only | grep -E "\.env$"; then
    echo "‚ùå ERROR: .env file is staged!"
    exit 1
fi

# Check for node_modules
if git diff --staged --name-only | grep "node_modules"; then
    echo "‚ùå ERROR: node_modules is staged!"
    exit 1
fi

echo "‚úÖ Safe to commit!"
