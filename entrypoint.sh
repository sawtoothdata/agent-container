#!/bin/bash

# Start SSH service
service ssh start

# Get the UID/GID of the mounted workspace directory
if [ -d "/home/agent/workspace" ]; then
    WORKSPACE_UID=$(stat -c "%u" /home/agent/workspace)
    WORKSPACE_GID=$(stat -c "%g" /home/agent/workspace)
    
    # Only adjust the agent user's UID/GID if they don't match
    # This allows the container user to create files with the same ownership as the host
    # WITHOUT changing any existing file permissions
    if [ "$WORKSPACE_UID" != "$(id -u agent)" ]; then
        echo "Adjusting agent user UID to match host workspace: $WORKSPACE_UID"
        usermod -u $WORKSPACE_UID agent
    fi
    
    if [ "$WORKSPACE_GID" != "$(id -g agent)" ]; then
        echo "Adjusting agent group GID to match host workspace: $WORKSPACE_GID"
        groupmod -g $WORKSPACE_GID agent
    fi
    
    # Fix ownership of agent's home directory (NOT the workspace)
    chown -R agent:agent /home/agent/.ssh /home/agent/.bashrc /home/agent/.local /home/agent/.nvm /home/agent/setup-claude.sh /home/agent/start.sh 2>/dev/null || true
fi

# Switch to agent user and run the start script
exec su - agent -c '/home/agent/start.sh'