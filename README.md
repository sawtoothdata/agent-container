# Claude Code Docker Development Environment

A Docker-based development environment for running Claude Code CLI in an isolated container with SSH access for remote development.

## Features

- **Isolated Environment**: Run Claude Code in a secure Docker container
- **SSH Access**: Connect via SSH for remote development
- **Automatic Permission Handling**: Seamlessly handles file permissions between host and container
- **Development Tools**: Pre-installed with essential development tools
- **MCP Integration**: Configured for Model Context Protocol servers

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- An Anthropic API key (optional - can use device flow authentication)

### 2. Clone and Setup

```bash
git clone <repository-url>
cd <repository-directory>

# Create .env file (optional)
echo "ANTHROPIC_API_KEY=your-api-key-here" > .env
```

### 3. Start the Container

```bash
docker-compose up -d
```

### 4. Configure SSH Access

Add the following to your `~/.ssh/config` file:

```
Host claude-agent
    HostName localhost
    Port 2222
    User agent
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel QUIET
```

Now you can connect using:
```bash
ssh claude-agent
```

Default password: `agent`

### 5. Running Claude in Terminal

Once connected via SSH:

```bash
# First-time setup (authenticates Claude)
bash setup-claude.sh

# Check authentication status
claude auth status

# Start Claude chat
claude chat

# Run Claude with a specific prompt
claude "Your prompt here"

# Use Claude with files
claude "Analyze this code" file.py

# Start an interactive session
claude chat --model claude-3-5-sonnet-20241022
```

## Directory Structure

```
.
├── README.md              # This file
├── CLAUDE.md             # Claude Code specific guidance
├── PERMISSIONS.md        # Permission handling documentation
├── Dockerfile            # Container image definition
├── docker-compose.yml    # Container orchestration
├── entrypoint.sh        # Container startup script
├── setup-claude.sh      # Claude authentication setup
├── ssh_config_example   # SSH configuration template
├── config/              # Configuration files
│   └── claude-code/     # Claude Code configuration
└── workspace/           # Your development files (mounted)
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Required for API key authentication (optional if using device flow)
ANTHROPIC_API_KEY=your-api-key-here

# Optional: For Kagi search integration
KAGI_API_KEY=your-kagi-api-key
```

### Resource Limits

Adjust in `docker-compose.yml`:
- Default: 4 CPUs, 8GB memory
- Modify `deploy.resources.limits` section as needed

### MCP Servers

Configure Model Context Protocol servers in `config/claude-code/config.json` for additional integrations.

## Development Workflow

1. **VS Code Remote Development**:
   ```bash
   # Install Remote-SSH extension in VS Code
   # Connect to: ssh://claude-agent
   ```

2. **Terminal Access**:
   ```bash
   # Direct SSH
   ssh claude-agent
   
   # Docker exec
   docker exec -it claude-agent-container bash
   ```

3. **File Management**:
   - Work in `/home/agent/workspace` (mounted from host)
   - Files created in container have correct host ownership
   - No permission issues between host and container

## Common Commands

### Container Management

```bash
# Start container
docker-compose up -d

# Stop container
docker-compose down

# View logs
docker-compose logs -f

# Rebuild container
docker-compose build --no-cache
docker-compose up -d
```

### Inside Container

```bash
# Claude commands
claude chat                    # Start interactive chat
claude "prompt"               # Single prompt
claude auth status            # Check authentication
claude auth login             # Re-authenticate

# System commands
cd workspace                  # Navigate to workspace
ls -la                       # List files
```

## Troubleshooting

### SSH Connection Issues

1. Check container is running:
   ```bash
   docker ps | grep claude-agent
   ```

2. Verify SSH service:
   ```bash
   docker exec claude-agent-container service ssh status
   ```

3. Check port availability:
   ```bash
   lsof -i :2222
   ```

### Permission Issues

See [PERMISSIONS.md](PERMISSIONS.md) for detailed information about the automatic permission handling system.

### Claude Authentication

If Claude commands fail:
1. Run `claude auth status` to check authentication
2. Run `bash setup-claude.sh` to re-authenticate
3. Ensure ANTHROPIC_API_KEY is set correctly in `.env`

## Security Notes

- The container runs with a non-root user (`agent`)
- SSH is configured for local development only
- API keys are stored securely in `.env` (gitignored)
- Container has resource limits to prevent system overuse

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues or questions:
- Check existing GitHub issues
- Review documentation in CLAUDE.md and PERMISSIONS.md
- Create a new issue with detailed information