#!/bin/bash
echo "� Checking for forbidden files..."

# Check for .env files
if git diff --staged --name-only | grep -E "\.env$"; then
    echo "❌ ERROR: .env file is staged!"
    exit 1
fi

# Check for node_modules
if git diff --staged --name-only | grep "node_modules"; then
    echo "❌ ERROR: node_modules is staged!"
    exit 1
fi

echo "✅ Safe to commit!"
