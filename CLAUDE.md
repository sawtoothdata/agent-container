# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Docker-based development environment for running Claude Code CLI in an isolated container. It provides SSH access for remote development and handles file permissions automatically between host and container.

## Common Commands

### Container Management
```bash
# Start the container
docker-compose up -d

# Stop the container
docker-compose down

# View container logs
docker-compose logs -f

# SSH into the container
ssh -p 2222 agent@localhost  # password: agent
```

### Inside Container
```bash
# Setup Claude Code (first time)
bash setup-claude.sh

# Check Claude authentication
claude auth status

# Start Claude chat
claude chat
```

## Architecture

### Key Components
- **Dockerfile**: Ubuntu 22.04 base with development tools, Claude Code CLI, and SSH server
- **docker-compose.yml**: Orchestrates container with port mapping (2222:2222), volume mounts, and resource limits
- **entrypoint.sh**: Dynamically adjusts container user UID/GID to match host workspace ownership
- **setup-claude.sh**: Interactive setup for Claude Code authentication

### Permission Handling
The container automatically detects and matches the host workspace directory ownership without modifying host files. New files created in the container will have the correct ownership on the host.

### Directory Structure
- `/home/agent/workspace`: Main development area (mounted from host)
- `~/.config/claude-code/`: Claude configuration directory
- `~/.mcp-env/`: MCP environment for integrations

## Development Workflow

1. Use device flow authentication (recommended) or set API keys in shell environment if needed
2. Start container with `docker-compose up -d`
3. SSH into container or use VS Code Remote SSH
4. Run `setup-claude.sh` if first time setup
5. Use `claude chat` or other Claude commands

## Configuration

- **Authentication**: Device flow authentication (recommended) or shell environment variables if needed
- **Resource Limits**: Configured in docker-compose.yml (default: 4 CPUs, 8GB memory)
- **MCP Servers**: Configured in `config/claude-code/config.json` for Kagi search integration