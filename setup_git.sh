#!/usr/bin/env bash

# GeoPulse Git Repository Initialization Script

set -e

echo "=========================================================="
echo "🚀 Initializing Git Repository for GeoPulse..."
echo "=========================================================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed or not in PATH."
    exit 1
fi

# Initialize repository if not already initialized
if [ ! -d ".git" ]; then
    git init -b main
    echo "✅ Initialized empty Git repository in $(pwd)/.git"
else
    echo "ℹ️  Git repository already initialized."
    git checkout -B main
fi

# Configure local user if not globally set
if [ -z "$(git config user.name)" ]; then
    git config user.name "GeoPulse Engineer"
    git config user.email "engineer@geopulse.local"
    echo "ℹ️  Configured default local Git user identity."
fi

# Stage all files
git add .

# Create initial commit if there are staged changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    git commit -m "feat: initial commit for GeoPulse Location Intelligence & Spatial Analytics Platform"
    echo "✅ Created initial commit on branch 'main'."
else
    echo "ℹ️  No changes to commit (clean working tree)."
fi

echo "=========================================================="
echo "🎉 GeoPulse Git repository initialization complete!"
echo "=========================================================="
