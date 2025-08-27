# CLAUDE.md - Dev Launcher Project Guidelines

## Project Overview
Dev Launcher is a Windows-native desktop application for managing Docker-based development projects with integrated AI tooling (Claude/Gemini CLI, MCP) and Playwright testing capabilities.

## Project Architecture

### Technology Stack
- **Frontend**: Electron (Windows native) + React + TypeScript + Vite + Tailwind CSS/shadcn-ui
- **State Management**: Zustand
- **Backend**: Node.js (TypeScript) running in Docker container
- **Database**: SQLite with Prisma ORM
- **Container Orchestration**: Docker Desktop + WSL2
- **Testing**: Playwright (E2E), Vitest/Jest (Unit)
- **Logging**: Pino (NDJSON format)

### Key Components
1. **Desktop UI**: Electron renderer with sidebar navigation and tabbed content
2. **API Server**: REST + SSE/WebSocket on http://127.0.0.1:9976
3. **Docker Management**: Per-project compose orchestration
4. **Port Allocator**: Dynamic port assignment with collision detection
5. **URL Resolver**: Multi-candidate health checking
6. **CLI Integration**: Claude/Gemini installation and MCP configuration

## Development Guidelines

### Code Style & Conventions
- **TypeScript**: Strict mode enabled, explicit typing for all functions
- **Naming**: 
  - Components: PascalCase
  - Files: kebab-case for utilities, PascalCase for components
  - Variables/functions: camelCase
  - Constants: UPPER_SNAKE_CASE
- **Imports**: Absolute paths from src/
- **No console.log**: Use Pino logger
- **Error Handling**: Always use try-catch with proper error typing
- **Async/Await**: Preferred over promises
- **Comments**: Only for complex business logic

### File Structure
```
/dev-launcher
├── /server                 # Backend API
│   ├── /src
│   │   ├── /api           # Controllers
│   │   ├── /services      # Business logic
│   │   ├── /adapters      # External integrations
│   │   ├── /db            # Database layer
│   │   └── /domain        # Types, validation
│   └── /prisma            # Database schema
├── /client                # Electron + React frontend
│   ├── /src
│   │   ├── /components    # React components
│   │   ├── /stores        # Zustand stores
│   │   ├── /hooks         # Custom React hooks
│   │   ├── /lib           # Utilities
│   │   └── /types         # TypeScript types
│   └── /electron          # Electron main process
└── /templates             # Project templates
```

### Testing Requirements
- Unit tests for all services and utilities
- Integration tests for API endpoints
- E2E tests for critical user flows
- Test coverage minimum: 80%
- Run tests before committing: `npm test`
- Lint check: `npm run lint`
- Type check: `npm run typecheck`

### Git Workflow
- Branch naming: `feature/`, `fix/`, `refactor/`
- Commit messages: Conventional commits format
- PR required for main branch
- All tests must pass before merge

## API Design Principles

### Endpoints
- RESTful conventions
- Consistent error format
- Zod validation for all inputs
- Authentication via Bearer token
- CSRF protection for mutations

### Response Format
```json
{
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2025-08-10T12:00:00Z"
  }
}
```

### Error Format
```json
{
  "error": "BadRequest",
  "message": "Validation failed",
  "code": 400,
  "details": {}
}
```

## Security Guidelines
- **Loopback only**: API binds to 127.0.0.1
- **Path validation**: Whitelist for file operations
- **Input sanitization**: Regex validation for slugs
- **Docker socket**: Limited access, audit logging
- **No secrets in code**: Use environment variables

## Performance Targets
- UI load time: < 1500ms
- Project creation: < 90s
- Port allocation: < 500ms
- URL resolution: < 2s per candidate
- Support 1000+ projects without lag

## Docker & WSL Integration

### Location Support
- **WSL**: `/home/jfranjic/dev-projects/` (recommended for Docker)
- **Windows**: `C:\Users\jfran\Documents\dev-projects\`

### WSL Project Features
- **Terminal**: Opens as user `jfranjic` directly in project directory using `--cd` flag (WSL 2.0+)
- **Folder**: Opens Windows Explorer via UNC path `\\wsl$\Ubuntu\...`
- **Editor**: 
  - Supports both VS Code and Cursor AI for WSL projects
  - Opens in WSL Remote mode with `--remote wsl+Ubuntu`
  - Ensures specific project folder is opened, not parent directory
  - Uses preferred editor from settings
- **Docker**: Commands execute via `wsl.exe -d Ubuntu` for proper container management
- **Directory Creation**: Uses `wsl.exe -u jfranjic mkdir -p` to ensure proper permissions

### Shell Commands
```typescript
// WSL terminal with directory navigation
wt.exe -p Ubuntu -- wsl.exe -d Ubuntu -u jfranjic --cd "/path/to/project"

// WSL execution
wsl.exe -d Ubuntu -u jfranjic bash -c "command"

// Windows Terminal
wt.exe -p "PowerShell 7" -d "path"

// VS Code WSL Remote (using start command for proper launching)
start "" "code" --remote wsl+Ubuntu "/home/jfranjic/dev-projects/project"

// Windows Explorer for WSL
start "" "explorer.exe" "\\wsl$\Ubuntu\home\jfranjic\dev-projects\project"
```

### Important WSL Notes
- Always use user `jfranjic` not root for WSL operations
- Ensure `/home/jfranjic/dev-projects` has correct ownership: `chown -R jfranjic:jfranjic`
- WSL 2.0+ required for `--cd` flag support
- UNC paths required for Windows access to WSL files

## MCP (Model Context Protocol) Integration
- Per-project MCP configuration
- Support for Docker, WordPress, filesystem MCPs
- Configuration stored in `.claude/mcp.json`
- Base URL from URL resolver

## Logging & Monitoring
- Centralized logs in `.devlauncher/logs/`
- Per-project log directories
- Log rotation at 5MB
- Audit log for all mutations
- WebSocket/SSE for live streaming

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Type checking
npm run typecheck

# Database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Docker Commands
```bash
# Start Dev Launcher container
docker compose up -d

# View logs
docker logs devlauncher -f

# Rebuild container
docker compose build --no-cache
```

## Project-Specific Rules

1. **All-in-Docker**: Every component runs in containers
2. **No manual Docker commands**: Use API/UI for all operations
3. **Port allocation**: Always use PortService, never hardcode
4. **Template system**: All new project types via templates
5. **Error recovery**: Graceful degradation, clear user feedback
6. **Accessibility**: WCAG 2.1 AA compliance required

## Terminal Command Execution - IMPORTANT

### CRITICAL FIX: Keeping Terminal Open After Command Execution
When executing commands via terminal buttons (Claude CLI, Gemini CLI, etc.), the terminal MUST stay open after command completion so users can see the output.

**WORKING SOLUTION FOR WSL PROJECTS (DO NOT CHANGE):**
```javascript
// For MCP list and other non-interactive commands that need to show output
if (command.includes('mcp') || command.includes('--version') || command.includes('--help')) {
  // CRITICAL: Use && bash to keep terminal open after command completes
  wtCommand = `wt.exe -p Ubuntu -- wsl.exe -d Ubuntu -u jfranjic --cd "${wslPath}" bash -lic "${command} && bash"`;
}
```

**The `&& bash` at the end is ESSENTIAL** - it starts a new bash session after the command completes, preventing the terminal from closing immediately.

**Tested and confirmed working:**
- `claude mcp list` - Shows "Checking MCP server health..." then displays connected servers
- Terminal stays open at bash prompt after showing results
- Example output:
  ```
  Checking MCP server health...
  
  playwright: npx @playwright/mcp@latest - ✓ Connected
  jfranjic@jfranjic:~/dev-projects/test-wsl$
  ```

**Important bash flags:**
- `-l` = login shell (loads .bashrc for PATH)
- `-i` = interactive shell
- `-c` = execute command

**Common .bashrc issues:**
- Remove lines with Windows paths containing spaces/parentheses (causes syntax errors)
- Ensure `export PATH=~/.npm-global/bin:$PATH` is present for npm global tools
```

**For Windows projects:**
```javascript
// Use PowerShell -NoExit flag to keep terminal open
wtCommand = `wt.exe -p "PowerShell 7" -d "${paths.host}" powershell.exe -NoExit -Command "${command}"`;
```

### WSL CLI Tools Path Configuration
All CLI tools installed via npm in WSL must use login shell (`bash -l`) to ensure proper PATH:
- Claude CLI: `~/.npm-global/bin/claude`
- Gemini CLI: `~/.npm-global/bin/gemini`

**ALWAYS use `bash -l -c` for WSL commands** that need access to user-installed tools.

Example commands that need login shell:
- `gemini --version`
- `claude --version`
- `npm view @google/gemini-cli version`
- Any command using user-installed npm packages

## Common Patterns

### Service Pattern
```typescript
export class ProjectService {
  constructor(
    private db: PrismaClient,
    private docker: DockerService
  ) {}
  
  async createProject(dto: CreateProjectDto): Promise<Project> {
    // Validation
    // Business logic
    // Error handling
    // Audit logging
  }
}
```

### Controller Pattern
```typescript
@Controller('/projects')
export class ProjectController {
  @Post('/')
  @ValidateBody(CreateProjectDto)
  async create(req: Request, res: Response) {
    // Extract DTO
    // Call service
    // Format response
  }
}
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Check PortService logs
2. **WSL path issues**: Verify WSL distro name is "Ubuntu"
3. **Docker socket**: Ensure mount in compose.yml
4. **Terminal profile**: Verify PowerShell 7 installed

### WSL-Specific Issues
1. **Terminal opens as root**: Ensure using `-u jfranjic` flag
2. **Terminal doesn't navigate to project**: 
   - Check WSL version with `wsl.exe --version` (needs 2.0+)
   - Verify directory exists: `wsl.exe -d Ubuntu -u jfranjic ls -la /home/jfranjic/dev-projects/`
3. **Permission denied creating directories**:
   - Fix ownership: `wsl.exe -d Ubuntu bash -c "sudo chown -R jfranjic:jfranjic /home/jfranjic/dev-projects"`
4. **Folder icon doesn't work**: 
   - Check UNC path access: `\\wsl$\Ubuntu\home\jfranjic\dev-projects\`
   - Ensure WSL is running: `wsl.exe -d Ubuntu echo "test"`
5. **VS Code doesn't open in WSL**:
   - Install WSL extension in VS Code
   - Ensure `code` command is in PATH

### Debug Mode
Set `NODE_ENV=development` for verbose logging

## Testing with Playwright MCP

The Playwright MCP (Model Context Protocol) integration is available for automated browser testing of the Dev Launcher UI. This enables comprehensive E2E testing of all UI components and user flows.

### Playwright MCP Commands

Key commands available through Playwright MCP:
- `browser_navigate` - Navigate to URLs
- `browser_snapshot` - Take accessibility snapshots
- `browser_click` - Click on elements
- `browser_type` - Type text into inputs
- `browser_select_option` - Select dropdown options
- `browser_take_screenshot` - Capture screenshots
- `browser_wait_for` - Wait for elements or conditions
- `browser_evaluate` - Execute JavaScript in browser context

### Testing Workflow

1. **Start the application**: Ensure Docker containers are running
2. **Use browser_navigate**: Navigate to http://localhost:5173
3. **Take snapshots**: Use browser_snapshot to understand page structure
4. **Interact with UI**: Click buttons, fill forms, navigate tabs
5. **Verify functionality**: Check logs, terminal, and all features work
6. **Fix issues**: Make code changes and verify with hot reload
7. **Repeat testing**: Continue until all features pass

### Test Coverage Areas

- Project creation flow
- Docker container management (start/stop/restart)
- Terminal opening functionality
- Log streaming and viewing
- File/folder opening
- Editor integration
- Settings management
- Port allocation
- Template system
- WebSocket connections for live updates

## CLI Installation Fixes for WSL Projects (August 2025)

### Problem
The CLI installation endpoints for Gemini CLI and Qwen CLI in WSL projects were not properly checking if the CLI tools were already installed. This caused:
1. Unnecessary reinstallation attempts even when CLIs were already working
2. Long installation times on every click
3. Frontend showing "Failed to install" errors even when backend succeeded
4. Inconsistent behavior compared to Claude CLI installation

### Root Cause
The original implementation blindly attempted installation without checking if the CLI was already available via `which` command. It also used different logic patterns compared to the working Claude CLI implementation.

### Solution Implemented
Updated both Gemini CLI and Qwen CLI installation endpoints in `server/src/api/projects.ts` to follow the same pattern as Claude CLI:

1. **Pre-Installation Check**: Use `wsl.exe -d Ubuntu -u jfranjic bash -l -c "which <cli> 2>/dev/null"` to check if CLI already exists
2. **Skip Installation**: If CLI found and not reinstalling, skip installation and mark as installed
3. **Proper Installation Flow**: Only install if CLI not found or explicitly reinstalling
4. **Error Handling**: Proper error propagation with meaningful messages
5. **Version Detection**: Attempt to get actual version numbers after installation

### Fixed Implementation Pattern
```javascript
// Check if already installed
try {
  const { stdout: checkInstall } = await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -l -c "which <cli> 2>/dev/null"`);
  if (checkInstall && checkInstall.trim().length > 0) {
    logger.info('<CLI> already installed in WSL at: ' + checkInstall.trim());
    
    // If reinstall flag is set, try to update
    if (reinstall) {
      logger.info('Attempting to reinstall <CLI> in WSL...');
      try {
        // Uninstall first, then reinstall
        await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -l -c "npm uninstall -g <package>"`, { timeout: 30000 });
        await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -l -c "npm install -g <package>"`, { timeout: 120000 });
        logger.info('<CLI> reinstalled successfully');
      } catch (updateError) {
        logger.warn('Could not reinstall <CLI>:', updateError);
        throw new HttpError(500, 'InstallationError', 'Failed to reinstall <CLI>');
      }
    } else {
      // Already installed, skip installation
      installSkipped = true;
      logger.info('<CLI> already installed, skipping installation');
    }
  } else {
    throw new Error('<CLI> not installed');
  }
} catch (e) {
  // Not installed, proceed with fresh installation
  logger.info('Installing <CLI> in WSL...');
  // ... installation logic
}
```

### Files Modified
- `server/src/api/projects.ts`: Fixed Gemini CLI and Qwen CLI installation endpoints
- Applied same logic pattern as working Claude CLI implementation

### Testing Results
**Before Fix**:
- ❌ Gemini CLI: Always showed "Failed to install" even when succeeded
- ❌ Qwen CLI: Always showed "Failed to install" even when succeeded
- ❌ Long wait times on every click
- ❌ Frontend/backend inconsistency

**After Fix**:
- ✅ Gemini CLI: Shows "Version: 0.1.18" with Check/Reinstall buttons and command buttons (Gemini, Help, Search, Config)
- ✅ Qwen CLI: Shows "Version: unknown" with Check/Reinstall buttons and command buttons (Qwen, Help, Version)
- ✅ Fast response when already installed (skips installation)
- ✅ Consistent behavior across all CLI tools
- ✅ Proper frontend status updates

### Key Learning
Always implement consistent patterns across similar features. The Claude CLI implementation was working correctly and should have been used as the template for Gemini CLI and Qwen CLI from the beginning. The fix simply aligns all three CLI installations to use the same robust logic.

## Resources
- [Anthropic Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Playwright Documentation](https://playwright.dev/docs)

## Critical Bug Fixes (August 2025)

### CLI Install Button Failures - CRITICAL FIX

**Problem**: CLI installation buttons were showing red "Failed to reinstall [CLI] CLI" errors even when installations were working correctly.

**Root Cause**: React onClick handlers were incorrectly written as `onClick={handleInstallClaude}` instead of `onClick={() => handleInstallClaude()}`, which passed React SyntheticBaseEvent objects as parameters instead of expected boolean values.

**Error**: `TypeError: Converting circular structure to JSON` when API client tried to serialize the event object.

**Critical Fix in `client/src/components/ProjectOverview.tsx`**:
```jsx
// WRONG (CAUSES FAILURE):
<button onClick={handleInstallClaude} disabled={installingClaude}>

// CORRECT (WORKING):
<button onClick={() => handleInstallClaude()} disabled={installingClaude}>
```

**Files Fixed**:
- ProjectOverview.tsx:696 - Claude CLI Install button
- ProjectOverview.tsx:721 - Gemini CLI Install button  
- ProjectOverview.tsx:750 - Qwen CLI Install button

**RULE**: Always use arrow functions for onClick handlers when calling functions with optional parameters.

### MCP Configuration File Missing - CRITICAL FIX

**Problem**: Claude CLI commands failed with "Invalid MCP configuration: MCP config file not found: /home/jfranjic/dev-projects/[project]/.mcp.json"

**Root Cause**: Projects automatically added `--mcp-config` flag to Claude commands but the configuration file was never created.

**Critical Fix in `server/src/api/projects.ts:811-829`**:
```javascript
// Ensure MCP config file exists before using it
const mcpConfigPath = `${wslPath}/.mcp.json`;
const defaultMcpConfig = JSON.stringify({
  mcpServers: {},
  globalShortcut: "CommandOrControl+Shift+Space",
  mcpContext: "Use available MCP servers when relevant to the task",
  commandHints: true
});
const ensureMcpCommand = `wsl.exe -d Ubuntu -u jfranjic bash -c "if [ ! -f '${mcpConfigPath}' ]; then echo '${defaultMcpConfig}' > '${mcpConfigPath}'; fi"`;

try {
  await execAsync(ensureMcpCommand);
  enhancedCommand = `claude --mcp-config "${wslPath}/.mcp.json" ${command.substring(6)}`.trim();
} catch (error) {
  logger.warn(`Failed to create MCP config file: ${error}`);
  enhancedCommand = command; // Continue without MCP config
}
```

### Docker Compose File Missing for Blank Projects - CRITICAL FIX

**Problem**: New blank projects failed to start with "no such file or directory: docker-compose.wsl.yml"

**Root Cause**: 
1. Docker service expected location-specific files (`docker-compose.wsl.yml`) 
2. Blank template only had generic `docker-compose.yml`
3. Template manifest didn't specify compose file

**Critical Fixes**:

1. **Docker Service Fallback Logic** (`server/src/services/docker-service.ts:273-333`):
```javascript
// Added fallback logic to retry with docker-compose.yml if location-specific file fails
if (stderr.includes('no such file or directory') && stderr.includes(composeFileName) && 
    composeFileName !== 'docker-compose.yml') {
  logger.warn(`Location-specific compose file not found, retrying with generic docker-compose.yml`);
  // ... retry logic with fallback file
}
```

2. **Template Manifest Update** (`templates/blank/manifest.yaml:21,27`):
```yaml
locations:
  wsl:
    files:
      - "README.md"
      - ".gitignore" 
      - "src/.gitkeep"
    compose: "docker-compose.yml"  # ADDED
  windows:
    files:
      - "README.md"
      - ".gitignore"
      - "src/.gitkeep"
    compose: "docker-compose.yml"  # ADDED
```

3. **Template Variable Fix** (`templates/blank/docker-compose.yml`):
```yaml
# WRONG:
container_name: {{projectSlug}}-workspace

# CORRECT:
container_name: {{SLUG}}-workspace
```

## Claude CLI Button Integration Solution

### Problem
Claude CLI buttons in the browser-based Dev Launcher needed to open Windows Terminal in the correct directory and execute commands.

### Solution
We implemented a system endpoint that handles command execution from the browser:

1. **Backend API Endpoint** (`server/src/api/system.ts`):
   - POST `/api/system/execute` endpoint accepts command and args
   - Security: Only allows whitelisted commands (wt.exe, explorer.exe, code, etc.)
   - For Windows Terminal: Uses `start` command wrapper to bring window to foreground
   - Example: `start "" "wt.exe" "-d" "C:\\path" "cmd.exe" "/k" "claude"`

2. **Frontend Integration** (`client/src/components/TopBar.tsx`):
   ```typescript
   const executeClaudeCommand = async (claudeArgs: string = '') => {
     const devLauncherPath = 'C:\\Users\\jfran\\Documents\\dev-launcher';
     const claudeCommand = claudeArgs ? `claude ${claudeArgs}` : 'claude';
     const wtCommand = 'wt.exe';
     const wtArgs = ['-d', devLauncherPath, 'cmd.exe', '/k', claudeCommand];
     await executeCommand(wtCommand, wtArgs);
   };
   ```

3. **Key Implementation Details**:
   - All Claude commands execute in the dev-launcher root directory
   - Terminal opens in foreground (not blinking in taskbar)
   - Commands stay open with `/k` flag (vs `/c` which would close)
   - VS Code button opens project in editor: `code C:\\path\\to\\project`

### Available Buttons
- **Claude**: Opens terminal and runs `claude`
- **Continue**: Opens terminal and runs `claude -c`
- **Bypass**: Opens terminal and runs `claude --dangerously-skip-permissions`
- **Bypass+Continue**: Opens terminal and runs `claude --dangerously-skip-permissions -c`
- **MCP List**: Opens terminal and runs `claude mcp list`
- **Terminal**: Opens Windows Terminal in dev-launcher directory
- **VS Code**: Opens VS Code in dev-launcher project

This solution allows browser-based control of desktop applications while maintaining security through command whitelisting.

## Terminal Button Fix for Projects

### Problem Encountered (August 2025)
Terminal button in ProjectOverview was throwing "Failed to open terminal" error with "Converting circular structure to JSON" in console.

### Root Cause
The onClick handler was incorrectly written as `onClick={handleOpenTerminal}` which passes the React SyntheticEvent object as the first parameter instead of undefined/empty string.

### Solution
Always use arrow function for onClick handlers when calling functions with optional parameters:

**WRONG:**
```jsx
<button onClick={handleOpenTerminal}>Terminal</button>
// This passes event object to handleOpenTerminal(event)
```

**CORRECT:**
```jsx
<button onClick={() => handleOpenTerminal()}>Terminal</button>
// This calls handleOpenTerminal() with no arguments
```

### Important Notes for Terminal Commands
1. **Dev Launcher must run locally** (not in Docker) for terminal commands to work
   - Use `npm run dev` instead of `docker compose up`
   - Docker containers (Linux) cannot execute Windows programs like wt.exe

2. **WSL Terminal Command Format:**
   ```javascript
   // For opening terminal without command
   wtCommand = `wt.exe -p Ubuntu -- wsl.exe -d Ubuntu -u jfranjic --cd "${wslPath}"`;
   
   // For commands that need output visible (MCP, version, help)
   wtCommand = `wt.exe -p Ubuntu -- wsl.exe -d Ubuntu -u jfranjic --cd "${wslPath}" bash -lic "${command} && bash"`;
   ```

3. **The `&& bash` pattern is CRITICAL** - keeps terminal open after command completes

### File Locations
- Frontend handler: `client/src/components/ProjectOverview.tsx`
- Backend endpoint: `server/src/api/projects.ts` (POST `/projects/:slug/open/terminal`)
- API client: `client/src/lib/api.ts`

## MCP Server Installation Fix (Playwright & Others)

### Problem Encountered (August 2025)
MCP servers like Playwright couldn't be installed due to:
1. npm permission errors when trying to install globally (`npm install -g`)
2. Claude CLI not recognizing servers added to config.json
3. Installation failing with EACCES errors in `/usr/lib/node_modules/`

### Root Causes
1. **Permission Issue**: npm global install requires sudo/root permissions which we don't have in WSL user context
2. **Config Issue**: Claude CLI doesn't use `mcpServers` in config.json - must use `claude mcp add` command
3. **NPX vs Install**: For npm packages, npx can run without installation

### Solution Implemented

#### 1. Use NPX Instead of Global Install
For npm-based MCP servers that support npx (like Playwright):
```javascript
// In mcp-installer.ts
if (server.configTemplate?.command === 'npx') {
  logger.info(`${server.id} uses npx - no installation needed, will run on demand`);
  await this.configureClaudeForWSL(server, projectPath);
  return;
}
```

#### 2. Use `claude mcp add` Command
Instead of writing to config.json, use Claude's built-in command:
```javascript
// Build the claude mcp add command
const serverId = server.id.replace('-mcp', '');
const { command, args = [] } = server.configTemplate;
let addCommand = `claude mcp add -s user ${serverId} ${command}`;
if (args.length > 0) {
  addCommand += ` ${args.join(' ')}`;
}
// Example: claude mcp add -s user playwright npx @playwright/mcp@latest
```

#### 3. Remove Using `claude mcp remove`
```javascript
const removeCommand = `claude mcp remove ${serverName} -s user`;
```

### Important Configuration
In `server/src/config/mcp-servers.json`:
```json
{
  "id": "playwright-mcp",
  "installCommand": "npm install -g @playwright/mcp",  // Not used for npx
  "configTemplate": {
    "command": "npx",
    "args": ["@playwright/mcp@latest"]  // This is what actually runs
  }
}
```

### Testing MCP Installation
1. Click Install on Playwright MCP
2. Check with `claude mcp list` - should show: `playwright: npx @playwright/mcp@latest`
3. Remove works with `claude mcp remove playwright -s user`

### Key Files
- `server/src/utils/mcp-installer.ts` - Main installer logic
- `server/src/api/mcp.ts` - API endpoints for install/remove
- `server/src/config/mcp-servers.json` - MCP server configurations
- `client/src/components/McpTab.tsx` - Frontend UI

### Lessons Learned
1. Always use `claude mcp add/remove` commands, not direct config manipulation
2. For npm packages, prefer npx over global installation to avoid permissions
3. Test with `claude mcp list` to verify installation
4. Function names are case-sensitive (`testMCPServer` not `testMcpServer`)

## MCP Server Installation - Semgrep

### Semgrep MCP Installation Process
Semgrep MCP requires an API token for authentication. Here's how it's installed:

1. **Frontend UI Flow**:
   - User clicks "Install" on Semgrep MCP
   - Modal appears requesting API token
   - User enters token (e.g., `30cefebffc94135a95cc172d0f8966fe2a0edec32b356691bee9b96a99226fde`)
   - Frontend sends token with install request

2. **Backend Installation**:
   ```bash
   # Install semgrep-mcp Python package
   wsl.exe -d Ubuntu -u jfranjic bash -l -c "pip3 install --user semgrep-mcp"
   
   # Configure Claude CLI with token
   wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd /project/path && export SEMGREP_APP_TOKEN='your-token' && claude mcp add -s user semgrep semgrep-mcp --env SEMGREP_APP_TOKEN='your-token'"
   ```

3. **Manual Installation (if needed)**:
   ```bash
   # Install package
   pip3 install --user semgrep-mcp
   
   # Login with token
   SEMGREP_APP_TOKEN=your-token-here semgrep login
   
   # Add to Claude
   claude mcp add -s user semgrep semgrep-mcp --env SEMGREP_APP_TOKEN="your-token"
   ```

4. **Configuration in mcp-servers.json**:
   ```json
   {
     "id": "semgrep-mcp",
     "requiresApiToken": true,
     "apiTokenEnvVar": "SEMGREP_APP_TOKEN",
     "apiTokenPlaceholder": "Enter your Semgrep API token",
     "configTemplate": {
       "command": "semgrep-mcp",
       "args": [],
       "env": {
         "SEMGREP_APP_TOKEN": "${SEMGREP_APP_TOKEN}"
       }
     }
   }
   ```

5. **How the API Token Modal Works**:
   - Component: `client/src/components/ApiTokenModal.tsx`
   - Triggered when `requiresApiToken: true` in server config
   - Passes token to backend via `apiToken` parameter
   - Backend uses token with `--env` flag in `claude mcp add` command

### API Token Implementation Details
The system now includes full API token support:
- **Frontend**: Modal dialog for token input (`ApiTokenModal.tsx`)
- **Backend**: Modified `McpInstaller.configureClaudeForWSL()` to handle tokens
- **Configuration**: Added `requiresApiToken`, `apiTokenEnvVar`, `apiTokenPlaceholder` fields
- **Supported Servers**: Semgrep MCP, Exa MCP (any server with `requiresApiToken: true`)

## MCP Server Installation - Exa

### Exa MCP Installation Process (WORKING SOLUTION)
Exa MCP requires an API key for authentication. Here's the exact working process:

1. **Frontend UI Flow**:
   - User clicks "Install" on Exa MCP
   - Modal appears requesting API key
   - User enters key (e.g., `a84eed61-c9bb-4811-b834-efff0a99967b`)
   - Frontend sends key with install request

2. **Backend Installation (TESTED AND WORKING)**:
   ```bash
   # IMPORTANT: Must use -- separator before npx to prevent claude from parsing -y flag
   wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd /project/path && claude mcp add -s user exa --env EXA_API_KEY=\"your-key\" -- npx -y exa-mcp-server"
   ```

3. **Manual Installation (CONFIRMED WORKING)**:
   ```bash
   # Working command with test token
   claude mcp add -s user exa --env EXA_API_KEY="a84eed61-c9bb-4811-b834-efff0a99967b" -- npx -y exa-mcp-server
   
   # Verify installation
   claude mcp list
   # Should show: exa: npx -y exa-mcp-server
   
   # Remove if needed
   claude mcp remove exa
   ```

4. **Critical Implementation Detail**:
   The `--` separator is ESSENTIAL when using npx with flags. Without it, claude tries to parse `-y` as its own flag and fails with "error: unknown option '-y'".

   **Code fix in mcp-installer.ts**:
   ```javascript
   // For npx with args, we need -- separator to prevent claude from parsing the args
   if (command === 'npx' && args.length > 0) {
     addCommand += ` -- ${command} ${args.join(' ')}`;
   } else {
     addCommand += ` ${command}`;
     if (args.length > 0) {
       addCommand += ` ${args.join(' ')}`;
     }
   }
   ```

4. **Configuration in mcp-servers.json**:
   ```json
   {
     "id": "exa-mcp",
     "requiresApiToken": true,
     "apiTokenEnvVar": "EXA_API_KEY",
     "apiTokenPlaceholder": "Enter your Exa API key",
     "configTemplate": {
       "command": "npx",
       "args": ["-y", "exa-mcp-server"],
       "env": {
         "EXA_API_KEY": "${EXA_API_KEY}"
       }
     }
   }
   ```

5. **Available Tools in Exa MCP**:
   - `web_search_exa` - Real-time web searches
   - `company_research` - Company information gathering
   - `crawling` - Extract content from URLs
   - `linkedin_search` - Search LinkedIn

### Test Tokens for Development
- **Semgrep**: `30cefebffc94135a95cc172d0f8966fe2a0edec32b356691bee9b96a99226fde`
- **Exa**: `a84eed61-c9bb-4811-b834-efff0a99967b`
- **Jina**: `jina_7fcf11ec48c746328419645f4b194899NKEjcedHwROCbhniaTHNdnerWuO-`

## MCP Server Installation - Jina (CONFIRMED WORKING)

### Jina MCP Installation Process
Jina MCP Tools provides neural search and AI capabilities. Successfully tested and working!

1. **Frontend UI Flow (TESTED & WORKING)**:
   - User clicks "Install" on Jina MCP Tools
   - Modal appears requesting API key
   - User enters key: `jina_7fcf11ec48c746328419645f4b194899NKEjcedHwROCbhniaTHNdnerWuO-`
   - Frontend sends key with install request
   - Installation completes successfully

2. **Backend Installation Process (EXACT WORKING COMMAND)**:
   ```bash
   # Uses npx - no global installation needed, no permission issues
   # Command executed by backend:
   wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd /project/path && claude mcp add -s user jina --env JINA_API_KEY=\"your-key\" npx jina-mcp-tools"
   ```

3. **Manual Installation (TESTED WITH ACTUAL TOKEN)**:
   ```bash
   # Working command with production token
   claude mcp add -s user jina --env JINA_API_KEY="jina_7fcf11ec48c746328419645f4b194899NKEjcedHwROCbhniaTHNdnerWuO-" npx jina-mcp-tools
   
   # Verify installation
   claude mcp list
   # Output shows: jina: npx jina-mcp-tools ✓
   
   # Remove if needed
   claude mcp remove jina
   ```

4. **Implementation Details**:
   - **No -- separator needed** for Jina (unlike Exa which needs it for npx -y flag)
   - Uses simple npx command: `npx jina-mcp-tools`
   - API token properly passed via `--env JINA_API_KEY`

4. **Configuration in mcp-servers.json**:
   ```json
   {
     "id": "jina-mcp",
     "requiresApiToken": true,
     "apiTokenEnvVar": "JINA_API_KEY",
     "apiTokenPlaceholder": "Enter your Jina API key",
     "configTemplate": {
       "command": "npx",
       "args": ["jina-mcp-tools"],
       "env": {
         "JINA_API_KEY": "${JINA_API_KEY}"
       }
     }
   }
   ```

5. **Available Features**:
   - Web content reading and extraction
   - Neural search capabilities
   - Content summarization
   - API key is optional but provides higher rate limits

## MCP Server Installation - Ref Tools (CONFIRMED WORKING)

### Ref Tools MCP Installation Process
Ref Tools MCP provides token-efficient documentation search to prevent AI hallucinations. Successfully tested and working!

1. **Frontend UI Flow (TESTED & WORKING)**:
   - User clicks "Install" on Ref Tools MCP
   - Modal appears requesting API key
   - User enters key from ref.tools
   - Frontend sends key with install request
   - Installation completes successfully

2. **Backend Installation Process (EXACT WORKING COMMAND)**:
   ```bash
   # Uses npx with @latest tag - no global installation needed
   # Command executed by backend:
   wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd /project/path && claude mcp add -s user ref-tools --env REF_API_KEY=\"your-key\" npx ref-tools-mcp@latest"
   ```

3. **Manual Installation (CONFIRMED WORKING)**:
   ```bash
   # Working command with API key
   claude mcp add -s user ref-tools --env REF_API_KEY="your-ref-api-key" npx ref-tools-mcp@latest
   
   # Verify installation
   claude mcp list
   # Output shows: ref-tools: npx ref-tools-mcp@latest ✓
   
   # Remove if needed
   claude mcp remove ref-tools
   ```

4. **Configuration in mcp-servers.json**:
   ```json
   {
     "id": "ref-tools-mcp",
     "requiresApiToken": true,
     "apiTokenEnvVar": "REF_API_KEY",
     "apiTokenPlaceholder": "Enter your Ref API key (from ref.tools)",
     "configTemplate": {
       "command": "npx",
       "args": ["ref-tools-mcp@latest"],
       "env": {
         "REF_API_KEY": "${REF_API_KEY}"
       }
     }
   }
   ```

5. **Key Features**:
   - Token-efficient documentation search (e.g., Figma API is 80k tokens but Ref finds only the needed 200)
   - Prevents AI hallucinations with accurate documentation
   - Access to thousands of documentation sites and GitHub repos
   - Smart chunking for minimal context usage
   - Get API key from [ref.tools](https://ref.tools)

6. **Implementation Notes**:
   - Uses `@latest` tag to always get newest version
   - No `--` separator needed (simple npx command)
   - API key properly passed via `--env REF_API_KEY`

## MCP Server Installation - Docker Container Manager (CONFIRMED WORKING)

### Docker Container Manager Installation Process
Docker Container Manager by QuantGeekDev enables Docker container and compose stack management through Claude. Successfully tested and working!

1. **Prerequisites**:
   - Python and pip installed
   - Docker Desktop or Docker Engine running
   - `uv` tool installed: `pip install uv` (usually already installed)

2. **Backend Installation (EXACT WORKING COMMAND)**:
   ```bash
   # Uses uvx (Python package runner) - no global installation needed
   # Command executed by backend:
   wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd /project/path && claude mcp add -s user docker uvx docker-mcp"
   ```

3. **Manual Installation (CONFIRMED WORKING)**:
   ```bash
   # Working command
   claude mcp add -s user docker uvx docker-mcp
   
   # Verify installation
   claude mcp list
   # Output shows: docker: uvx docker-mcp ✓
   
   # Remove if needed
   claude mcp remove docker
   ```

4. **Configuration in mcp-servers.json**:
   ```json
   {
     "id": "docker-mcp",
     "name": "Docker Container Manager",
     "configTemplate": {
       "command": "uvx",
       "args": ["docker-mcp"]
     }
   }
   ```

5. **Available Features**:
   - Create standalone Docker containers with specified images, names, ports
   - Deploy Docker Compose stacks with YAML configuration
   - Retrieve logs from specific containers
   - List all Docker containers and monitor status
   - Manage container lifecycle (start, stop, restart, remove)

6. **Implementation Notes**:
   - Uses Python's `uvx` tool (ultraviolet package runner)
   - No API token required
   - Requires Docker socket access (`/var/run/docker.sock`)
   - Created by Alex Andru (@QuantGeekDev)

## Docker MCP Gateway (Official Docker) - CONFIRMED WORKING

### Important: Different from Regular MCP Servers
Docker MCP Gateway is NOT a standalone MCP server like others. It's a Docker Desktop extension/CLI plugin that provides infrastructure for running other MCP servers in containers.

### Installation Requirements
1. **Docker Desktop** must be installed and running ✅
2. **MCP Toolkit** - Now integrated in Docker Desktop (newer versions) ✅
3. **Docker MCP CLI plugin** - Comes with Docker Desktop ✅

### Installation Process (TESTED & WORKING)

1. **Prerequisites Check**:
   ```bash
   # Check Docker Desktop is running
   docker version
   # Should show: Server: Docker Desktop 4.44.0 or newer
   
   # Check MCP plugin is available
   docker mcp --help
   # Shows available commands: catalog, client, config, gateway, etc.
   ```

2. **Backend Installation (EXACT WORKING COMMAND)**:
   ```bash
   # Add Docker MCP Gateway to Claude
   wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd /project/path && claude mcp add -s user docker-gateway docker mcp gateway run"
   ```

3. **Manual Installation (CONFIRMED WORKING)**:
   ```bash
   # Add to Claude
   claude mcp add -s user docker-gateway docker mcp gateway run
   
   # Verify installation
   claude mcp list
   # Output shows: docker-gateway: docker mcp gateway run ✓
   
   # Remove if needed
   claude mcp remove docker-gateway
   ```

4. **Available Docker MCP Commands**:
   ```bash
   # Check catalog
   docker mcp catalog ls
   # Output: docker-mcp: Docker MCP Catalog
   
   # List enabled servers
   docker mcp server list
   # Initially shows: No server is enabled
   
   # Manage secrets
   docker mcp secret list
   
   # Run gateway (what Claude uses)
   docker mcp gateway run
   ```

### Known Issues with Docker MCP Gateway
1. **Connection Issues in Claude Code on WSL2**:
   - Gateway often shows "Failed to connect" in Claude Code
   - This is a known issue documented in Docker for Windows GitHub issues
   - Works better with Claude Desktop on Windows (not Claude Code)

2. **Missing Secrets Error**:
   - Gateway expects Docker secrets like `dockerhub.pat_token` and `github.personal_access_token`
   - These need to be configured in Docker Desktop first
   - Without them, gateway starts but may have limited functionality

3. **Alternative: Use Individual MCP Servers**:
   - Instead of gateway, install MCP servers directly (like we did with others)
   - More reliable for development environments
   - Gateway is better for production/enterprise use

### Key Differences from Other MCP Servers
- **Not installed via npm/pip/npx** - it's a Docker Desktop feature
- **Requires Docker Desktop running** - won't work with just Docker Engine
- **Better suited for production** - has overhead for development use
- **Acts as infrastructure** - hosts other MCP servers in containers
- **Enterprise features** - OAuth, secrets management, monitoring

## Docker MCP Servers Summary

We have two Docker-related MCP servers for different purposes:

1. **Docker Container Manager** (QuantGeekDev) ✅:
   - For managing Docker containers through Claude
   - Create, deploy, monitor containers
   - Uses Python/uvx
   - Installed as regular MCP server

2. **Docker MCP Gateway** (Docker Inc.):
   - Enterprise gateway for running MCP servers in secure containers
   - Centralized management of multiple MCP servers
   - Official Docker solution for production
   - Requires Docker Desktop with MCP Toolkit

## WordPress Template

The WordPress template creates a full development stack with:
- **Nginx**: Web server with PHP-FPM support
- **WordPress**: Latest WordPress with PHP 8.2-FPM
- **MariaDB**: Database server (v10.11)
- **phpMyAdmin**: Database management UI
- **Mailpit**: Email testing with SMTP capture
- **WP-CLI**: WordPress command-line tools

### Template Configuration
- Location: `templates/wordpress/`
- Compose files: `docker-compose.wsl.yml` and `docker-compose.windows.yml`
- Manifest: `manifest.yaml` with port and variable definitions

### Default Ports
- **HTTP**: 8080 (WordPress site)
- **Database**: 3306 (MariaDB)
- **phpMyAdmin**: 8081 (Database UI)
- **Mailpit UI**: 8025 (Email viewer)
- **Mailpit SMTP**: 1025 (SMTP server)

### Default Credentials
- **WordPress Admin**: admin / admin123
- **Database**: wordpress / wordpress123
- **Database Root**: rootpassword123

### Template Variables
All variables are configurable during project creation:
- `WP_TITLE`: Site title
- `WP_ADMIN_USER`: Admin username
- `WP_ADMIN_PASSWORD`: Admin password
- `WP_ADMIN_EMAIL`: Admin email
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_ROOT_PASSWORD`: Root password

### Quick Links
When WordPress project is running, quick links are available:
- Site: `http://localhost:{HTTP_PORT}`
- Admin: `http://localhost:{HTTP_PORT}/wp-admin`
- phpMyAdmin: `http://localhost:{PHPMYADMIN_PORT}`
- Mailpit: `http://localhost:{MAILPIT_UI_PORT}`

### Fixed Issues
- **404 error on project start**: Changed endpoint from `/up` to `/start` in NewProjectModal.tsx
- **WordPress template working**: All services configured with Docker Compose

## Contact & Support
- Report issues in project repository
- Follow conventional commits for contributions
- Run all tests before submitting PRs