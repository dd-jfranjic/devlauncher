# Archon AI Command Center

This directory will contain the Archon source code when it's added as a Git submodule.

## Setup Instructions

To add Archon as a submodule:

```bash
# Remove this placeholder directory
rm -rf archon/

# Add Archon as a Git submodule
git submodule add https://github.com/coleam00/Archon.git archon

# Initialize and update the submodule
git submodule update --init --recursive
```

## Expected Structure

After adding the submodule, the directory should contain:

```
archon/
├── server/                 # FastAPI backend
├── mcp/                   # MCP protocol implementation
├── agents/                # PydanticAI agents
├── frontend/              # React UI
├── docker-compose.yml     # Original Archon compose
├── Dockerfile.server      # Server container
├── Dockerfile.mcp         # MCP container
├── Dockerfile.agents      # Agents container
├── Dockerfile.frontend    # Frontend container
└── README.md              # Archon documentation
```

## Dev Launcher Integration

Once the submodule is added:

1. The ArchonService will automatically detect the source code
2. Docker containers will be built from the Dockerfiles
3. Global Archon will be available through the Dev Launcher UI
4. Per-project Archon instances can be enabled in Phase 3

## Current Status

- ✅ Database schema ready (SystemService model)
- ✅ ArchonService implementation complete
- ✅ API endpoints implemented
- ✅ Docker configuration ready
- ❌ Archon source code (needs Git submodule)
- ❌ Frontend UI integration (Phase 2)

This is a placeholder until the Git submodule is properly configured.