FROM ubuntu:22.04

# Build arguments for UID/GID
ARG USER_UID=1000
ARG USER_GID=1000

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    openssh-server \
    sudo \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    ripgrep \
    jq \
    locales \
    && rm -rf /var/lib/apt/lists/*

# Generate locale
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Install pipx and uvx for Python package management
RUN python3 -m pip install --user pipx && \
    python3 -m pipx ensurepath && \
    /root/.local/bin/pipx install uv

# Add pipx binaries to PATH
ENV PATH="/root/.local/bin:${PATH}"

# Create agent user with sudo privileges
# Using configurable UID/GID for better host compatibility
RUN groupadd -g ${USER_GID} agent && \
    useradd -m -s /bin/bash -u ${USER_UID} -g ${USER_GID} agent && \
    echo "agent:agent" | chpasswd && \
    usermod -aG sudo agent && \
    echo "agent ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Configure SSH
RUN mkdir /var/run/sshd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# Switch to agent user for user-specific installations
USER agent
WORKDIR /home/agent

# Install Node.js via nvm for the agent user (for better version management)
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && \
    . /home/agent/.bashrc && \
    export NVM_DIR="$HOME/.nvm" && \
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && \
    nvm install --lts && \
    nvm use --lts && \
    npm install -g @anthropic-ai/claude-code

# Set up pipx for agent user
RUN python3 -m pip install --user pipx && \
    python3 -m pipx ensurepath && \
    /home/agent/.local/bin/pipx install uv

# Add local bin directories to PATH for agent user
ENV PATH="/home/agent/.local/bin:/home/agent/.nvm/versions/node/$(ls /home/agent/.nvm/versions/node)/bin:${PATH}"

# Create workspace directory
RUN mkdir -p /home/agent/workspace

# Copy setup script
COPY --chown=agent:agent setup-claude.sh /home/agent/setup-claude.sh
RUN chmod +x /home/agent/setup-claude.sh

# Create .bashrc additions for nvm
RUN echo 'export NVM_DIR="$HOME/.nvm"' >> /home/agent/.bashrc && \
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> /home/agent/.bashrc && \
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> /home/agent/.bashrc && \
    echo 'export PATH="/home/agent/.local/bin:$PATH"' >> /home/agent/.bashrc

# Create startup script
RUN echo '#!/bin/bash\n\
# Keep container running\n\
tail -f /dev/null' > /home/agent/start.sh && \
    chmod +x /home/agent/start.sh

# Switch back to root for service management
USER root

# Create a wrapper script for handling file operations without changing host permissions
RUN echo '#!/bin/bash\n\
# This script ensures we can work with mounted volumes without changing host permissions\n\
cd /home/agent/workspace 2>/dev/null || cd /home/agent\n\
exec "$@"' > /usr/local/bin/workspace-exec && \
    chmod +x /usr/local/bin/workspace-exec

# Copy entrypoint script
COPY --chown=root:root entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose SSH port
EXPOSE 2222

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]