# MCP (Model Context Protocol) Integrations for DevLauncher

This document describes all MCP integrations available in DevLauncher and how they work.

## Overview

DevLauncher supports multiple MCP integrations that enhance Claude Code's capabilities. Each integration is installed per-project in the `app/public` directory.

## Available MCP Integrations

### 1. Docker MCP Gateway ✅

**Description**: Control Docker containers, images, and compose through Claude.

**Installation Command**:
```bash
claude mcp add --transport stdio docker-mcp-gateway "docker mcp gateway run"
```

**Requirements**:
- Docker Desktop installed and running
- Beta features enabled in Docker Desktop (Settings → Features in development → Enable Beta features)

**How it works**:
- Runs on-demand when Claude needs it
- "Failed to connect" message during testing is NORMAL - the gateway starts automatically when needed
- Provides access to Docker commands through Claude

**Available Tools**:
- context7, curl, desktop-commander, docker, fetch, github-official, playwright, puppeteer

### 2. Semgrep MCP ✅

**Description**: Code security analysis and pattern matching.

**Installation Command**:
```bash
claude mcp add --transport stdio semgrep pipx run semgrep-mcp
```

**Requirements**:
- Python installed
- pipx (will be installed automatically if missing)

**How it works**:
- Uses pipx to run Semgrep in isolated environment
- Analyzes code for security issues and patterns
- Optional: Can use Semgrep API token for advanced features

### 3. Exa MCP

**Description**: AI-powered web search and research.

**Installation Command**:
```bash
claude mcp add --transport http exa "https://mcp.exa.ai/mcp?exaApiKey=YOUR_API_KEY"
```

**Requirements**:
- API key from https://dashboard.exa.ai/api-keys

**How it works**:
- Uses HTTP transport with API key in URL
- Provides web search capabilities to Claude

### 4. Ref Tools MCP

**Description**: Access documentation for APIs, services, and libraries with token-efficient search.

**Installation Command**:
```bash
claude mcp add --transport http Ref "https://api.ref.tools/mcp?apiKey=YOUR_API_KEY"
```

**Requirements**:
- API key from https://ref.tools

**How it works**:
- Uses HTTP transport with API key in URL
- Provides documentation search capabilities

### 5. Magic MCP (21st.dev) ✨

**Description**: AI-powered UI component generation - create beautiful, modern components instantly.

**Installation Command**:
```bash
npx @21st-dev/cli@latest install claude --api-key YOUR_API_KEY
```

**Requirements**:
- Node.js installed
- API key from https://magic.21st.dev/console

**How it works**:
- Uses npx to install the Magic CLI
- Configures Claude to use Magic for UI generation
- Provides access to pre-built component library
- Supports natural language component creation

**Features**:
- Generate UI components with descriptions like "modern pricing card"
- Access vast library of customizable components
- TypeScript support
- Multi-framework compatibility
- Real-time component preview

## WordPress-Specific Integrations

### WordPress MCP

**Complete Installation Workflow**:

1. **Build WordPress MCP** (Puzzle Icon):
   ```bash
   git clone https://github.com/Automattic/wordpress-mcp.git
   cd wordpress-mcp
   composer install --no-dev
   npm install
   npm run build
   ```

2. **Copy Plugin Files** (Green Folder Icon):
   - Copies built plugin to `wp-content/plugins/wordpress-mcp`
   - Only copies production files (skips src/, node_modules/)

3. **Install Composer Dependencies** (Cyan Cube Icon) - Optional:
   ```bash
   docker exec PROJECT_wordpress composer install --no-dev --working-dir=/var/www/html/wp-content/plugins/wordpress-mcp
   ```

4. **Manual Activation**:
   - Login to WordPress Admin (admin/password)
   - Activate WordPress MCP plugin
   - Generate API token in Settings → WordPress MCP

5. **Configure Claude Code** (Yellow Key Icon):
   ```bash
   claude mcp add --transport http wordpress-mcp http://localhost:PORT/wp-json/wp/v2/wpmcp/streamable --header "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## AI Development Frameworks

### PRPs (Product Requirement Prompts)

**Description**: AI engineering methodology framework.

**Installation**:
- Clones PRPs-agentic-eng repository
- Copies .claude/commands, PRPs folder, and CLAUDE.md
- Shows installation instructions in terminal

### Context Engineering

**Description**: Complete framework for AI development.

**Installation**:
- Clones context-engineering-intro repository
- Intelligently merges files without breaking existing structure
- Handles subfolder conflicts

## External Tools

### Claudia (GUI for Claude Code)

**Description**: Desktop GUI application for Claude Code built with Tauri.

**Installation**:
- Not installed per-project
- DevLauncher provides "Open in Claudia" button
- Checks common installation paths and launches if found

## Installation Implementation Details

### PowerShell vs CMD

- **Semgrep, Exa, Ref Tools**: Use PowerShell for better formatting and error handling
- **Docker MCP**: Uses PowerShell with colored output
- **WordPress integrations**: Mix of CMD and PowerShell depending on operation

### Common Patterns

1. **State Management**: 
   - `setInstallingMcp(mcp.id)` when starting
   - `setInstallingMcp(null)` when complete
   - Prevents double-clicking

2. **Error Handling**:
   - PowerShell scripts include error checking
   - Colored output for success/failure
   - Clear instructions when things go wrong

3. **Path Handling**:
   - Always use absolute paths
   - Convert forward slashes to backslashes for Windows
   - Quote paths with spaces

### Command Structure

```javascript
// PowerShell approach (preferred)
const psCommand = [
  `cd '${publicPath}'`,
  `Write-Host 'Installing...' -ForegroundColor Green`,
  `claude mcp add ...`,
  `Write-Host 'Complete!' -ForegroundColor Green`
].join('; ')

await window.electronAPI.runCommand('cmd', [
  '/c', 'start', 'powershell', '-NoExit', '-Command', psCommand
])
```

## Troubleshooting

### Docker MCP Shows "Failed to connect"
- This is NORMAL - Docker MCP runs on-demand
- Ensure Docker Desktop Beta features are enabled
- Test with: `docker mcp gateway run`

### Semgrep Installation Fails
- Ensure Python is installed
- Run `python --version` to verify
- pipx will be installed automatically if missing

### MCP Commands Not Found
- Ensure Claude Code is installed: `npm install -g @anthropic-ai/claude-code`
- Check installation with: `claude --version`
- Run from project's `app/public` directory

### Button Stays Disabled
- Check browser console for errors
- Refresh the page
- Check that `installingMcp` state is properly reset

## Important Notes

1. **All MCPs are installed per-project** in the `app/public` directory
2. **Configuration is stored** in `.claude.json` in the project directory
3. **Docker MCP Gateway** requires Docker Desktop with Beta features
4. **API keys** should never be committed to version control
5. **PowerShell execution** provides better user experience with colored output

## Future Improvements

- Add more MCP integrations as they become available
- Implement automatic API key management
- Add health check indicators in UI
- Support for global MCP installations