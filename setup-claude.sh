#!/bin/bash

# Quick setup script for Claude Code in the container
# Run this after SSH connection: bash setup-claude.sh

echo "🤖 Claude Code Container Setup"
echo "=============================="

# Check if Claude Code is installed
if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code not found"
    echo "Installing Claude Code..."
    npm install -g @anthropic-ai/claude-code
else
    echo "✅ Claude Code is installed"
    claude --version
fi

# Check authentication status
echo ""
echo "🔐 Checking authentication..."
if claude auth status &> /dev/null; then
    echo "✅ Claude Code is already authenticated and ready!"
    echo ""
    echo "You can now run:"
    echo "  claude chat"
    echo "  claude code review"
    echo "  claude --help"
else
    echo "⚠️  Claude Code needs authentication"
    echo ""
    echo "Choose your authentication method:"
    echo "1. 🏆 Pro/Team Account (recommended): claude auth login --device"
    echo "2. 🔑 API Key: export ANTHROPIC_API_KEY='your-key'"
    echo ""
    
    read -p "Do you want to login with device flow now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting device flow login..."
        claude auth login --device
    else
        echo "Skipping login. Run 'claude auth login --device' when ready."
    fi
fi

echo ""
echo "📁 Workspace: /workspace"
echo "⚙️  Config: ~/.config/claude-code/"
echo "🐍 MCP env: ~/.mcp-env/"
echo ""
echo "💡 Tips:"
echo "  - Device flow login preserves your Pro subscription benefits"
echo "  - Use 'claude auth status' to check login status"
echo "  - Use 'claude auth logout' to logout if needed"