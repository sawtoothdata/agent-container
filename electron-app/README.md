# Claude Code Desktop

A desktop application that provides an isolated Docker environment for Claude Code with seamless VS Code integration.

## Features

- 🔒 **Complete Isolation**: Run Claude Code in a secure Docker container
- 🚀 **One-Click Launch**: Select any directory and launch VS Code with Claude
- 📦 **Bundled Docker Image**: No need to build Docker images separately
- 🔄 **Container Management**: Start, stop, and manage multiple environments
- 📁 **Project History**: Quick access to recently used projects
- ⚡ **Auto VS Code Connection**: Automatically connects VS Code via SSH

## How It Works

1. **Select Directory**: Choose any project folder on your system
2. **Launch Environment**: Creates an isolated Docker container with Claude Code
3. **Auto VS Code**: Automatically opens VS Code connected to the container
4. **Secure Isolation**: Only the selected directory is accessible to Claude

## Prerequisites

- **Docker Desktop**: Must be installed and running
- **VS Code**: Must be installed with Remote-SSH extension
- **System Requirements**: 8GB RAM recommended, 4GB minimum

## Installation

### Option 1: Download Release (Recommended)
1. Download the latest release for your platform from GitHub Releases
2. Install the application (`.dmg` for macOS, `.exe` for Windows, `.AppImage` for Linux)
3. Launch "Claude Code Desktop"

### Option 2: Build from Source

#### Prerequisites for Building
- Node.js 18+ and npm
- Docker Desktop
- Git

#### Build Steps

```bash
# Clone the repository
git clone <repository-url>
cd claude-code-desktop

# Install dependencies
npm install

# Build the Docker image and package the app
npm run build

# The built app will be in the dist/ directory
```

#### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build Docker image only
npm run build:docker
```

## Usage

1. **Launch the App**: Open Claude Code Desktop
2. **System Check**: Ensure Docker and VS Code are detected (green checkmarks)
3. **Select Project**: Click "Browse Folder" and choose your project directory
4. **Launch**: Click "Launch VS Code with Claude"
5. **Wait**: The app will create a container and open VS Code automatically
6. **Start Coding**: VS Code opens connected to the isolated environment

### First Time Setup in VS Code

When VS Code opens for the first time:
1. Open the integrated terminal in VS Code
2. Run: `bash setup-claude.sh`
3. Follow the device flow authentication prompts
4. Start using Claude: `claude chat`

## Technical Details

### What Gets Built

The build process (`npm run build`) does the following:

1. **Builds Docker Image**: Creates the Claude Code container image
2. **Saves Image to Tar**: Bundles the Docker image as a tar file
3. **Packages Electron App**: Includes the Docker image in the app bundle
4. **Creates Installers**: Generates platform-specific installers

### Docker Image Bundling

- Docker image is built from the parent directory's `Dockerfile`
- Image is saved as `docker/claude-code-image.tar` in the app bundle
- On first launch, the app loads this image into Docker
- No internet connection needed after installation

### File Structure

```
electron-app/
├── src/
│   ├── main.js              # Electron main process
│   └── renderer/
│       └── index.html       # UI interface
├── scripts/
│   └── build-docker.js      # Docker build automation
├── assets/                  # App icons and resources
├── docker/                  # Bundled Docker image (created during build)
└── dist/                    # Built applications (created during build)
```

### Security

- **Isolated Filesystem**: Only selected directory is mounted in container
- **No Host Access**: Claude cannot access files outside the project directory
- **SSH Localhost Only**: SSH connections are local-only
- **Resource Limits**: Container has CPU and memory limits
- **Clean Cleanup**: Containers are properly stopped and removed on app exit

## Troubleshooting

### Docker Issues
- Ensure Docker Desktop is running
- Check if you have sufficient disk space (2GB+ required)
- Restart Docker Desktop if containers won't start

### VS Code Issues
- Install the "Remote-SSH" extension in VS Code
- Ensure VS Code is in your system PATH
- Try running `code --version` in terminal

### Permission Issues
- On Linux, ensure your user is in the `docker` group
- On macOS, ensure Docker Desktop has proper permissions

### Container Management
- Use the "Containers" tab to view and manage active environments
- Stop unused containers to free up resources
- Each project gets its own isolated container

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.