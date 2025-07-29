import { 
  FolderIcon, 
  PlayIcon, 
  StopIcon, 
  CodeBracketIcon, 
  TrashIcon, 
  GlobeAltIcon, 
  CircleStackIcon, 
  EnvelopeIcon, 
  ArrowDownTrayIcon, 
  CommandLineIcon, 
  PuzzlePieceIcon, 
  CubeIcon, 
  KeyIcon,
  ServerIcon,
  ServerStackIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  CloudIcon,
  CodeBracketSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  DocumentMagnifyingGlassIcon,
  BookOpenIcon,
  CubeTransparentIcon,
  SparklesIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { Project } from '../types'
import { useState, useEffect } from 'react'
import { mcpIntegrations, McpIntegration } from '../config/mcpIntegrations'

interface ProjectDetailProps {
  project: Project
  onRefresh: () => void
}

export default function ProjectDetail({ project, onRefresh }: ProjectDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [wpCredentials, setWpCredentials] = useState({ username: 'admin', password: 'password' })
  const [credentialsLoaded, setCredentialsLoaded] = useState(false)
  const [installingMcp, setInstallingMcp] = useState<string | null>(null)
  
  // API Key input modal state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [currentMcp, setCurrentMcp] = useState<McpIntegration | null>(null)
  
  // Tunnelmole state
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null)
  const [isTunnelActive, setIsTunnelActive] = useState(false)

  // Load WordPress credentials when project changes or becomes active
  useEffect(() => {
    if (project.status === 'active' && project.type === 'wordpress') {
      loadWpCredentials()
    }
  }, [project.id, project.status])

  const loadWpCredentials = async () => {
    try {
      const result = await window.electronAPI.getWpCredentials(project.path)
      if (result.success) {
        setWpCredentials({ username: result.username, password: result.password })
        setCredentialsLoaded(true)
      }
    } catch (error) {
      console.error('Failed to load WP credentials:', error)
    }
  }

  const handleStartStop = async () => {
    try {
      setIsStarting(true)
      if (project.status === 'active') {
        // Stop containers and close CMD windows
        if (project.type === 'wordpress') {
          await window.electronAPI.runCommand('docker', ['compose', 'down'], project.path);
          
          try {
            await window.electronAPI.runCommand('taskkill', ['/FI', `WINDOWTITLE eq ${project.name}*`, '/F', '/IM', 'cmd.exe']);
          } catch (e) {
            // Ignore if no windows found
          }
        }
      } else {
        // Start containers - add debug check
        console.log('Starting project:', project.name)
        const startPath = `${project.path}\\start.bat`
        
        // Check Docker status first
        const psCommand = [
          `cd '${project.path}'`,
          `Write-Host 'Checking Docker containers...' -ForegroundColor Yellow`,
          `docker-compose ps`,
          `Write-Host ''`,
          `Write-Host 'Starting containers...' -ForegroundColor Green`,
          `docker-compose up -d`,
          `Write-Host ''`,
          `Write-Host 'Container status:' -ForegroundColor Cyan`,
          `docker-compose ps`,
          `Read-Host 'Press Enter to close'`
        ].join('; ')
        
        await window.electronAPI.runCommand('cmd', [
          '/c', 'start', 'powershell', '-NoExit', '-Command', psCommand
        ])
      }
      
      setTimeout(onRefresh, 3000)
    } catch (error) {
      console.error('Failed to start/stop project:', error)
      alert(`Failed to start/stop project: ${error.message}`)
    } finally {
      setIsStarting(false)
    }
  }

  const handleDelete = async () => {
    const confirmMessage = `Are you sure you want to delete "${project.name}"?\n\nThis will:\n- Stop all Docker containers\n- Delete all project files\n- Remove the project from the list\n\nThis action cannot be undone!`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setIsDeleting(true)
      // Close any CMD windows for this project
      if (project.type === 'wordpress') {
        try {
          await window.electronAPI.runCommand('taskkill', ['/FI', `WINDOWTITLE eq ${project.name}*`, '/F', '/IM', 'cmd.exe']);
        } catch (e) {
          // Ignore if no windows found
        }
      }
      
      const result = await window.electronAPI.deleteProject(project.id, project.path)
      if (result.success) {
        onRefresh()
      } else {
        alert('Failed to delete project: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project: ' + (error as any).message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenVSCode = async () => {
    try {
      // Open VS Code at the project root directory
      await window.electronAPI.runCommand('code', [project.path.replace(/\//g, '\\')])
    } catch (error) {
      console.error('Failed to open VS Code:', error)
    }
  }

  const handleOpenClaudia = async () => {
    console.log('🔧 handleOpenClaudia called - trying to open existing Claudia')
    try {
      // Try common Claudia locations including our build
      const possiblePaths = [
        'C:\\Users\\jfran\\Documents\\www-data\\start-project-gui\\dev-bundle\\claudia\\src-tauri\\target\\release\\claudia.exe',
        'C:\\Users\\jfran\\AppData\\Local\\Programs\\claudia\\claudia.exe',
        'C:\\Program Files\\claudia\\claudia.exe',
        'C:\\Users\\jfran\\AppData\\Local\\claudia\\claudia.exe'
      ]
      
      // Try to open directly
      for (const path of possiblePaths) {
        try {
          await window.electronAPI.runCommand(path, [])
          console.log('🔧 Claudia launched from:', path)
          return // Success
        } catch (err) {
          console.log('🔧 Claudia not at:', path)
        }
      }
      
      // If not found, show simple message
      alert('Claudia not found!\n\nPlease install Claudia first using the "Install Claudia" button in the Claude Code & AI Frameworks section.')
    } catch (error) {
      console.error('Failed to open Claudia:', error)
    }
  }

  const handleInstallClaudia = async () => {
    console.log('🔧 handleInstallClaudia called')
    try {
      const install = confirm('Would you like to build and install Claudia?\n\nPrerequisites needed:\n• Microsoft C++ Build Tools\n• WebView2 (pre-installed on Windows 11)\n• Rust, Bun, and Git\n\nBuild time: 5-10 minutes\n\nOnce installed, you can open it from the Quick Actions.')
      
      if (install) {
        // Use the working batch file that successfully built Claudia
        const batchPath = 'C:\\Users\\jfran\\Documents\\www-data\\start-project-gui\\dev-bundle\\build-claudia-final.bat'
        
        await window.electronAPI.runCommand('cmd', [
          '/c', 'start', 'cmd', '/k', batchPath
        ])
      } else {
        // Open download page manually
        await window.electronAPI.openInBrowser('https://github.com/getAsterisk/claudia/releases')
      }
    } catch (error) {
      console.error('Failed to install Claudia:', error)
    }
  }

  const handleInstallSuperClaude = async () => {
    console.log('🔧 handleInstallSuperClaude called')
    try {
      const install = confirm('Would you like to install SuperClaude Framework?\n\nThis will add 16 specialized slash commands to Claude Code:\n• /sc:implement - Build features\n• /sc:analyze - Code analysis\n• /sc:troubleshoot - Debug issues\n• /sc:improve - Refactor code\n• And 12 more!\n\nRequires: Python 3.8+')
      
      if (install) {
        // Different path for different project types
        let publicPath = project.path.replace(/\//g, '\\')
        if (project.type === 'wordpress') {
          publicPath = `${publicPath}\\app\\public`
        }
        
        const commands = [
          `cd '${publicPath}'`,
          `Write-Host 'Installing SuperClaude Framework' -ForegroundColor Magenta`,
          `Write-Host '================================' -ForegroundColor Magenta`,
          `Write-Host ''`,
          `Write-Host 'Checking Python installation...' -ForegroundColor Yellow`,
          `$pythonVersion = python --version 2>&1`,
          `if ($LASTEXITCODE -eq 0) {`,
          `    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green`,
          `} else {`,
          `    Write-Host '✗ Python not found!' -ForegroundColor Red`,
          `    Write-Host 'Please install Python 3.8+ from python.org' -ForegroundColor Yellow`,
          `    Read-Host 'Press Enter to exit'`,
          `    exit`,
          `}`,
          `Write-Host ''`,
          `Write-Host 'Cloning SuperClaude repository...' -ForegroundColor Yellow`,
          `git clone https://github.com/SuperClaude-Org/SuperClaude_Framework.git SuperClaude`,
          `if (-not $?) {`,
          `    Write-Host 'ERROR: Failed to clone repository!' -ForegroundColor Red`,
          `    Read-Host 'Press Enter to exit'`,
          `    exit`,
          `}`,
          `Write-Host ''`,
          `Write-Host 'Installing SuperClaude...' -ForegroundColor Yellow`,
          `cd SuperClaude`,
          `python -m SuperClaude install`,
          `Write-Host ''`,
          `Write-Host '================================' -ForegroundColor Green`,
          `Write-Host '✓ SuperClaude Framework Installed!' -ForegroundColor Green`,
          `Write-Host '================================' -ForegroundColor Green`,
          `Write-Host ''`,
          `Write-Host 'Available commands:' -ForegroundColor Cyan`,
          `Write-Host '  /sc:implement - Build features' -ForegroundColor White`,
          `Write-Host '  /sc:analyze   - Analyze code' -ForegroundColor White`,
          `Write-Host '  /sc:build     - Build projects' -ForegroundColor White`,
          `Write-Host '  /sc:improve   - Improve code' -ForegroundColor White`,
          `Write-Host '  /sc:help      - See all commands' -ForegroundColor White`,
          `Write-Host ''`,
          `Write-Host 'Files created in .claude folder:' -ForegroundColor Yellow`,
          `Write-Host '  - CLAUDE.md (framework entry)' -ForegroundColor Gray`,
          `Write-Host '  - COMMANDS.md (command reference)' -ForegroundColor Gray`,
          `Write-Host '  - commands/ (command definitions)' -ForegroundColor Gray`,
          `Write-Host ''`,
          `Read-Host 'Press Enter to close'`
        ].join('; ')
        
        await window.electronAPI.runCommand('cmd', [
          '/c', 'start', 'powershell', '-NoExit', '-Command', commands
        ])
      } else {
        // Open SuperClaude documentation
        await window.electronAPI.openInBrowser('https://github.com/SuperClaude-Org/SuperClaude_Framework')
      }
    } catch (error) {
      console.error('Failed to install SuperClaude:', error)
      alert('Failed to start SuperClaude installer. Please check the console for errors.')
    }
  }

  const handleOpenFolder = async () => {
    try {
      // Open the project root folder in Windows Explorer
      await window.electronAPI.runCommand('explorer', [project.path.replace(/\//g, '\\')])
    } catch (error) {
      console.error('Failed to open folder:', error)
    }
  }

  const handleOpenCLI = async () => {
    try {
      // Different path for different project types
      let projectPath = project.path.replace(/\//g, '\\')
      if (project.type === 'wordpress') {
        projectPath = `${projectPath}\\app\\public`
      }
      // For nextjs-fullstack and other project types, use root directory
      
      await window.electronAPI.runCommand('cmd', [
        '/c', 'start', 'powershell', '-NoExit', '-Command', `cd '${projectPath}'`
      ])
    } catch (error) {
      console.error('Failed to open CLI:', error)
    }
  }

  const handleInstallWordPress = async () => {
    try {
      const installPath = `${project.path}\\install-wp.bat`
      
      await window.electronAPI.runCommand('cmd', [
        '/c',
        'start',
        'powershell',
        '-NoExit',
        '-Command',
        `& '${installPath}'`
      ])
    } catch (error) {
      console.error('Failed to run WordPress installer:', error)
    }
  }

  const handleInstallClaudeCode = async () => {
    try {
      // Different path for different project types
      let projectPath = project.path.replace(/\//g, '\\')
      if (project.type === 'wordpress') {
        projectPath = `${projectPath}\\app\\public`
      }
      
      const psCommand = [
        `cd '${projectPath}'`,
        `npm init -y`,
        `npm install @anthropic-ai/claude-code`,
        `Write-Host ''`,
        `Write-Host 'Claude Code installed locally in project!' -ForegroundColor Green`,
        `Write-Host 'To use it, run: npx claude' -ForegroundColor Yellow`
      ].join('; ')

      await window.electronAPI.runCommand('cmd', [
        '/c',
        'start',
        'powershell',
        '-NoExit',
        '-Command',
        psCommand
      ])
    } catch (error) {
      console.error('Failed to run Claude Code installer:', error)
    }
  }

  const handleInstallWordPressMCP = async () => {
    try {
      const publicPath = `${project.path}\\app\\public`.replace(/\//g, '\\')
      
      const commands = [
        `cd '${publicPath}'`,
        `Write-Host 'Step 1: Build WordPress MCP from Source' -ForegroundColor Green`,
        `Write-Host '=======================================' -ForegroundColor Green`,
        `Write-Host ''`,
        `if (Test-Path 'wordpress-mcp') { Write-Host 'WARNING: wordpress-mcp folder already exists!' -ForegroundColor Yellow; Write-Host 'Delete it first or skip this step.' -ForegroundColor Yellow; Read-Host 'Press Enter to exit'; exit }`,
        `Write-Host 'Cloning WordPress MCP repository...' -ForegroundColor Yellow`,
        `git clone https://github.com/Automattic/wordpress-mcp.git`,
        `if (-not $?) { Write-Host 'ERROR: Failed to clone repository!' -ForegroundColor Red; Write-Host 'Make sure Git is installed and you have internet connection.' -ForegroundColor Yellow; Read-Host 'Press Enter to exit'; exit }`,
        `cd wordpress-mcp`,
        `Write-Host ''`,
        `Write-Host 'Installing Composer dependencies...' -ForegroundColor Yellow`,
        `composer install --no-dev`,
        `if (-not $?) { Write-Host 'ERROR: Composer install failed!' -ForegroundColor Red; Write-Host 'Make sure Composer is installed.' -ForegroundColor Yellow; Read-Host 'Press Enter to exit'; exit }`,
        `Write-Host ''`,
        `Write-Host 'Installing npm dependencies...' -ForegroundColor Yellow`,
        `npm install`,
        `if (-not $?) { Write-Host 'ERROR: npm install failed!' -ForegroundColor Red; Read-Host 'Press Enter to exit'; exit }`,
        `Write-Host ''`,
        `Write-Host 'Building WordPress MCP...' -ForegroundColor Yellow`,
        `npm run build`,
        `if (-not $?) { Write-Host 'ERROR: Build failed!' -ForegroundColor Red; Read-Host 'Press Enter to exit'; exit }`,
        `cd ..`,
        `Write-Host ''`,
        `Write-Host 'WordPress MCP built successfully!' -ForegroundColor Green`,
        `Write-Host 'Ready for Step 2: Copy Plugin (folder icon)' -ForegroundColor Yellow`
      ]
      
      const psCommand = commands.join('; ')
      
      await window.electronAPI.runCommand('cmd', [
        '/c',
        'start',
        'powershell',
        '-NoExit',
        '-Command',
        psCommand
      ])
    } catch (error) {
      console.error('Failed to install WordPress MCP:', error)
    }
  }

  const handleInstallPRPs = async () => {
    try {
      const publicPath = `${project.path}\\app\\public`.replace(/\//g, '\\')
      
      const commands = [
        `cd '${publicPath}'`,
        `Write-Host 'Installing PRPs-agentic-eng Framework' -ForegroundColor Magenta`,
        `Write-Host '=====================================' -ForegroundColor Magenta`,
        `Write-Host ''`,
        `if (Test-Path 'PRPs') { Write-Host 'PRPs already exists. Updating...' -ForegroundColor Yellow }`,
        `Write-Host 'Cloning PRPs repository...' -ForegroundColor Yellow`,
        `git clone https://github.com/Wirasm/PRPs-agentic-eng.git PRPs-temp`,
        `if (-not $?) { Write-Host 'ERROR: Failed to clone repository!' -ForegroundColor Red; Read-Host 'Press Enter to exit'; exit }`,
        `Write-Host ''`,
        `Write-Host 'Copying PRPs framework files...' -ForegroundColor Yellow`,
        `if (-not (Test-Path '.claude')) { $null = New-Item -ItemType Directory -Path '.claude' -Force }`,
        `Copy-Item -Path 'PRPs-temp\\.claude\\*' -Destination '.claude\\' -Recurse -Force`,
        `Copy-Item -Path 'PRPs-temp\\PRPs' -Destination '.' -Recurse -Force`,
        `if (Test-Path 'PRPs-temp\\CLAUDE.md') { Copy-Item -Path 'PRPs-temp\\CLAUDE.md' -Destination 'CLAUDE-PRPs.md' -Force }`,
        `Write-Host ''`,
        `Write-Host 'Cleaning up...' -ForegroundColor Yellow`,
        `Remove-Item -Path 'PRPs-temp' -Recurse -Force`,
        `Write-Host ''`,
        `Write-Host 'PRPs Framework installed successfully!' -ForegroundColor Green`,
        `Write-Host ''`,
        `Write-Host 'Files installed:' -ForegroundColor Cyan`,
        `Write-Host '- .claude/commands/ (12 Claude Code commands)' -ForegroundColor White`,
        `Write-Host '- .claude/settings.json (Tool permissions)' -ForegroundColor White`,
        `Write-Host '- PRPs/ (Templates and scripts)' -ForegroundColor White`,
        `Write-Host '- CLAUDE-PRPs.md (Guidelines)' -ForegroundColor White`,
        `Write-Host ''`,
        `Write-Host 'Next steps:' -ForegroundColor Yellow`,
        `Write-Host '1. Run: claude --dangerously-skip-permissions' -ForegroundColor White`,
        `Write-Host '2. Use /prp-create to create your first PRP' -ForegroundColor White`,
        `Write-Host '3. Check /help for all available commands' -ForegroundColor White`
      ]
      
      const psCommand = commands.join('; ')
      
      await window.electronAPI.runCommand('cmd', [
        '/c',
        'start',
        'powershell',
        '-NoExit',
        '-Command',
        psCommand
      ])
    } catch (error) {
      console.error('Failed to install PRPs:', error)
    }
  }

  const handleInstallContextEngineering = async () => {
    try {
      const publicPath = `${project.path}\\app\\public`.replace(/\//g, '\\')
      
      const commands = [
        `cd '${publicPath}'`,
        `Write-Host 'Installing Context Engineering Framework' -ForegroundColor Cyan`,
        `Write-Host '=======================================' -ForegroundColor Cyan`,
        `Write-Host ''`,
        `Write-Host 'This framework requires a different approach:' -ForegroundColor Yellow`,
        `Write-Host '- Files will be copied to current project' -ForegroundColor White`,
        `Write-Host '- Claude Code should run from project root' -ForegroundColor White`,
        `Write-Host ''`,
        `if (Test-Path 'context-engineering-temp') { Remove-Item 'context-engineering-temp' -Recurse -Force }`,
        `Write-Host 'Cloning Context Engineering repository...' -ForegroundColor Yellow`,
        `git clone https://github.com/IncomeStreamSurfer/context-engineering-intro.git context-engineering-temp`,
        `if (-not $?) { Write-Host 'ERROR: Failed to clone repository!' -ForegroundColor Red; Read-Host 'Press Enter to exit'; exit }`,
        `Write-Host ''`,
        `Write-Host 'Merging with existing .claude folder...' -ForegroundColor Yellow`,
        `if (-not (Test-Path '.claude')) { $null = New-Item -ItemType Directory -Path '.claude' -Force }`,
        `if (Test-Path 'context-engineering-temp\\.claude\\commands') { Copy-Item -Path 'context-engineering-temp\\.claude\\commands\\*' -Destination '.claude\\commands\\' -Force }`,
        `Write-Host ''`,
        `Write-Host 'Copying Context Engineering files...' -ForegroundColor Yellow`,
        `if (-not (Test-Path 'examples')) { Copy-Item -Path 'context-engineering-temp\\examples' -Destination '.' -Recurse -Force }`,
        `if (-not (Test-Path 'research')) { Copy-Item -Path 'context-engineering-temp\\research' -Destination '.' -Recurse -Force }`,
        `Copy-Item -Path 'context-engineering-temp\\INITIAL.md' -Destination 'INITIAL-template.md' -Force`,
        `Copy-Item -Path 'context-engineering-temp\\SETUP.md' -Destination 'SETUP-context-eng.md' -Force`,
        `if (Test-Path 'context-engineering-temp\\CLAUDE.md') { Copy-Item -Path 'context-engineering-temp\\CLAUDE.md' -Destination 'CLAUDE-context-eng.md' -Force }`,
        `Write-Host ''`,
        `Write-Host 'Merging CLAUDE.md guidelines...' -ForegroundColor Yellow`,
        `if (Test-Path 'CLAUDE.md') {`,
        `  Write-Host 'Appending to existing CLAUDE.md...' -ForegroundColor White`,
        `  Add-Content -Path 'CLAUDE.md' -Value "``n``n# Context Engineering Guidelines``n"`,
        `  Get-Content 'CLAUDE-context-eng.md' | Add-Content -Path 'CLAUDE.md'`,
        `  Remove-Item 'CLAUDE-context-eng.md'`,
        `} else {`,
        `  Move-Item 'CLAUDE-context-eng.md' 'CLAUDE.md'`,
        `}`,
        `Write-Host ''`,
        `Write-Host 'Cleaning up...' -ForegroundColor Yellow`,
        `Remove-Item -Path 'context-engineering-temp' -Recurse -Force`,
        `Write-Host ''`,
        `Write-Host 'Context Engineering Framework installed!' -ForegroundColor Green`,
        `Write-Host ''`,
        `Write-Host 'Files installed:' -ForegroundColor Cyan`,
        `Write-Host '- .claude/commands/ (Additional commands)' -ForegroundColor White`,
        `Write-Host '- examples/ (Code pattern examples)' -ForegroundColor White`,
        `Write-Host '- research/ (Documentation)' -ForegroundColor White`,
        `Write-Host '- INITIAL-template.md (Feature request template)' -ForegroundColor White`,
        `Write-Host '- SETUP-context-eng.md (Setup guide)' -ForegroundColor White`,
        `Write-Host '- CLAUDE.md (Updated with context engineering rules)' -ForegroundColor White`,
        `Write-Host ''`,
        `Write-Host 'Usage:' -ForegroundColor Yellow`,
        `Write-Host '1. Edit INITIAL-template.md with your feature request' -ForegroundColor White`,
        `Write-Host '2. Run: /generate-prp INITIAL-template.md' -ForegroundColor White`,
        `Write-Host '3. Execute: /execute-prp PRPs/your-feature.md' -ForegroundColor White`,
        `Write-Host ''`,
        `Write-Host 'Note: Claude Code should run from THIS directory!' -ForegroundColor Magenta`
      ]
      
      const psCommand = commands.join('; ')
      
      await window.electronAPI.runCommand('cmd', [
        '/c',
        'start',
        'powershell',
        '-NoExit',
        '-Command',
        psCommand
      ])
    } catch (error) {
      console.error('Failed to install Context Engineering:', error)
    }
  }

  const handleCopyMCPPlugin = async () => {
    try {
      const publicPath = `${project.path}\\app\\public`.replace(/\//g, '\\')
      const dockerCommand = `docker exec ${project.name}_wordpress composer install --no-dev --working-dir=/var/www/html/wp-content/plugins/wordpress-mcp`
      
      const commands = [
        `cd '${publicPath}'`,
        `Write-Host 'Step 2: Copy WordPress MCP Plugin' -ForegroundColor Green`,
        `Write-Host '=================================' -ForegroundColor Green`,
        `Write-Host ''`,
        `if (-not (Test-Path 'wordpress-mcp')) { Write-Host 'ERROR: wordpress-mcp folder not found!' -ForegroundColor Red; Write-Host 'Please run Step 1 first (puzzle icon)' -ForegroundColor Yellow; Read-Host 'Press Enter to exit'; exit }`,
        `$pluginPath = 'wp-content\\plugins\\wordpress-mcp'`,
        `if (Test-Path $pluginPath) { Write-Host 'Removing existing plugin...' -ForegroundColor Yellow; Remove-Item $pluginPath -Recurse -Force }`,
        `$null = New-Item -ItemType Directory -Path $pluginPath -Force`,
        `Write-Host 'Copying plugin files...' -ForegroundColor Yellow`,
        `Copy-Item 'wordpress-mcp\\wordpress-mcp.php' $pluginPath -Force`,
        `if (Test-Path 'wordpress-mcp\\includes') { Write-Host '  - Copying includes folder...' -ForegroundColor Gray; Copy-Item 'wordpress-mcp\\includes' "$pluginPath\\includes" -Recurse -Force }`,
        `if (Test-Path 'wordpress-mcp\\vendor') { Write-Host '  - Copying vendor folder...' -ForegroundColor Gray; Copy-Item 'wordpress-mcp\\vendor' "$pluginPath\\vendor" -Recurse -Force }`,
        `if (Test-Path 'wordpress-mcp\\build') { Write-Host '  - Copying build folder...' -ForegroundColor Gray; Copy-Item 'wordpress-mcp\\build' "$pluginPath\\build" -Recurse -Force }`,
        `if (Test-Path 'wordpress-mcp\\docs') { Write-Host '  - Copying docs folder...' -ForegroundColor Gray; Copy-Item 'wordpress-mcp\\docs' "$pluginPath\\docs" -Recurse -Force }`,
        `if (Test-Path 'wordpress-mcp\\Readme.md') { Copy-Item 'wordpress-mcp\\Readme.md' $pluginPath -Force }`,
        `if (Test-Path 'wordpress-mcp\\README.md') { Copy-Item 'wordpress-mcp\\README.md' $pluginPath -Force }`,
        `Write-Host '  - Skipping src folder and package.json' -ForegroundColor DarkGray`,
        `Write-Host 'Plugin files copied successfully!' -ForegroundColor Green`,
        `Write-Host ''`,
        `$vendorPath = 'wp-content\\plugins\\wordpress-mcp\\vendor'`,
        `if (-not (Test-Path $vendorPath)) { $vendorMissing = $true } else { $vendorMissing = $false }`,
        `if ($vendorMissing) { Write-Host 'WARNING: vendor folder is missing!' -ForegroundColor Red }`,
        `if ($vendorMissing) { Write-Host 'The plugin needs Composer dependencies to work.' -ForegroundColor Yellow }`,
        `if ($vendorMissing) { Write-Host '' }`,
        `if ($vendorMissing) { Write-Host 'Run this command to install them:' -ForegroundColor Cyan }`,
        `if ($vendorMissing) { Write-Host '${dockerCommand}' -ForegroundColor White }`,
        `if (-not $vendorMissing) { Write-Host 'Vendor folder found - plugin is ready!' -ForegroundColor Green }`,
        `Write-Host ''`,
        `Write-Host 'Next steps:' -ForegroundColor Yellow`,
        `Write-Host '1. Go to WordPress admin panel' -ForegroundColor White`,
        `Write-Host '2. Navigate to Plugins page' -ForegroundColor White`,
        `Write-Host '3. Activate WordPress MCP plugin' -ForegroundColor White`,
        `Write-Host '4. Generate API token in MCP settings' -ForegroundColor White`,
        `Write-Host '5. Use the yellow key icon (Step 3) to configure Claude' -ForegroundColor White`
      ]
      
      const psCommand = commands.join('; ')
      
      await window.electronAPI.runCommand('cmd', [
        '/c',
        'start',
        'powershell',
        '-NoExit',
        '-Command',
        psCommand
      ])
    } catch (error) {
      console.error('Failed to copy MCP plugin:', error)
    }
  }

  const handleInstallComposerDeps = async () => {
    try {
      const dockerCommand = `docker exec ${project.name}_wordpress composer install --no-dev --working-dir=/var/www/html/wp-content/plugins/wordpress-mcp`
      
      const commands = [
        `Write-Host 'Step 2b: Install Composer Dependencies' -ForegroundColor Green`,
        `Write-Host '=====================================' -ForegroundColor Green`,
        `Write-Host ''`,
        `Write-Host 'Installing Composer dependencies in WordPress container...' -ForegroundColor Yellow`,
        `Write-Host ''`,
        `${dockerCommand}`,
        `if ($?) { Write-Host ''; Write-Host 'Composer dependencies installed successfully!' -ForegroundColor Green }`,
        `else { Write-Host ''; Write-Host 'ERROR: Failed to install Composer dependencies!' -ForegroundColor Red }`,
        `Write-Host ''`,
        `Write-Host 'Next steps:' -ForegroundColor Yellow`,
        `Write-Host '1. Go to WordPress admin panel' -ForegroundColor White`,
        `Write-Host '2. Activate WordPress MCP plugin' -ForegroundColor White`,
        `Write-Host '3. Generate API token in MCP settings' -ForegroundColor White`,
        `Write-Host '4. Use the yellow key icon to configure Claude' -ForegroundColor White`
      ]
      
      const psCommand = commands.join('; ')
      
      await window.electronAPI.runCommand('cmd', [
        '/c',
        'start',
        'powershell',
        '-NoExit',
        '-Command',
        psCommand
      ])
    } catch (error) {
      console.error('Failed to install Composer dependencies:', error)
    }
  }

  const handleConfigureMCPToken = async () => {
    try {
      const publicPath = `${project.path}\\app\\public`.replace(/\//g, '\\')
      const wpUrl = `http://localhost:${project.wpPort}/wp-json/wp/v2/wpmcp/streamable`
      
      const copyResult = await window.electronAPI.copyMcpScript(project.path, wpUrl, publicPath)
      
      if (!copyResult.success || !copyResult.scriptPath) {
        console.error('Failed to copy MCP script:', copyResult.error)
        return
      }
      
      await window.electronAPI.runCommand('cmd', [
        '/c',
        'start',
        'powershell',
        '-NoExit',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        copyResult.scriptPath,
        '-wpUrl',
        wpUrl,
        '-projectPath',
        publicPath
      ])
    } catch (error) {
      console.error('Failed to configure MCP token:', error)
    }
  }

  const handleOpenLink = (url: string) => {
    window.electronAPI.openInBrowser(url)
  }

  // Smart logging system
  const LOG_FILE = `${project.path}\\mcp-install.log`.replace(/\//g, '\\')
  const MAX_LOG_LINES = 500 // Keep last 500 lines
  
  const writeToLog = async (message: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const logEntry = `[${timestamp}] ${message}`
    
    try {
      // Append to log file
      await window.electronAPI.runCommand('cmd', [
        '/c', `echo ${logEntry} >> "${LOG_FILE}"`
      ], project.path)
      
      // Rotate log if needed (every 50 writes)
      if (Math.random() < 0.02) { // 2% chance to rotate
        await window.electronAPI.runCommand('powershell', [
          '-Command',
          `$content = Get-Content "${LOG_FILE}" -Tail ${MAX_LOG_LINES}; $content | Set-Content "${LOG_FILE}"`
        ], project.path)
      }
    } catch (e) {
      // Silent fail
    }
  }
  
  // Create enhanced console that logs to file
  const enhancedConsole = {
    log: (...args: any[]) => {
      const msg = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      console.log(...args)
      writeToLog(`[LOG] ${msg}`)
    },
    error: (...args: any[]) => {
      const msg = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      console.error(...args)
      writeToLog(`[ERROR] ${msg}`)
    }
  }

  // Handle API Key modal confirmation
  const handleApiKeyConfirm = async () => {
    if (!currentMcp || !apiKeyInput.trim()) {
      alert('Please enter a valid API key')
      return
    }

    const apiKey = apiKeyInput.trim()
    // Different path for different project types
    let publicPath = project.path.replace(/\//g, '\\')
    if (project.type === 'wordpress') {
      publicPath = `${publicPath}\\app\\public`
    }
    
    setShowApiKeyModal(false)
    
    // Initialize logging for this installation
    await writeToLog('=== MCP INSTALLATION START ===')
    await writeToLog(`MCP: ${currentMcp.name} (${currentMcp.id})`)
    await writeToLog(`Project: ${project.name}`)
    await writeToLog(`Path: ${publicPath}`)
    
    try {
      enhancedConsole.log('Installing', currentMcp.name, 'with API key...')
      
      // Continue with Jina AI installation
      if (currentMcp.id === 'jina-ai') {
        // Remove existing MCP first (ignore errors)
        try {
          await window.electronAPI.runCommand('claude', ['mcp', 'remove', 'jina-ai-mcp-server'], publicPath)
        } catch (e) {
          enhancedConsole.log('No existing MCP to remove (this is fine)')
        }
        
        enhancedConsole.log('Installing Jina AI MCP server using npx method...')
        
        // Use the add-json method that works in your debug.bat
        enhancedConsole.log('Step 1: Creating JSON configuration...')
        
        // Create the exact JSON format from the working batch file
        // Windows requires cmd /c wrapper for npx
        const jsonConfig = JSON.stringify({
          command: "cmd",
          args: ["/c", "npx", "-y", "jina-ai-mcp-server"],
          env: {
            JINA_API_KEY: apiKey
          }
        })
        
        enhancedConsole.log('JSON config:', jsonConfig)
        
        enhancedConsole.log('Step 2: Registering MCP server with Claude using add-json...')
        
        // Debug: log exact command that will be executed
        enhancedConsole.log('Full command:', 'claude mcp add-json jina-ai-mcp-server', jsonConfig)
        
        let result
        
        // First set the environment variable
        enhancedConsole.log('Setting JINA_API_KEY environment variable...')
        try {
          await window.electronAPI.runCommand('cmd', [
            '/c', `setx JINA_API_KEY "${apiKey}"`
          ], publicPath)
          enhancedConsole.log('Environment variable set')
        } catch (e) {
          enhancedConsole.error('Failed to set env var:', e)
        }
        
        try {
          // Use the exact command format that works in debug.bat
          result = await window.electronAPI.runCommand('claude', [
            'mcp', 'add-json', 'jina-ai-mcp-server', jsonConfig
          ], publicPath)
          
          enhancedConsole.log('Command executed successfully')
        } catch (cmdError) {
          enhancedConsole.error('Command failed with add-json, trying simple add...')
          
          // Try simpler approach - just add with npx
          enhancedConsole.log('Using simple add command with npx...')
          
          try {
            // Windows requires cmd /c wrapper
            result = await window.electronAPI.runCommand('claude', [
              'mcp', 'add', 'jina-ai-mcp-server', '--', 'cmd', '/c', 'npx', '-y', 'jina-ai-mcp-server'
            ], publicPath)
            enhancedConsole.log('Simple add completed')
          } catch (e2) {
            enhancedConsole.error('Simple add also failed:', e2)
          }
        }
        
        enhancedConsole.log('Registration result:', result)
        enhancedConsole.log('Installation result:', result)
        
        // Verify installation
        const listResult = await window.electronAPI.runCommand('claude', ['mcp', 'list'], publicPath)
        enhancedConsole.log('MCP List result:', listResult)
        
        // Open new terminal for easier testing
        await window.electronAPI.runCommand('cmd', [
          '/c', 'start', 'powershell', '-NoExit', '-Command',
          `cd '${publicPath}'; echo '=== Jina AI MCP Installation Complete ==='; echo ''; echo 'To verify installation:'; echo '  claude mcp list'; echo ''; echo 'Jina AI MCP should appear in the list.'; echo 'API key has been configured directly in MCP.'; echo ''`
        ])
        
        if (listResult.output && listResult.output.includes('jina-ai-mcp-server')) {
          alert('✅ Jina AI MCP added to list!\n\n🔄 CRITICAL STEPS:\n1. Close ALL Claude Code instances NOW\n2. Close this terminal window\n3. Wait 10 seconds\n4. Open new terminal and run: claude\n\nThe API key has been set as environment variable.\nJina AI will only work after restart!')
        } else {
          alert('⚠️ Installation attempted.\n\n🔄 REQUIRED STEPS:\n1. Close ALL terminals and Claude Code\n2. Wait 10 seconds\n3. Open new terminal\n4. Run: echo %JINA_API_KEY% (to verify)\n5. Run: claude\n\nIf API key shows correctly, Jina AI should work.')
        }
      }
      
    } catch (error) {
      enhancedConsole.error(currentMcp.name, 'installation failed:', error)
      alert('❌ Installation failed: ' + (error as any).message)
    } finally {
      await writeToLog('=== MCP INSTALLATION END ===')
      await writeToLog(`Log location: ${LOG_FILE}`)
      enhancedConsole.log('Log saved to:', LOG_FILE)
      setInstallingMcp(null)
      setCurrentMcp(null)
      setApiKeyInput('')
    }
  }

  // Helper function to get icon component
  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      FolderIcon,
      CodeBracketSquareIcon,
      CloudIcon,
      ServerIcon,
      ServerStackIcon,
      CubeIcon,
      PuzzlePieceIcon,
      KeyIcon,
      CommandLineIcon,
      ShieldCheckIcon,
      MagnifyingGlassIcon,
      DocumentMagnifyingGlassIcon,
      BookOpenIcon,
      SparklesIcon
    }
    return icons[iconName] || CubeIcon
  }

  const handleInstallMcp = async (mcp: McpIntegration) => {
    console.log('🔧 handleInstallMcp called with:', mcp.id)
    console.log('🔧 Current installingMcp state:', installingMcp)
    console.log('🔧 MCP object:', mcp)
    
    if (installingMcp) {
      console.log('🔧 Preventing double-click, installingMcp is:', installingMcp)
      return // Prevent double-click
    }
    
    // Check if project is running for WordPress MCP
    if (mcp.id === 'wordpress-mcp' && project.status !== 'active') {
      alert('Please start the project first! WordPress needs to be running for the MCP to work.')
      return
    }
    
    try {
      console.log('🔧 Setting installingMcp to:', mcp.id)
      setInstallingMcp(mcp.id)
      // Different path for different project types
      let publicPath = project.path.replace(/\//g, '\\')
      if (project.type === 'wordpress') {
        publicPath = `${publicPath}\\app\\public`
      }
      
      // Special handling for Docker MCP - use PowerShell for better reliability
      if (mcp.id === 'docker-mcp-toolkit') {
        const psCommand = [
          `cd '${publicPath}'`,
          `Write-Host 'Installing Docker MCP Gateway...' -ForegroundColor Green`,
          `Write-Host '================================' -ForegroundColor Green`,
          `Write-Host ''`,
          `Write-Host 'Removing any existing Docker MCP configurations...' -ForegroundColor Yellow`,
          `$null = claude mcp remove MCP_DOCKER 2>&1`,
          `$null = claude mcp remove docker-mcp-gateway 2>&1`,
          `$null = claude mcp remove docker 2>&1`,
          `Write-Host 'Adding Docker MCP Gateway...' -ForegroundColor Yellow`,
          `claude mcp add --transport stdio docker-mcp-gateway docker mcp gateway run`,
          `if ($?) {`,
          `  Write-Host ''`,
          `  Write-Host 'Docker MCP Gateway configured!' -ForegroundColor Green`,
          `  Write-Host ''`,
          `  Write-Host 'Testing installation...' -ForegroundColor Yellow`,
          `  claude mcp list`,
          `  Write-Host ''`,
          `  Write-Host 'Docker MCP Gateway is ready to use!' -ForegroundColor Green`,
          `  Write-Host 'You can now use Docker commands through Claude.' -ForegroundColor Yellow`,
          `} else {`,
          `  Write-Host 'Installation failed. Please check if Docker Desktop is running.' -ForegroundColor Red`,
          `}`,
          `Write-Host ''`,
          `Read-Host 'Press Enter to close'`
        ].join('; ')
        
        await window.electronAPI.runCommand('cmd', [
          '/c', 'start', 'powershell', '-NoExit', '-Command', psCommand
        ])
        
        setInstallingMcp(null) // Reset state
        return // Exit early
      }
      
      // Special handling for Semgrep which requires Python/pipx
      if (mcp.id === 'semgrep') {
        const psCommand = [
          `cd '${publicPath}'`,
          `Write-Host 'Installing ${mcp.name}...' -ForegroundColor Green`,
          `Write-Host '================================' -ForegroundColor Green`,
          `Write-Host ''`,
          `Write-Host 'Checking Python installation...' -ForegroundColor Yellow`,
          `$pythonInstalled = Get-Command python -ErrorAction SilentlyContinue`,
          `if (-not $pythonInstalled) {`,
          `  Write-Host 'ERROR: Python is not installed!' -ForegroundColor Red`,
          `  Write-Host 'Please install Python from https://python.org' -ForegroundColor Yellow`,
          `  Read-Host 'Press Enter to exit'`,
          `  exit`,
          `}`,
          `Write-Host 'Python found. Checking pipx...' -ForegroundColor Green`,
          `$pipxInstalled = Get-Command pipx -ErrorAction SilentlyContinue`,
          `if (-not $pipxInstalled) {`,
          `  Write-Host 'pipx not found. Installing pipx...' -ForegroundColor Yellow`,
          `  python -m pip install --user pipx`,
          `  python -m pipx ensurepath`,
          `  Write-Host 'pipx installed. You may need to restart PowerShell for PATH updates.' -ForegroundColor Yellow`,
          `}`,
          `Write-Host ''`,
          `Write-Host 'Installing Semgrep MCP...' -ForegroundColor Yellow`,
          `${mcp.installCommand}`,
          `if ($?) {`,
          `  Write-Host ''`,
          `  Write-Host '${mcp.name} installed successfully!' -ForegroundColor Green`,
          `  Write-Host 'Claude can now analyze your code for security issues and patterns.' -ForegroundColor Yellow`,
          `  Write-Host ''`,
          `  Write-Host 'Optional: For advanced features, you can add a Semgrep API token:' -ForegroundColor Cyan`,
          `  Write-Host '1. Get token from: https://semgrep.dev/orgs/-/settings/tokens/api' -ForegroundColor White`,
          `  Write-Host '2. Set environment variable: SEMGREP_APP_TOKEN=your_token' -ForegroundColor White`,
          `} else {`,
          `  Write-Host 'Installation failed. Please check the error messages above.' -ForegroundColor Red`,
          `}`
        ].join('; ')
        
        await window.electronAPI.runCommand('cmd', [
          '/c', 'start', 'powershell', '-NoExit', '-Command', psCommand
        ])
      } else if (mcp.requiresApiKey) {
        // Special handling for Jina AI which uses add-json command
        if (mcp.id === 'jina-ai') {
          // Use React modal instead of prompt() which doesn't work in Electron
          setCurrentMcp(mcp)
          setApiKeyInput('')
          setShowApiKeyModal(true)
          return // Exit early - installation continues in modal handler

        }
        
        // Special handling for Ref Tools which uses HTTP transport with API key in URL
        if (mcp.id === 'ref-tools') {
          const psCommand = [
            `cd '${publicPath}'`,
            `Write-Host 'Installing Ref Tools MCP...' -ForegroundColor Green`,
            `Write-Host '================================' -ForegroundColor Green`,
            `Write-Host ''`,
            `Write-Host 'Ref Tools provides access to documentation for APIs, services, and libraries.' -ForegroundColor Yellow`,
            `Write-Host 'Get your API key at: https://ref.tools' -ForegroundColor Cyan`,
            `Write-Host ''`,
            `$apiKey = Read-Host 'Enter your Ref Tools API key'`,
            `if (-not $apiKey) {`,
            `  Write-Host 'No API key provided. Installation cancelled.' -ForegroundColor Red`,
            `  Read-Host 'Press Enter to exit'`,
            `  exit`,
            `}`,
            `Write-Host ''`,
            `Write-Host 'Checking if Ref Tools MCP is already installed...' -ForegroundColor Yellow`,
            `$mcpList = claude mcp list 2>&1`,
            `if ($mcpList -like '*Ref*' -or $mcpList -like '*ref-tools*') {`,
            `  Write-Host 'Ref Tools MCP is already installed. Updating configuration...' -ForegroundColor Yellow`,
            `  $null = claude mcp remove Ref 2>&1`,
            `  $null = claude mcp remove ref-tools 2>&1`,
            `}`,
            `Write-Host 'Installing Ref Tools MCP with your API key...' -ForegroundColor Yellow`,
            `claude mcp add --transport http Ref "https://api.ref.tools/mcp?apiKey=$apiKey"`,
            `if ($?) {`,
            `  Write-Host ''`,
            `  Write-Host 'Ref Tools MCP installed successfully!' -ForegroundColor Green`,
            `  Write-Host 'Claude can now access documentation for APIs, services, and libraries.' -ForegroundColor Yellow`,
            `} else {`,
            `  Write-Host 'Installation failed. Please check the error messages above.' -ForegroundColor Red`,
            `}`
          ].join('; ')
          
          await window.electronAPI.runCommand('cmd', [
            '/c', 'start', 'powershell', '-NoExit', '-Command', psCommand
          ])
          return // Exit early for Ref Tools
        }
        
        // Special handling for Magic MCP which uses npx installation
        if (mcp.id === 'magic-mcp') {
          const psCommand = [
            `cd '${publicPath}'`,
            `Write-Host 'Installing Magic MCP (21st.dev)...' -ForegroundColor Magenta`,
            `Write-Host '================================' -ForegroundColor Magenta`,
            `Write-Host ''`,
            `Write-Host 'Magic MCP helps you create beautiful UI components with AI!' -ForegroundColor Yellow`,
            `Write-Host ''`,
            `Write-Host 'IMPORTANT: You need an API key from 21st.dev' -ForegroundColor Cyan`,
            `Write-Host 'Get your API key at: https://magic.21st.dev/console' -ForegroundColor Cyan`,
            `Write-Host ''`,
            `$apiKey = Read-Host 'Enter your Magic API key'`,
            `if (-not $apiKey) {`,
            `  Write-Host 'No API key provided. Installation cancelled.' -ForegroundColor Red`,
            `  Read-Host 'Press Enter to exit'`,
            `  exit`,
            `}`,
            `Write-Host ''`,
            `Write-Host 'Installing Magic MCP using Claude CLI...' -ForegroundColor Yellow`,
            `npx @21st-dev/cli@latest install claude --api-key $apiKey`,
            `if ($?) {`,
            `  Write-Host ''`,
            `  Write-Host '✨ Magic MCP installed successfully!' -ForegroundColor Green`,
            `  Write-Host ''`,
            `  Write-Host 'IMPORTANT: You need to RESTART Claude Desktop!' -ForegroundColor Yellow`,
            `  Write-Host ''`,
            `  Write-Host 'After restart, you can use Magic by typing:' -ForegroundColor Cyan`,
            `  Write-Host '  /ui create a modern pricing card' -ForegroundColor White`,
            `  Write-Host '  /ui build a responsive navigation menu' -ForegroundColor White`,
            `  Write-Host ''`,
            `  Write-Host 'Magic MCP will NOT appear in "claude mcp list"' -ForegroundColor Yellow`,
            `  Write-Host 'It works through the /ui command instead!' -ForegroundColor Yellow`,
            `} else {`,
            `  Write-Host ''`,
            `  Write-Host 'Installation failed. Please check the error messages above.' -ForegroundColor Red`,
            `  Write-Host 'Make sure you have Node.js installed and npx is available.' -ForegroundColor Yellow`,
            `}`
          ].join('; ')
          
          await window.electronAPI.runCommand('cmd', [
            '/c', 'start', 'powershell', '-NoExit', '-Command', psCommand
          ])
          return // Exit early for Magic MCP
        }
        
        // Special handling for Exa which uses HTTP transport with API key in URL
        if (mcp.id === 'exa') {
          const psCommand = [
            `cd '${publicPath}'`,
            `Write-Host 'Installing Exa MCP...' -ForegroundColor Green`,
            `Write-Host '================================' -ForegroundColor Green`,
            `Write-Host ''`,
            `Write-Host 'To use Exa MCP, you need an API key from Exa AI.' -ForegroundColor Yellow`,
            `Write-Host 'Get your API key at: https://dashboard.exa.ai/api-keys' -ForegroundColor Cyan`,
            `Write-Host ''`,
            `$apiKey = Read-Host 'Enter your Exa API key'`,
            `if (-not $apiKey) {`,
            `  Write-Host 'No API key provided. Installation cancelled.' -ForegroundColor Red`,
            `  Read-Host 'Press Enter to exit'`,
            `  exit`,
            `}`,
            `Write-Host ''`,
            `Write-Host 'Checking if Exa MCP is already installed...' -ForegroundColor Yellow`,
            `$mcpList = claude mcp list 2>&1`,
            `if ($mcpList -like '*exa*') {`,
            `  Write-Host 'Exa MCP is already installed. Updating configuration...' -ForegroundColor Yellow`,
            `  $null = claude mcp remove exa 2>&1`,
            `}`,
            `Write-Host 'Installing Exa MCP with your API key...' -ForegroundColor Yellow`,
            `claude mcp add --transport http exa "https://mcp.exa.ai/mcp?exaApiKey=$apiKey"`,
            `if ($?) {`,
            `  Write-Host ''`,
            `  Write-Host 'Exa MCP installed successfully!' -ForegroundColor Green`,
            `  Write-Host 'Claude can now search the web using Exa AI.' -ForegroundColor Yellow`,
            `} else {`,
            `  Write-Host 'Installation failed. Please check the error messages above.' -ForegroundColor Red`,
            `}`
          ].join('; ')
          
          await window.electronAPI.runCommand('cmd', [
            '/c', 'start', 'powershell', '-NoExit', '-Command', psCommand
          ])
          return // Exit early for Exa
        }
        
        // For other MCPs that require API key
        const apiKeyPrompt = `Write-Host ''; $apiKey = Read-Host 'Enter your API key for ${mcp.name}'`
        
        const psCommand = [
          `cd '${publicPath}'`,
          `Write-Host 'Installing ${mcp.name}...' -ForegroundColor Green`,
          `Write-Host '================================' -ForegroundColor Green`,
          apiKeyPrompt,
          `if (-not $apiKey) {`,
          `  Write-Host 'No API key provided. Installation cancelled.' -ForegroundColor Red`,
          `  Read-Host 'Press Enter to exit'`,
          `  exit`,
          `}`,
          `Write-Host ''`,
          `Write-Host 'Installing with API key...' -ForegroundColor Yellow`,
          `${mcp.installCommand}`,
          `if ($?) {`,
          `  Write-Host ''`,
          `  Write-Host 'Configuring API key...' -ForegroundColor Yellow`,
          `  ${mcp.configCommand}$apiKey`,
          `  Write-Host ''`,
          `  Write-Host '${mcp.name} installed and configured successfully!' -ForegroundColor Green`,
          `  Write-Host 'Claude can now use ${mcp.name} features.' -ForegroundColor Yellow`,
          `} else {`,
          `  Write-Host 'Installation failed. Please check the error messages above.' -ForegroundColor Red`,
          `}`
        ].join('; ')
        
        await window.electronAPI.runCommand('cmd', [
          '/c', 'start', 'powershell', '-NoExit', '-Command', psCommand
        ])
      } else {
        // For MCPs that don't require API key
        const psCommand = [
          `cd '${publicPath}'`,
          `Write-Host 'Installing ${mcp.name}...' -ForegroundColor Green`,
          `Write-Host '================================' -ForegroundColor Green`,
          `Write-Host ''`,
          `${mcp.installCommand}`,
          `Write-Host ''`,
          `Write-Host '${mcp.name} installed successfully!' -ForegroundColor Green`,
          `Write-Host 'Claude can now use ${mcp.name} features.' -ForegroundColor Yellow`
        ].join('; ')
        
        await window.electronAPI.runCommand('cmd', [
          '/c', 'start', 'powershell', '-NoExit', '-Command', psCommand
        ])
      }
    } catch (error) {
      console.error(`Failed to install ${mcp.name}:`, error)
    } finally {
      setInstallingMcp(null)
    }
  }

  const handleAutoLogin = async () => {
    try {
      const tempPath = `${project.path}\\auto-login.html`.replace(/\//g, '\\')
      
      // Create PowerShell script to generate HTML file
      const psCommand = [
        `$html = @"`,
        `<!DOCTYPE html>`,
        `<html>`,
        `<head>`,
        `  <title>Auto Login to WordPress</title>`,
        `  <style>`,
        `    body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }`,
        `    .loading { text-align: center; }`,
        `    .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #6366f1; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }`,
        `    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`,
        `    p { color: #4b5563; font-size: 16px; }`,
        `  </style>`,
        `</head>`,
        `<body>`,
        `  <div class="loading">`,
        `    <div class="spinner"></div>`,
        `    <p>Logging in to WordPress Admin...</p>`,
        `  </div>`,
        `  <form id="loginform" action="http://localhost:${project.wpPort}/wp-login.php" method="post" style="display:none;">`,
        `    <input type="text" name="log" value="${wpCredentials.username}" />`,
        `    <input type="password" name="pwd" value="${wpCredentials.password}" />`,
        `    <input type="hidden" name="wp-submit" value="Log In" />`,
        `    <input type="hidden" name="redirect_to" value="http://localhost:${project.wpPort}/wp-admin/" />`,
        `  </form>`,
        `  <script>`,
        `    setTimeout(function() { document.getElementById('loginform').submit(); }, 500);`,
        `  </script>`,
        `</body>`,
        `</html>`,
        `"@`,
        `[System.IO.File]::WriteAllText('${tempPath}', $html, [System.Text.UTF8Encoding]::new($false))`,
        `Start-Process "file:///${tempPath.replace(/\\/g, '/')}"`,
        `Start-Sleep -Seconds 10`,
        `Remove-Item '${tempPath}' -Force -ErrorAction SilentlyContinue`
      ].join('\n')

      // Execute PowerShell command
      await window.electronAPI.runCommand('powershell', [
        '-WindowStyle', 'Hidden',
        '-Command', psCommand
      ])

    } catch (error) {
      console.error('Failed to auto-login:', error)
      // Fallback to regular login page
      handleOpenLink(`http://localhost:${project.wpPort}/wp-admin`)
    }
  }

  const handleInstallGitHubCLI = async () => {
    try {
      await window.electronAPI.runCommand('cmd', [
        '/c',
        'start',
        'powershell',
        '-Verb',
        'RunAs',
        '-ArgumentList',
        `"-NoExit", "-Command", "Write-Host 'Installing GitHub CLI...' -ForegroundColor Cyan; winget install --id GitHub.cli; Write-Host 'GitHub CLI installation complete!' -ForegroundColor Green; Write-Host 'You can now use: gh --help' -ForegroundColor Yellow; Read-Host 'Press Enter to continue'"`
      ])
    } catch (error) {
      console.error('Failed to install GitHub CLI:', error)
    }
  }

  const handleInstallTunnelmole = async () => {
    try {
      // Create a PowerShell script
      const scriptContent = `
Write-Host 'Installing Tunnelmole globally...' -ForegroundColor Cyan
npm install -g tunnelmole
if ($?) {
    Write-Host 'Tunnelmole installation complete!' -ForegroundColor Green
    Write-Host 'You can now use: tmole <port>' -ForegroundColor Yellow
} else {
    Write-Host 'Installation failed!' -ForegroundColor Red
}
Read-Host 'Press Enter to continue'
`.trim()

      const scriptPath = `${project.path}\\install-tunnelmole.ps1`
      await window.electronAPI.writePsScript(scriptPath, scriptContent)
      
      await window.electronAPI.runCommand('cmd', [
        '/c',
        'start',
        'powershell',
        '-NoExit',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        `"${scriptPath}"`
      ])
    } catch (error) {
      console.error('Failed to install Tunnelmole:', error)
    }
  }

  const handleStartTunnel = async () => {
    console.log('Starting tunnel...')
    try {
      const port = project.wpPort || 8080
      
      // Set the state to active immediately
      setIsTunnelActive(true)
      setTunnelUrl(`Check PowerShell window for your public URL`)
      console.log('Tunnel state set to active')
      
      // Create a PowerShell script
      const scriptContent = `
Write-Host 'Starting Tunnelmole tunnel on port ${port}...' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Your public URLs will appear below:' -ForegroundColor Yellow
Write-Host '=================================' -ForegroundColor Yellow
tmole ${port}
`.trim()

      const scriptPath = `${project.path}\\start-tunnelmole.ps1`
      await window.electronAPI.writePsScript(scriptPath, scriptContent)
      
      await window.electronAPI.runCommand('cmd', [
        '/c',
        'start',
        'powershell',
        '-NoExit',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        `"${scriptPath}"`
      ])

      console.log('PowerShell command executed successfully')
    } catch (error) {
      console.error('Failed to start tunnel:', error)
      setIsTunnelActive(false)
      setTunnelUrl(null)
    }
  }

  const handleStopTunnel = () => {
    setIsTunnelActive(false)
    setTunnelUrl(null)
    // Note: User needs to manually close the PowerShell window with Ctrl+C
  }


  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleStartStop}
          disabled={isStarting || isDeleting}
          className={clsx(
            'p-4 rounded-lg font-medium transition-all flex items-center justify-center gap-3',
            project.status === 'active'
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30',
            (isStarting || isDeleting) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {project.status === 'active' ? (
            <>
              <StopIcon className="h-5 w-5" />
              <span>Stop Project</span>
            </>
          ) : (
            <>
              <PlayIcon className="h-5 w-5" />
              <span>Start Project</span>
            </>
          )}
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-4 bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <TrashIcon className="h-5 w-5" />
          <span>Delete Project</span>
        </button>
      </div>

      {/* Service Links - Only show when active */}
      {project.status === 'active' && (project.type === 'wordpress' || project.type === 'nextjs-fullstack') && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Services</h3>
          <div className="grid grid-cols-2 gap-3">
            {project.type === 'wordpress' ? (
              <>
                <button
                  onClick={() => handleOpenLink(`http://localhost:${project.wpPort}`)}
                  className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <GlobeAltIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">WordPress</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">localhost:{project.wpPort}</p>
                  </div>
                </button>
                <button
                  onClick={handleAutoLogin}
                  className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  title="Click for auto-login"
                >
                  <KeyIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">WP Admin</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {credentialsLoaded 
                        ? `${wpCredentials.username} / ${wpCredentials.password}`
                        : 'Loading credentials...'}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleOpenLink(`http://localhost:${project.pmaPort}`)}
                  className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <CircleStackIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">phpMyAdmin</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Database manager</p>
                  </div>
                </button>
              </>
            ) : project.type === 'nextjs-fullstack' ? (
              <>
                <button
                  onClick={() => handleOpenLink(`http://localhost:${project.wpPort}`)}
                  className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <GlobeAltIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Frontend</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Next.js - localhost:{project.wpPort}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleOpenLink(`http://localhost:${project.backendPort}/api/docs`)}
                  className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <CodeBracketIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">API Docs</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Swagger - localhost:{project.backendPort}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleOpenLink(`http://localhost:${project.pmaPort}`)}
                  className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <CircleStackIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Adminer</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PostgreSQL manager</p>
                  </div>
                </button>
              </>
            ) : null}
            <button
              onClick={() => handleOpenLink(`http://localhost:${project.mailPort}`)}
              className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <EnvelopeIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Mailpit</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email testing</p>
              </div>
            </button>
          </div>
          
          {/* Tunnelmole Live Share */}
          <div className="mt-4 p-4 bg-purple-50 dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-600">
            <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-400 mb-2 flex items-center gap-2">
              <GlobeAltIcon className="h-4 w-4" />
              Tunnelmole Live Share
            </h4>
            
            {/* Debug info */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Debug: isTunnelActive = {String(isTunnelActive)}, tunnelUrl = {tunnelUrl || 'null'}
            </div>
            
            {!isTunnelActive ? (
              <div className="space-y-3">
                <p className="text-sm text-purple-700 dark:text-gray-400">
                  Share your local WordPress site with anyone using a public URL.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleInstallTunnelmole}
                    className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                  >
                    Install Tunnelmole
                  </button>
                  <button
                    onClick={handleStartTunnel}
                    className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                  >
                    Start Tunnel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Tunnel Active</span>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-gray-700 rounded-md">
                  <p className="text-xs text-purple-800 dark:text-purple-300 mb-1">Check PowerShell window for your public URL</p>
                  <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                    It will look like: https://xxxxx.tunnelmole.net
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-md">
                  <p className="text-xs text-blue-800 dark:text-blue-400">
                    <strong>✨ No configuration needed!</strong> WordPress automatically works with any domain.
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">
                    Just copy the tunnel URL and access it directly in your browser.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleStopTunnel}
                    className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  >
                    Stop Tunnel
                  </button>
                </div>
                <p className="text-xs text-purple-600 dark:text-gray-400">
                  To stop the tunnel, close the PowerShell window or press Ctrl+C
                </p>
              </div>
            )}
          </div>
          
          {/* Database Credentials */}
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-600">
            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-2 flex items-center gap-2">
              <KeyIcon className="h-4 w-4" />
              {project.type === 'fiskal-ai' ? 'PostgreSQL' : 'MySQL'} Database Credentials
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-yellow-700 dark:text-gray-400 font-medium">Database:</p>
                <code className="text-xs bg-yellow-100 dark:bg-gray-700 text-yellow-900 dark:text-white px-2 py-1 rounded font-mono">
                  {project.type === 'nextjs-fullstack' ? 'fiskal_db' : `${project.name}_db`}
                </code>
              </div>
              <div>
                <p className="text-yellow-700 dark:text-gray-400 font-medium">User:</p>
                <code className="text-xs bg-yellow-100 dark:bg-gray-700 text-yellow-900 dark:text-white px-2 py-1 rounded font-mono">
                  {project.type === 'nextjs-fullstack' ? 'fiskal_user' : `${project.name}_user`}
                </code>
              </div>
              <div>
                <p className="text-yellow-700 dark:text-gray-400 font-medium">Password:</p>
                <code className="text-xs bg-yellow-100 dark:bg-gray-700 text-yellow-900 dark:text-white px-2 py-1 rounded font-mono">secure_password_123</code>
              </div>
              {project.type === 'wordpress' && (
                <div>
                  <p className="text-yellow-700 dark:text-gray-400 font-medium">Root Password:</p>
                  <code className="text-xs bg-yellow-100 dark:bg-gray-700 text-yellow-900 dark:text-white px-2 py-1 rounded font-mono">root_password_123</code>
                </div>
              )}
              <div>
                <p className="text-yellow-700 dark:text-gray-400 font-medium">Host:</p>
                <code className="text-xs bg-yellow-100 dark:bg-gray-700 text-yellow-900 dark:text-white px-2 py-1 rounded font-mono">localhost:{project.dbPort}</code>
              </div>
              <div>
                <p className="text-yellow-700 dark:text-gray-400 font-medium">Container:</p>
                <code className="text-xs bg-yellow-100 dark:bg-gray-700 text-yellow-900 dark:text-white px-2 py-1 rounded font-mono">
                  {project.type === 'nextjs-fullstack' ? 'postgres' : 'mysql'}
                </code>
              </div>
            </div>
            <p className="text-xs text-yellow-600 dark:text-gray-400 mt-2">
              Use these credentials to connect to {project.type === 'nextjs-fullstack' ? 'PostgreSQL' : 'MySQL'} from your application or external tools.
            </p>
          </div>
          
          {/* Access URLs */}
          {project.type === 'wordpress' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
                <GlobeAltIcon className="h-4 w-4" />
                WordPress Access URLs
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-blue-700 dark:text-gray-400 font-medium">Local Browser Access:</p>
                  <code className="text-xs bg-blue-100 dark:bg-gray-700 text-blue-900 dark:text-white px-2 py-1 rounded font-mono">{`http://localhost:${project.wpPort}`}</code>
                </div>
                <div>
                  <p className="text-blue-700 dark:text-gray-400 font-medium">Docker MCP Access:</p>
                  <code className="text-xs bg-blue-100 dark:bg-gray-700 text-blue-900 dark:text-white px-2 py-1 rounded font-mono">{`http://host.docker.internal:${project.wpPort}`}</code>
                </div>
                <div>
                  <p className="text-blue-700 dark:text-gray-400 font-medium">Container-to-Container:</p>
                  <code className="text-xs bg-blue-100 dark:bg-gray-700 text-blue-900 dark:text-white px-2 py-1 rounded font-mono">{`http://${project.name}_wordpress:80`}</code>
                </div>
              </div>
              <p className="text-xs text-blue-600 dark:text-gray-400 mt-2">
                WordPress automatically supports all these URLs. Use Docker URL for MCP tools like Puppeteer/Playwright.
              </p>
            </div>
          )}
          
          {project.type === 'nextjs-fullstack' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
                <GlobeAltIcon className="h-4 w-4" />
                Next.js Full Stack Services
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-blue-700 dark:text-gray-400 font-medium">Redis Cache:</p>
                  <code className="text-xs bg-blue-100 dark:bg-gray-700 text-blue-900 dark:text-white px-2 py-1 rounded font-mono">{`redis://localhost:${project.redisPort}`}</code>
                </div>
                <div>
                  <p className="text-blue-700 dark:text-gray-400 font-medium">Browser Context Server:</p>
                  <code className="text-xs bg-blue-100 dark:bg-gray-700 text-blue-900 dark:text-white px-2 py-1 rounded font-mono">{`http://localhost:${project.browserPort}`}</code>
                </div>
              </div>
              <p className="text-xs text-blue-600 dark:text-gray-400 mt-2">
                Browser Context Server is optimized for Claude Code web scraping and testing.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Development Tools */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Development Tools</h3>
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={handleOpenVSCode}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <CodeBracketIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">VS Code</span>
          </button>
          <button
            onClick={handleOpenCLI}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <CommandLineIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Terminal</span>
          </button>
          <button
            onClick={handleOpenFolder}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FolderOpenIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Explorer</span>
          </button>
          <button
            onClick={handleOpenClaudia}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <CubeTransparentIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Claudia</span>
          </button>
          <button
            onClick={handleInstallGitHubCLI}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <CommandLineIcon className="h-8 w-8 text-gray-700 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub CLI</span>
          </button>
        </div>
      </div>

      {/* WordPress Setup */}
      {project.type === 'wordpress' && project.status === 'active' && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">WordPress Setup</h3>
          <button
            onClick={handleInstallWordPress}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
          >
            <ArrowDownTrayIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <div className="text-left flex-1">
              <p className="font-medium text-gray-900 dark:text-white">Install WordPress</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Run WP installation script</p>
            </div>
          </button>
        </div>
      )}

      {/* Claude Code & AI Frameworks */}
      {project.status === 'active' && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Claude Code & AI Frameworks</h3>
          <div className="space-y-3">
            <button
              onClick={handleInstallClaudeCode}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
            >
              <CommandLineIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="text-left flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Install Claude Code</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI development assistant</p>
              </div>
            </button>
            
            <button
              onClick={handleInstallPRPs}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
            >
              <DocumentTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="text-left flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Install PRPs Framework</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI engineering methodology</p>
              </div>
            </button>
            
            <button
              onClick={handleInstallContextEngineering}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
            >
              <BookOpenIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="text-left flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Install Context Engineering</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Complete AI context framework</p>
              </div>
            </button>
            
            <button
              onClick={handleInstallClaudia}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
            >
              <CubeTransparentIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="text-left flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Install Claudia</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Build GUI for Claude Code</p>
              </div>
            </button>
            
            <button
              onClick={handleInstallSuperClaude}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
            >
              <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="text-left flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Install SuperClaude</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">16 slash commands for Claude Code</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* WordPress MCP Workflow */}
      {project.type === 'wordpress' && project.status === 'active' && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">WordPress MCP Integration</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleInstallWordPressMCP}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              title="Step 1: Build WordPress MCP"
            >
              <PuzzlePieceIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">1. Build MCP</span>
            </button>
            <button
              onClick={handleCopyMCPPlugin}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              title="Step 2: Copy MCP Plugin"
            >
              <FolderIcon className="h-5 w-5 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">2. Copy Plugin</span>
            </button>
            <button
              onClick={handleInstallComposerDeps}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              title="Step 3: Install Composer Dependencies"
            >
              <CubeIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">3. Composer</span>
            </button>
            <button
              onClick={handleConfigureMCPToken}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              title="Step 4: Configure MCP Token"
            >
              <KeyIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">4. Configure</span>
            </button>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-3 text-center">
            Enable Claude to interact with your WordPress site
          </p>
        </div>
      )}

      {/* Additional MCP Integrations */}
      {project.status === 'active' && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Additional MCP Integrations</h3>
          <div className="grid grid-cols-2 gap-3">
            {mcpIntegrations.length > 0 ? (
              mcpIntegrations.map((mcp) => {
                const IconComponent = getIcon(mcp.icon)
                return (
                  <button
                    key={mcp.id}
                    onClick={() => handleInstallMcp(mcp)}
                    disabled={installingMcp === mcp.id}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group",
                      installingMcp === mcp.id
                        ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50"
                        : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                    title={mcp.description}
                  >
                    {installingMcp === mcp.id ? (
                      <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <IconComponent className={`h-5 w-5 ${mcp.iconColor} group-hover:scale-110 transition-transform`} />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mcp.name}</span>
                    {mcp.requiresApiKey && installingMcp !== mcp.id && (
                      <KeyIcon className="h-3 w-3 text-amber-500 dark:text-amber-400 ml-auto" />
                    )}
                  </button>
                )
              })
            ) : (
              <div className="col-span-2 text-center py-4">
                <PlusIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Ready to add MCP integrations</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tell me which MCP you want to install</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Project Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Path</span>
            <code className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 rounded">{project.path}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Created</span>
            <span className="text-gray-700 dark:text-gray-300">{new Date(project.createdAt).toLocaleString()}</span>
          </div>

        </div>
      </div>

      {/* API Key Input Modal */}
      {showApiKeyModal && currentMcp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {currentMcp.name} Installation
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {currentMcp.description}
            </p>
            
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
              Get your API key at: {currentMcp.documentation}
            </p>
            
            <div className="mb-4">
              <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your API key:
              </label>
              <input
                id="api-key-input"
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter API key..."
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowApiKeyModal(false)
                  setCurrentMcp(null)
                  setApiKeyInput('')
                  setInstallingMcp(null)
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApiKeyConfirm}
                disabled={!apiKeyInput.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}