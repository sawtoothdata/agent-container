#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🐳 Building Docker image for Claude Code Desktop...');

// Ensure docker directory exists
const dockerDir = path.join(__dirname, '..', 'docker');
if (!fs.existsSync(dockerDir)) {
    fs.mkdirSync(dockerDir, { recursive: true });
}

// Check if tar file already exists
const tarPath = path.join(dockerDir, 'claude-code-image.tar');
if (fs.existsSync(tarPath)) {
    console.log('✅ Docker image tar file already exists, skipping build');
    console.log('🚀 Ready for Electron build!');
    process.exit(0);
}

// Build Docker image from parent directory (where Dockerfile is located)
const buildProcess = spawn('docker', ['build', '-t', 'claude-code-desktop:latest', '../..'], {
    stdio: 'inherit',
    cwd: __dirname
});

buildProcess.on('close', (code) => {
    if (code !== 0) {
        console.error(`❌ Docker build failed with code ${code}`);
        process.exit(1);
    }
    
    console.log('✅ Docker image built successfully');
    console.log('📦 Saving Docker image to tar file...');
    
    // Save image to tar file
    const saveProcess = spawn('docker', [
        'save', 
        '-o', 
        path.join(dockerDir, 'claude-code-image.tar'),
        'claude-code-desktop:latest'
    ], {
        stdio: 'inherit'
    });
    
    saveProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`❌ Docker save failed with code ${code}`);
            process.exit(1);
        }
        
        console.log('✅ Docker image saved to tar file');
        console.log('🚀 Ready for Electron build!');
    });
});

buildProcess.on('error', (error) => {
    console.error('❌ Failed to start Docker build:', error);
    process.exit(1);
});