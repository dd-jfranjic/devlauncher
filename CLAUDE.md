# DevLauncher by Datadox - Project Guidelines

## Project Overview
DevLauncher by Datadox is an Electron + React + TypeScript desktop application that serves as the ultimate development environment starter kit. It eliminates the friction of starting new projects by providing one-click setup with Docker, Claude Code AI assistant, and multiple framework integrations. Currently focused on WordPress, it's designed to expand to other platforms, making it your go-to tool for any project kickstart with "Claude Code on steroids".

## CRITICAL: Windows PowerShell Environment
This project runs on Windows and **MUST use PowerShell** for all shell operations. We are NOT using bash, zsh, or cmd.exe unless absolutely necessary. All scripts and commands should be PowerShell-compatible.

## Complete Project Creation Workflow

### 1. Create New WordPress Project
1. User clicks "New Project" button on homepage
2. Enters project name (sanitized automatically)
3. Optionally enables Claude Code and/or WordPress MCP
4. Clicks "Create Project"
5. System creates Docker containers and starts WordPress

### 2. Install WordPress (Blue Download Icon)
After Docker starts, click the blue download icon to install WordPress:
```bash
docker exec PROJECT_wordpress wp core install \
  --url="http://localhost:PORT" \
  --title="PROJECT_NAME" \
  --admin_user="admin" \
  --admin_password="password" \
  --admin_email="admin@example.com"
```

### 3. Install Claude Code (Purple Terminal Icon) 
Click the purple terminal icon to install Claude Code locally:
```powershell
cd 'C:\path\to\project\app\public'
npm init -y
npm install @anthropic-ai/claude-code
npx claude
```

### 4. Setup WordPress MCP (If Enabled)
Follow the workflow detailed in "WordPress MCP Complete Installation Workflow" section below

## Critical Rules - MUST FOLLOW

### Before Making ANY Changes
1. **ALWAYS read the existing code first** - Use Read tool to understand current implementation
2. **NEVER guess file paths** - Always verify paths exist with LS or Read tools
3. **TEST your changes** - Run `npm run dev` to verify changes work
4. **One change at a time** - Don't modify multiple unrelated things in single edit

### Code Modification Rules
1. **Preserve existing functionality** - Don't break working features when adding new ones
2. **Follow existing patterns** - Match the code style and structure already in place
3. **No unnecessary changes** - Only modify what's needed for the requested feature
4. **Check for duplicates** - Ensure you're not creating duplicate functions or imports

## Project Structure
```
start-project-gui/
├── dev-bundle/
│   ├── launcher-app/         # Main Electron app
│   │   ├── electron/        # Electron main process
│   │   ├── src/            # React frontend
│   │   │   ├── components/ # React components
│   │   │   ├── pages/     # Page components
│   │   │   └── types/     # TypeScript types
│   │   └── package.json   # Dependencies
│   └── templates/         # Project templates
│       └── wordpress/     # WordPress Docker template
```

## Common Commands
- **Start dev server**: `cd dev-bundle/launcher-app && npm run dev`
- **Build app**: `cd dev-bundle/launcher-app && npm run build`
- **Run Electron**: `cd dev-bundle/launcher-app && npm run electron`
- **Type check**: `cd dev-bundle/launcher-app && npm run type-check`

## Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Electron
- **Styling**: Tailwind CSS + Heroicons
- **State**: React Hooks + Electron Store
- **Docker**: Docker Compose for WordPress

## Code Style Guidelines

### TypeScript/React
- Use functional components with hooks
- Define types for all props using interfaces
- Use async/await for asynchronous operations
- Handle errors with try/catch blocks
- Use meaningful variable names

### File Naming
- React components: PascalCase (e.g., `ProjectCard.tsx`)
- Utilities: camelCase (e.g., `helpers.ts`)
- Templates: kebab-case (e.g., `install-wp.bat`)

### Component Structure
```typescript
import { dependencies } from 'packages'
import { localComponents } from '../components'
import { types } from '../types'

interface ComponentProps {
  // Define props
}

export default function ComponentName({ props }: ComponentProps) {
  // Hooks first
  const [state, setState] = useState()
  
  // Event handlers
  const handleEvent = async () => {
    try {
      // Implementation
    } catch (error) {
      console.error('Descriptive error:', error)
    }
  }
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

## Windows-Specific Considerations

### IMPORTANT: PowerShell is Our Standard
**ALWAYS use PowerShell for Windows operations** - NOT cmd.exe unless absolutely necessary!

### PowerShell Command Execution from Electron
```javascript
// For opening PowerShell window with user interaction
await window.electronAPI.runCommand('cmd', [
  '/c',
  'start',
  'powershell',
  '-NoExit',
  '-Command',
  commandString
])

// For simple file operations, use CMD directly (more reliable)
await window.electronAPI.runCommand('cmd', [
  '/c', 
  `if not exist "${path}" mkdir "${path}"`
])

// IMPORTANT: Direct PowerShell execution doesn't work properly with our current Electron setup
// Always use 'cmd /c' to launch PowerShell or use CMD commands when possible
```

### PowerShell Best Practices
1. **Path Handling**:
   ```powershell
   # Always quote paths with spaces
   cd 'C:\Program Files\MyApp'
   
   # Use double backslashes in JavaScript strings
   const path = 'C:\\Users\\username\\Documents'
   
   # Or use forward slashes (PowerShell accepts both)
   cd C:/Users/username/Documents
   ```

2. **Variable Usage**:
   ```powershell
   $projectPath = 'C:\Projects\MyProject'
   Set-Location $projectPath
   ```

3. **Command Chaining**:
   ```powershell
   # Use semicolons to chain commands
   cd 'C:\path'; Write-Host 'Changed directory'; ls
   ```

4. **Error Handling**:
   ```powershell
   if (Test-Path 'file.txt') { 
     Remove-Item 'file.txt' 
   } else { 
     Write-Host 'File not found' -ForegroundColor Red 
   }
   ```

### PowerShell Cmdlets We Use
- `Write-Host`: Display output with colors
  ```powershell
  Write-Host 'Success!' -ForegroundColor Green
  Write-Host 'Error!' -ForegroundColor Red
  Write-Host 'Warning!' -ForegroundColor Yellow
  Write-Host 'Info' -ForegroundColor Cyan
  Write-Host 'Debug' -ForegroundColor Magenta
  ```
- `Test-Path`: Check if file/folder exists
  ```powershell
  if (Test-Path 'C:\folder\file.txt') { "exists" } else { "not found" }
  ```
- `Copy-Item`: Copy files/folders
  ```powershell
  Copy-Item 'source' 'destination' -Recurse -Force
  ```
- `Remove-Item`: Delete files/folders
  ```powershell
  Remove-Item 'path' -Recurse -Force -ErrorAction SilentlyContinue
  ```
- `Set-Location` (cd): Change directory
- `Get-ChildItem` (ls): List directory contents
- `New-Item`: Create files/folders
  ```powershell
  New-Item -ItemType Directory -Path 'C:\newfolder' -Force
  ```
- `Read-Host`: Get user input
  ```powershell
  $answer = Read-Host 'Press Enter to continue'
  ```

### PowerShell Execution Examples for Our Project
```javascript
// Install WordPress MCP
const psCommand = [
  `cd '${publicPath}'`,
  `if (-not (Test-Path 'wordpress-mcp')) { Write-Host 'ERROR: Source not found!' -ForegroundColor Red; exit }`,
  `Copy-Item 'wordpress-mcp' 'wp-content/plugins/' -Recurse -Force`,
  `Write-Host 'Plugin copied successfully!' -ForegroundColor Green`
].join('; ')

// Execute via Electron
await window.electronAPI.runCommand('cmd', [
  '/c', 'start', 'powershell', '-NoExit', '-Command', psCommand
])
```

### Docker on Windows
- Ensure Docker Desktop is running
- Use named volumes for better performance
- Windows paths in Docker need forward slashes

## Windows Environment Details
- **OS**: Windows 10/11
- **Shell**: PowerShell 5.1+ (NOT PowerShell Core/7)
- **Docker**: Docker Desktop for Windows
- **Node.js**: v18+ with npm
- **Required Tools**: Git, Docker Desktop, VS Code

## Common Issues and Solutions

### PowerShell Execution
**Problem**: Multi-line scripts don't execute properly
**Solution**: Join commands with semicolons:
```javascript
const commands = [
  `cd '${path}'`,
  `Write-Host 'Starting process...' -ForegroundColor Green`,
  `Copy-Item 'source' 'destination' -Recurse`
].join('; ')
```

### PowerShell String Escaping
**Problem**: Quotes in PowerShell commands break execution
**Solution**: Use proper escaping:
```javascript
// For paths with spaces - use single quotes in PowerShell
const psCommand = `cd '${projectPath}'`

// For complex strings - escape properly
const message = `Write-Host "Project: ${name}" -ForegroundColor Green`
```

### CORS Errors
**Problem**: Fetch requests blocked by CORS
**Solution**: Use `mode: 'no-cors'` for local checks:
```javascript
fetch(url, { mode: 'no-cors' })
```

### File Not Found
**Problem**: Template files not found
**Solution**: Use absolute paths from `__dirname`:
```javascript
path.join(__dirname, '../../templates/wordpress')
```

## Testing Checklist
Before committing changes:
- [ ] Run `npm run dev` and test the feature
- [ ] Check browser console for errors
- [ ] Test all affected functionality
- [ ] Verify Docker commands work
- [ ] Test on fresh project creation

## WordPress Integration

### CRITICAL: Claude Code Installation Location
**For WordPress projects, Claude Code MUST be installed in `app/public` directory!**

```
project-root/
├── app/
│   └── public/     ← Claude Code runs from HERE
│       ├── .claude/    ← Configuration directory
│       └── [WordPress files]
```

**Why this matters:**
- Claude needs to be in WordPress root to access files
- MCP integrations expect WordPress context
- All paths are relative to WordPress directory

**Always start Claude from:**
```powershell
cd C:\path\to\project\app\public
claude
```

See [WORDPRESS-CLAUDE-GUIDE.md](WORDPRESS-CLAUDE-GUIDE.md) for detailed instructions.

### Docker Services
- WordPress: Port from project config (10000-15000 range)
- MySQL: Custom port per project
- phpMyAdmin: For database management
- Mailhog: SMTP on port 1025

### WordPress Multi-URL Support
**WordPress now automatically supports multiple access URLs:**
- `http://localhost:{port}` - For local browser access
- `http://host.docker.internal:{port}` - For Docker MCP tools (Puppeteer/Playwright)
- `http://{project_name}_wordpress` - For container-to-container communication

This is achieved through dynamic URL configuration in `WORDPRESS_CONFIG_EXTRA` that detects the requesting host and adapts accordingly. No manual database changes needed!

### WordPress MCP Complete Installation Workflow

#### Overview
WordPress MCP integration allows Claude Code to interact with your WordPress site. The workflow involves these steps:

#### Step 1: Build WordPress MCP from Source (Puzzle Icon - PuzzlePieceIcon)
Click the indigo puzzle icon to build WordPress MCP:
```powershell
cd 'C:\path\to\project\app\public'
git clone https://github.com/Automattic/wordpress-mcp.git
cd wordpress-mcp
composer install --no-dev
npm install
npm run build
cd ..
```
**Result**: Creates `wordpress-mcp` folder with built plugin

#### Step 2: Copy Plugin Files (Green Folder Icon - FolderIcon)  
Click the green folder icon to copy ONLY production files:
```powershell
# Copies only necessary files:
# - wordpress-mcp.php (main plugin file)
# - includes/ (PHP classes)
# - vendor/ (Composer dependencies)
# - build/ (production JS)
# - docs/ (documentation)
# SKIPS: src/, package.json, node_modules/
```
**Result**: Plugin files copied to `wp-content/plugins/wordpress-mcp`

#### Step 3: Install Composer Dependencies (Cyan Cube Icon - CubeIcon) [OPTIONAL]
**Only needed if vendor/ folder is missing!** Click cyan cube icon if needed:
```bash
docker exec PROJECT_wordpress composer install --no-dev --working-dir=/var/www/html/wp-content/plugins/wordpress-mcp
```

#### Step 4: Manual Plugin Activation & Token Generation
1. Open WordPress Admin (http://localhost:PORT/wp-admin)
2. Login: admin / password
3. Navigate to **Plugins** → Find "WordPress MCP" → Click **Activate**
4. Go to **Settings** → **WordPress MCP**
5. Click **Generate API Token**
6. **Copy the JWT token** (save it temporarily)

#### Step 5: Configure Claude Code (Yellow Key Icon - KeyIcon)
Click the yellow key icon and paste your JWT token when prompted:
```powershell
# Automatically executes:
claude mcp add --transport http wordpress-mcp http://localhost:PORT/wp-json/wp/v2/wpmcp/streamable --header "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Result**: Claude Code can now interact with WordPress!

### Key Implementation Details

#### CRITICAL FIX: PowerShell Command Execution
When executing PowerShell commands through Electron's CMD wrapper, avoid PowerShell-specific cmdlets:
- ❌ **NEVER use**: `| Out-Null` or `| Out-String` 
- ✅ **INSTEAD use**: `$null = Command` to suppress output
- This prevents "Out-Null is not recognized" errors when CMD tries to parse PowerShell commands

#### handleCopyMCPPlugin Implementation
```powershell
# CRITICAL: This line was fixed to avoid Out-Null error
`$null = New-Item -ItemType Directory -Path $pluginPath -Force`,
```

#### handleConfigureMCPToken Implementation  
Uses PowerShell script (`configure-mcp-correct.ps1`) that:
1. Prompts for JWT token using `Read-Host`
2. Changes to project directory
3. Removes any existing wordpress-mcp configuration
4. Executes `claude mcp add` with proper parameters:
```powershell
claude mcp add --transport http wordpress-mcp $wpUrl --header "Authorization: Bearer $token"
```

### Workflow Success Indicators
- ✅ Step 1: `wordpress-mcp` folder exists in `app/public`
- ✅ Step 2: Plugin folder exists in `wp-content/plugins/wordpress-mcp`
- ✅ Step 3: `vendor` folder exists in plugin directory
- ✅ Step 4: Plugin activated and token generated
- ✅ Step 5: Claude Code can interact with WordPress

### Common WordPress Commands
- Install WP: `wp core install --url=... --title=...`
- Activate plugin: `wp plugin activate wordpress-mcp`
- Install Composer deps: `docker exec PROJECT_wordpress composer install`

## UI/UX Guidelines
- Use purple/pink gradients for primary actions
- Card-based layouts with hover effects
- Clear error messages with solutions
- Loading states for async operations
- Tooltips for complex actions

## Error Handling
- Always show user-friendly error messages
- Log technical details to console
- Provide actionable solutions
- Never leave the UI in broken state

## Performance Considerations
- Lazy load heavy components
- Minimize IPC calls between processes
- Cache Docker status checks
- Use React.memo for expensive renders

## Security Notes
- Never hardcode sensitive credentials
- Use environment variables for secrets
- Sanitize user inputs for shell commands
- Default passwords are for local dev only

## Debug Mode
When debugging issues:
1. Check Electron DevTools console
2. Check main process console (`npm run electron`)
3. Verify Docker container logs
4. **Test PowerShell commands directly in PowerShell terminal first**
5. Use `Write-Host` for debug output in PowerShell scripts

### PowerShell Debug Tips
```powershell
# Test if path exists and show result
if (Test-Path $path) {
    Write-Host "Path exists: $path" -ForegroundColor Green
} else {
    Write-Host "Path NOT found: $path" -ForegroundColor Red
}

# Show current directory
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan

# List directory contents with details
Get-ChildItem | Format-Table Name, Length, LastWriteTime
```

## Future Compatibility
- Keep WordPress image updated (currently 6.8.2)
- Monitor Electron security updates
- Test with latest Docker Desktop
- Maintain TypeScript strict mode
- Ensure PowerShell 5.1+ compatibility (NOT requiring PowerShell 7)

## PowerShell Resources for Reference
- **Official Microsoft PowerShell Documentation**: https://learn.microsoft.com/en-us/powershell/
  - PowerShell 101 for beginners: https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/
  - Windows PowerShell 5.1: https://learn.microsoft.com/en-us/powershell/scripting/windows-powershell/
  - PowerShell Gallery: https://www.powershellgallery.com/
- Common Cmdlets: Get-Help, Get-Command, Get-Member
- Always test scripts in PowerShell ISE or VS Code with PowerShell extension

## Available MCP Servers

### Docker MCP Gateway
The project has Docker MCP Gateway installed which provides access to these tools:
- **docker** - Execute Docker commands (containers, images, compose)
- **curl** - Make HTTP requests
- **desktop-commander** - Desktop automation and file operations
- **context7** - Context management for project state
- **fetch** - Fetch and parse web content
- **github-official** - GitHub API operations
- **playwright** - Browser automation with Playwright
- **puppeteer** - Browser automation with Puppeteer

### Using Docker MCP
Example commands you can use:
- List containers: `docker ps`
- List images: `docker images`
- View logs: `docker logs [container]`
- Compose operations: `docker-compose ps`

### Context7 MCP Server
For storing and retrieving project-specific context:
- Store code snippets, configurations, or development notes
- Maintain state between sessions
- Documentation: https://github.com/upstash/context7

## External Documentation & Resources

### Core Technologies
- **WordPress Developer Resources**: https://developer.wordpress.org/
  - WP-CLI Commands: https://developer.wordpress.org/cli/commands/
  - REST API: https://developer.wordpress.org/rest-api/
  - Plugin Development: https://developer.wordpress.org/plugins/

- **Docker Documentation**: https://docs.docker.com/
  - Docker Compose: https://docs.docker.com/compose/
  - Docker Desktop for Windows: https://docs.docker.com/desktop/windows/
  - Docker MCP Toolkit: https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/

- **LocalWP Documentation**: https://localwp.com/help-docs/
  - Directory structure reference
  - Port management patterns
  - Best practices for local WordPress development

### Claude Code & MCP Integration
- **Claude Code Official Docs**: https://docs.anthropic.com/en/docs/claude-code/overview
  - Memory management: https://docs.anthropic.com/en/docs/claude-code/memory
  - MCP integration: https://docs.anthropic.com/en/docs/claude-code/mcp
  - Settings & configuration: https://docs.anthropic.com/en/docs/claude-code/settings

- **WordPress MCP**: https://github.com/Automattic/wordpress-mcp
  - Installation guide
  - API token generation
  - Available commands and capabilities
  - Troubleshooting common issues

### Reference Projects & Examples
- **WordPress Docker Claude Code**: https://github.com/IncomeStreamSurfer/WordPress-Docker-Claude-Code
  - Docker Compose configurations
  - Claude Code integration patterns
  - Project structure examples

- **PocketFlow**: https://github.com/The-Pocket/PocketFlow
  - Advanced WordPress development workflows
  - CI/CD integration examples
  - Performance optimization techniques

- **n8n MCP**: https://github.com/czlonkowski/n8n-mcp
  - MCP implementation patterns
  - API integration examples
  - Workflow automation ideas

- **Context Engineering**: https://github.com/IncomeStreamSurfer/context-engineering-intro
  - Best practices for AI-assisted development
  - Context management strategies
  - Prompt engineering for development tasks

### When to Use Each Resource

#### For WordPress Issues:
1. Check WordPress Developer Resources for core functionality
2. Review WordPress MCP GitHub for integration-specific problems
3. Look at WordPress Docker Claude Code repo for containerization patterns

#### For Docker/Container Issues:
1. Start with Docker official docs
2. Check LocalWP docs for WordPress-specific Docker patterns
3. Review our docker-compose.yml templates

#### For Claude Code/MCP Issues:
1. Check Claude Code official documentation
2. Review WordPress MCP repository issues
3. Look at example implementations in reference projects

#### For PowerShell/Windows Issues:
1. Microsoft PowerShell documentation
2. Test commands in PowerShell ISE first
3. Check Windows-specific sections in Docker docs

### Quick Reference Links for Common Tasks
- **WordPress CLI in Docker**: `docker exec PROJECT_wordpress wp [command]`
- **Composer in Docker**: `docker exec PROJECT_wordpress composer [command]`
- **MCP Configuration**: See WordPress MCP repo README
- **Claude Code Settings**: Check .claude directory in project root

### Troubleshooting Resources
1. **WordPress MCP not working**: Check vendor folder exists, verify API token
2. **Docker issues**: Ensure Docker Desktop running, check logs with `docker logs`
3. **PowerShell errors**: Test commands directly in PowerShell first
4. **Claude Code issues**: Check Claude Code docs for settings and configuration

## SuperClaude Framework Integration

### Overview
SuperClaude Framework is an optional Python-based enhancement that adds 16 specialized slash commands to Claude Code, making it more powerful for development tasks.

### Installation
Click the "Install SuperClaude" button in the Claude Code & AI Frameworks section, or run:
```powershell
cd 'C:\path\to\project\app\public'
git clone https://github.com/SuperClaude-Org/SuperClaude_Framework.git SuperClaude
cd SuperClaude
python -m SuperClaude install
```

### Available Commands
SuperClaude adds these 16 slash commands to Claude Code:

#### Development Commands
- **/sc:implement** - Build features, components, and functionality with intelligent expert activation
- **/sc:build** - Compile and package projects with smart error handling
- **/sc:design** - Create system architecture, API designs, and component specifications

#### Analysis Commands
- **/sc:analyze** - Comprehensive code quality, security, performance analysis
- **/sc:troubleshoot** - Systematic debugging and problem investigation
- **/sc:explain** - Educational explanations of code and concepts

#### Quality Commands
- **/sc:improve** - Refactor and optimize code systematically
- **/sc:test** - Testing functionality
- **/sc:cleanup** - Remove dead code, organize file structure

#### Management Commands
- **/sc:document** - Generate documentation for components and features
- **/sc:git** - Git operations
- **/sc:estimate** - Time and complexity estimation for tasks
- **/sc:task** - Task management
- **/sc:index** - Show available resources
- **/sc:load** - Load configurations or resources
- **/sc:spawn** - Create new instances or processes

### Key Features
1. **Smart Personas**: Automatically activates relevant expert AI personas based on context
2. **MCP Integration**: Works with Context7, Sequential, Magic, Playwright servers
3. **Development Methodologies**: Built-in best practices for common development tasks
### Requirements
- Python 3.8+ (install with `winget install python` on Windows)
- Claude Code CLI already installed
- Git for cloning the repository

### Files Created
SuperClaude creates these files in your project's `.claude/` directory:
- `CLAUDE.md` - Framework entry point
- `COMMANDS.md` - Complete command reference
- `settings.json` - Configuration file
- `commands/` - Individual command definitions

### Usage Example
```bash
# In Claude Code, simply type:
/sc:implement create a user authentication system
/sc:analyze check security vulnerabilities
/sc:improve refactor this function for better performance
/sc:help  # See all available commands
```

### Resources
- **Official Repository**: https://github.com/SuperClaude-Org/SuperClaude_Framework
- **Documentation**: https://superclaude-org.github.io/
- **PyPI Package**: https://pypi.org/project/SuperClaude/