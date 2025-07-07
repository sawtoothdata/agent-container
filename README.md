# Claude Code Docker Development Environment

Isolate your Claude Code development environment and tools from your host system using Docker. Connect VS Code remotely via SSH for a seamless development experience.

## Why Use This?

- **🔒 Complete Isolation**: Keep AI tools and dependencies separate from your main system
- **🛡️ Security**: Prevent AI tools from accessing your entire filesystem
- **🔧 Clean Environment**: No need to install Claude Code or dependencies on your host
- **🚀 VS Code Integration**: Connect directly with VS Code Remote SSH
- **⚡ Zero Permission Issues**: Automatic file permission handling between host and container
- **🎯 Project Focus**: Each project gets its own isolated environment

## VS Code Quickstart

### 1. Build the Claude Code Image

```bash
# Clone this repo and build the image (one-time setup)
git clone <repository-url> claude-code-env
cd claude-code-env

# Build the Docker image
docker-compose build
```

### 2. Run from Your Project Directory

```bash
# Copy the docker-compose.yml to your project root
cp docker-compose.yml /path/to/your/project/
cd /path/to/your/project/

# Start the container (mounts current directory as workspace)
docker-compose up -d
```

### 3. Connect VS Code via SSH

1. **Add SSH Config** - Add this to your `~/.ssh/config` file:
   ```
   Host claude-agent
       HostName localhost
       Port 2222
       User agent
       StrictHostKeyChecking no
       UserKnownHostsFile /dev/null
       LogLevel QUIET
   ```

2. **Connect in VS Code**:
   - Install the "Remote - SSH" extension
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Remote-SSH: Connect to Host"
   - Select `claude-agent`
   - Enter password: `agent`

### 4. Setup Claude Code (first time only):
   - Open VS Code terminal in the container
   - Run: `bash setup-claude.sh`
   - Follow the device flow authentication prompts

**Your project files** are in `/home/agent/workspace/` and automatically sync with your host directory.

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

### Authentication

Claude Code uses device flow authentication by default. If you need to use API keys:

```bash
# Set environment variables before starting container or update in docker compose
export ANTHROPIC_API_KEY="your-api-key-here" # Optional for pay as you go accounts
export KAGI_API_KEY="your-kagi-api-key"  # Optional for search integration
docker-compose up -d
```

### Resource Limits

Adjust in `docker-compose.yml`:
- Default: 4 CPUs, 8GB memory
- Modify `deploy.resources.limits` section as needed

### MCP Servers

Configure Model Context Protocol servers in `config/claude-code/config.json` for additional integrations.

## How It Works

### Isolation Benefits
- **Filesystem Isolation**: Only your project directory is mounted - Claude can't access your entire system
- **Tool Isolation**: All AI tools, dependencies, and configurations stay in the container
- **Network Isolation**: Container runs in isolated Docker network
- **Resource Limits**: CPU and memory limits prevent resource exhaustion

### File Synchronization
- Your project files are mounted at `/home/agent/workspace/` in the container
- Files created in VS Code (connected to container) appear instantly on your host
- Automatic permission handling ensures no ownership issues
- Work normally in VS Code - the isolation is transparent

### Multiple Projects
```bash
# Build the image once (from claude-code-env directory)
cd claude-code-env && docker-compose build

# Copy docker-compose.yml to each project
cp docker-compose.yml ~/project-a/
cp docker-compose.yml ~/project-b/

# Start containers from each project root
cd ~/project-a && docker-compose up -d  # Mounts project-a files
cd ~/project-b && docker-compose up -d  # Mounts project-b files (change port if running simultaneously)
```

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
3. Use device flow authentication for best results

## Security & Isolation

- **Non-root container user**: All processes run as `agent` user
- **Limited filesystem access**: Only your project directory is accessible
- **SSH localhost only**: SSH server only accepts local connections
- **Device flow auth**: Secure authentication without storing API keys
- **Resource limits**: Prevents container from consuming all system resources
- **No host system access**: Claude and tools cannot access your host filesystem

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