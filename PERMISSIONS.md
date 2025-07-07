# Permission Handling in Claude Agent Container

This container is designed to work with mounted host directories WITHOUT changing any permissions on your host filesystem.

## How it works

1. **Dynamic UID/GID adjustment**: When the container starts, it detects the ownership of the mounted workspace directory and adjusts the container's `agent` user to match. This allows the container to create files with the same ownership as your host user.

2. **No host file modifications**: The container NEVER runs `chown` or `chmod` on the mounted workspace directory. Your host files remain untouched.

3. **Seamless file creation**: Files created inside the container will have the same ownership as the directory they're created in, matching your host user.

## Important Notes

- The container detects and adapts to your host's file ownership automatically
- No need to manually configure UID/GID in most cases
- Your host files' permissions are never modified
- New files created in the container will match your host user's ownership

## Troubleshooting

If you experience permission issues:

1. Check that the workspace is mounted correctly:
   ```bash
   docker exec -it claude-agent-container ls -la /home/agent/workspace
   ```

2. Verify the agent user's UID matches your host:
   ```bash
   docker exec -it claude-agent-container id agent
   ```

3. If needed, rebuild the container:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```