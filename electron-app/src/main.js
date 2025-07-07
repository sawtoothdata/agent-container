const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Docker = require('dockerode');
const Store = require('electron-store');
const { spawn } = require('child_process');

const store = new Store();
const docker = new Docker();

let mainWindow;
let isDockerImageLoaded = false;

// Docker image management
async function loadDockerImage() {
    if (isDockerImageLoaded) return true;
    
    try {
        // Check if image already exists
        const images = await docker.listImages();
        const imageExists = images.some(img => 
            img.RepoTags && img.RepoTags.includes('claude-code-desktop:latest')
        );
        
        if (imageExists) {
            console.log('✅ Docker image already loaded');
            isDockerImageLoaded = true;
            return true;
        }
        
        // Load image from bundled tar file
        const imagePath = app.isPackaged ? 
            path.join(process.resourcesPath, 'docker', 'claude-code-image.tar') :
            path.join(__dirname, '..', 'docker', 'claude-code-image.tar');
        if (!fs.existsSync(imagePath)) {
            throw new Error('Docker image not found in app bundle');
        }
        
        console.log('📦 Loading Docker image from bundle...');
        const imageStream = fs.createReadStream(imagePath);
        await docker.loadImage(imageStream);
        
        console.log('✅ Docker image loaded successfully');
        isDockerImageLoaded = true;
        return true;
    } catch (error) {
        console.error('❌ Failed to load Docker image:', error);
        return false;
    }
}

// Find available port
async function findAvailablePort(startPort = 3000) {
    const net = require('net');
    
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
        server.on('error', () => {
            findAvailablePort(startPort + 1).then(resolve).catch(reject);
        });
    });
}

// Create main window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        // icon: path.join(__dirname, '../assets/icon.png'), // Removed for now
        show: false
    });

    mainWindow.loadFile('src/renderer/index.html');
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // Load Docker image in background
        loadDockerImage();
    });

    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

// IPC handlers
ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Project Directory'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        const dirPath = result.filePaths[0];
        // Save to recent projects
        const recent = store.get('recentProjects', []);
        const filtered = recent.filter(p => p.path !== dirPath);
        filtered.unshift({
            path: dirPath,
            name: path.basename(dirPath),
            lastUsed: new Date().toISOString()
        });
        store.set('recentProjects', filtered.slice(0, 10));
        
        return dirPath;
    }
    
    return null;
});

ipcMain.handle('get-recent-projects', () => {
    return store.get('recentProjects', []);
});

ipcMain.handle('launch-claude-code', async (event, projectPath) => {
    try {
        // Ensure Docker image is loaded
        if (!await loadDockerImage()) {
            throw new Error('Failed to load Docker image');
        }
        
        // Find available port
        const sshPort = await findAvailablePort(3000);
        
        // Create container
        const containerName = `claude-code-${Date.now()}`;
        
        const container = await docker.createContainer({
            Image: 'claude-code-desktop:latest',
            name: containerName,
            ExposedPorts: {
                '2222/tcp': {}
            },
            HostConfig: {
                PortBindings: {
                    '2222/tcp': [{ HostPort: sshPort.toString() }]
                },
                Binds: [
                    `${projectPath}:/home/agent/workspace:cached`
                ],
                Memory: 8 * 1024 * 1024 * 1024, // 8GB
                CpuCount: 4
            },
            WorkingDir: '/home/agent/workspace'
        });
        
        // Start container
        await container.start();
        
        // Wait for SSH to be ready
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Store container info
        const containerInfo = {
            id: container.id,
            name: containerName,
            sshPort: sshPort,
            projectPath: projectPath,
            createdAt: new Date().toISOString()
        };
        
        const activeContainers = store.get('activeContainers', []);
        activeContainers.push(containerInfo);
        store.set('activeContainers', activeContainers);
        
        // Launch VS Code
        await launchVSCode(sshPort);
        
        return containerInfo;
        
    } catch (error) {
        console.error('Failed to launch Claude Code:', error);
        throw error;
    }
});

ipcMain.handle('stop-container', async (event, containerId) => {
    try {
        const container = docker.getContainer(containerId);
        await container.stop();
        await container.remove();
        
        // Remove from active containers
        const activeContainers = store.get('activeContainers', []);
        const filtered = activeContainers.filter(c => c.id !== containerId);
        store.set('activeContainers', filtered);
        
        return true;
    } catch (error) {
        console.error('Failed to stop container:', error);
        return false;
    }
});

ipcMain.handle('get-active-containers', () => {
    return store.get('activeContainers', []);
});

ipcMain.handle('open-vscode', async (event, sshPort) => {
    await launchVSCode(sshPort);
});


// Launch VS Code with SSH connection
async function launchVSCode(sshPort) {
    try {
        const os = require('os');
        const sshConfigDir = path.join(os.homedir(), '.ssh');
        const sshConfigPath = path.join(sshConfigDir, 'config');
        const hostAlias = `claude-code-temp-${sshPort}`;
        
        // Ensure .ssh directory exists
        if (!fs.existsSync(sshConfigDir)) {
            fs.mkdirSync(sshConfigDir, { mode: 0o700 });
        }
        
        // Read existing SSH config or create empty
        let existingConfig = '';
        if (fs.existsSync(sshConfigPath)) {
            existingConfig = fs.readFileSync(sshConfigPath, 'utf8');
        }
        
        // Create temporary SSH config entry
        const tempConfigEntry = `

# === CLAUDE CODE DESKTOP TEMPORARY ENTRY ===
# This entry is automatically managed by Claude Code Desktop
# Port: ${sshPort}, Created: ${new Date().toISOString()}
Host ${hostAlias}
    HostName localhost
    Port ${sshPort}
    User agent
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR
    ServerAliveInterval 60
    ServerAliveCountMax 3
# === END CLAUDE CODE DESKTOP ENTRY ===
`;
        
        // Remove any existing Claude Code entries and add the new one
        const cleanConfig = existingConfig.replace(
            /\n*# === CLAUDE CODE DESKTOP TEMPORARY ENTRY ===.*?# === END CLAUDE CODE DESKTOP ENTRY ===\n*/gs,
            ''
        );
        
        const newConfig = cleanConfig + tempConfigEntry;
        fs.writeFileSync(sshConfigPath, newConfig, { mode: 0o600 });
        
        // Launch VS Code with Remote-SSH
        const vscodeArgs = [
            '--folder-uri', `vscode-remote://ssh-remote+${hostAlias}/home/agent/workspace`
        ];
        
        const vscode = spawn('code', vscodeArgs, {
            stdio: 'ignore',
            detached: true
        });
        
        vscode.unref();
        
        // Clean up SSH config entry after VS Code has had time to connect
        setTimeout(() => {
            try {
                const currentConfig = fs.readFileSync(sshConfigPath, 'utf8');
                const cleanedConfig = currentConfig.replace(
                    /\n*# === CLAUDE CODE DESKTOP TEMPORARY ENTRY ===.*?# === END CLAUDE CODE DESKTOP ENTRY ===\n*/gs,
                    ''
                );
                fs.writeFileSync(sshConfigPath, cleanedConfig.trim() + (cleanedConfig.trim() ? '\n' : ''), { mode: 0o600 });
                console.log('Cleaned up temporary SSH config entry');
            } catch (error) {
                console.error('Failed to cleanup SSH config:', error);
            }
        }, 180000); // 3 minutes - enough time for VS Code to establish connection and cache it
        
        console.log(`VS Code launched with SSH connection to localhost:${sshPort}`);
        console.log(`Temporary SSH host alias: ${hostAlias}`);
        
    } catch (error) {
        console.error('Failed to launch VS Code:', error);
        
        // Fallback: Show connection instructions
        console.log(`
To manually connect to your Claude Code environment:
1. Open VS Code
2. Install the Remote-SSH extension if not already installed
3. Open Command Palette (Ctrl+Shift+P)
4. Run "Remote-SSH: Connect to Host..."
5. Enter: agent@localhost -p ${sshPort}
6. When prompted for password, enter: agent
7. Open folder: /home/agent/workspace
8. Run: bash setup-claude.sh
9. Start using Claude: claude chat
`);
        
        throw error;
    }
}

// Check if Docker is available
async function checkDockerAvailability() {
    try {
        await docker.ping();
        return true;
    } catch (error) {
        return false;
    }
}

ipcMain.handle('check-docker', async () => {
    return await checkDockerAvailability();
});

ipcMain.handle('check-vscode', () => {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
        const vscode = spawn('code', ['--version'], { stdio: 'pipe' });
        vscode.on('close', (code) => {
            resolve(code === 0);
        });
        vscode.on('error', () => {
            resolve(false);
        });
    });
});

// App events
app.whenReady().then(() => {
    createWindow();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Cleanup on quit
app.on('before-quit', async () => {
    const activeContainers = store.get('activeContainers', []);
    
    // Stop all active containers
    for (const containerInfo of activeContainers) {
        try {
            const container = docker.getContainer(containerInfo.id);
            await container.stop();
            await container.remove();
        } catch (error) {
            // Ignore errors during cleanup
        }
    }
    
    store.set('activeContainers', []);
});