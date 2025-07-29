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
  ClockIcon,
  ServerStackIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { Project } from '../types'
import { useState } from 'react'

interface ProjectCardProps {
  project: Project
  onRefresh: () => void
}

export default function ProjectCard({ project, onRefresh }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

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
        // Start containers
        const startPath = `${project.path}\\start.bat`
        await window.electronAPI.runCommand('cmd', ['/c', 'start', startPath])
      }
      
      setTimeout(onRefresh, 2000)
    } catch (error) {
      console.error('Failed to start/stop project:', error)
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
      await window.electronAPI.runCommand('code', [project.path])
    } catch (error) {
      console.error('Failed to open VS Code:', error)
    }
  }

  const handleInstallWordPress = async () => {
    try {
      const installPath = `${project.path}\\install-wp.bat`
      
      // Using PowerShell as per CLAUDE.md guidelines
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
      const publicPath = `${project.path}\\app\\public`
      
      const psCommand = [
        `cd '${publicPath}'`,
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
      
      // Build WordPress MCP from source as per CLAUDE.md Step 1
      const commands = [
        `cd '${publicPath}'`,
        `Write-Host 'Step 1: Build WordPress MCP from Source' -ForegroundColor Green`,
        `Write-Host '=======================================' -ForegroundColor Green`,
        `Write-Host ''`,
        // Check if already exists
        `if (Test-Path 'wordpress-mcp') { Write-Host 'WARNING: wordpress-mcp folder already exists!' -ForegroundColor Yellow; Write-Host 'Delete it first or skip this step.' -ForegroundColor Yellow; Read-Host 'Press Enter to exit'; exit }`,
        // Clone repository
        `Write-Host 'Cloning WordPress MCP repository...' -ForegroundColor Yellow`,
        `git clone https://github.com/Automattic/wordpress-mcp.git`,
        `if (-not $?) { Write-Host 'ERROR: Failed to clone repository!' -ForegroundColor Red; Write-Host 'Make sure Git is installed and you have internet connection.' -ForegroundColor Yellow; Read-Host 'Press Enter to exit'; exit }`,
        // Navigate to directory
        `cd wordpress-mcp`,
        // Install Composer dependencies
        `Write-Host ''`,
        `Write-Host 'Installing Composer dependencies...' -ForegroundColor Yellow`,
        `composer install --no-dev`,
        `if (-not $?) { Write-Host 'ERROR: Composer install failed!' -ForegroundColor Red; Write-Host 'Make sure Composer is installed.' -ForegroundColor Yellow; Read-Host 'Press Enter to exit'; exit }`,
        // Install npm dependencies and build
        `Write-Host ''`,
        `Write-Host 'Installing npm dependencies...' -ForegroundColor Yellow`,
        `npm install`,
        `if (-not $?) { Write-Host 'ERROR: npm install failed!' -ForegroundColor Red; Read-Host 'Press Enter to exit'; exit }`,
        `Write-Host ''`,
        `Write-Host 'Building WordPress MCP...' -ForegroundColor Yellow`,
        `npm run build`,
        `if (-not $?) { Write-Host 'ERROR: Build failed!' -ForegroundColor Red; Read-Host 'Press Enter to exit'; exit }`,
        // Return to parent directory
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

  const handleCopyMCPPlugin = async () => {
    try {
      const publicPath = `${project.path}\\app\\public`.replace(/\//g, '\\')
      const dockerCommand = `docker exec ${project.name}_wordpress composer install --no-dev --working-dir=/var/www/html/wp-content/plugins/wordpress-mcp`
      
      // Create a simpler PowerShell script that uses single-line commands
      const commands = [
        `cd '${publicPath}'`,
        `Write-Host 'Step 2: Copy WordPress MCP Plugin' -ForegroundColor Green`,
        `Write-Host '=================================' -ForegroundColor Green`,
        `Write-Host ''`,
        // Check if source exists
        `if (-not (Test-Path 'wordpress-mcp')) { Write-Host 'ERROR: wordpress-mcp folder not found!' -ForegroundColor Red; Write-Host 'Please run Step 1 first (puzzle icon)' -ForegroundColor Yellow; Read-Host 'Press Enter to exit'; exit }`,
        // Create plugin directory
        `$pluginPath = 'wp-content\\plugins\\wordpress-mcp'`,
        `if (Test-Path $pluginPath) { Write-Host 'Removing existing plugin...' -ForegroundColor Yellow; Remove-Item $pluginPath -Recurse -Force }`,
        `$null = New-Item -ItemType Directory -Path $pluginPath -Force`,
        // Copy only production files
        `Write-Host 'Copying plugin files...' -ForegroundColor Yellow`,
        // Copy main plugin file
        `Copy-Item 'wordpress-mcp\\wordpress-mcp.php' $pluginPath -Force`,
        // Copy essential folders
        `if (Test-Path 'wordpress-mcp\\includes') { Write-Host '  - Copying includes folder...' -ForegroundColor Gray; Copy-Item 'wordpress-mcp\\includes' "$pluginPath\\includes" -Recurse -Force }`,
        `if (Test-Path 'wordpress-mcp\\vendor') { Write-Host '  - Copying vendor folder...' -ForegroundColor Gray; Copy-Item 'wordpress-mcp\\vendor' "$pluginPath\\vendor" -Recurse -Force }`,
        `if (Test-Path 'wordpress-mcp\\build') { Write-Host '  - Copying build folder...' -ForegroundColor Gray; Copy-Item 'wordpress-mcp\\build' "$pluginPath\\build" -Recurse -Force }`,
        `if (Test-Path 'wordpress-mcp\\docs') { Write-Host '  - Copying docs folder...' -ForegroundColor Gray; Copy-Item 'wordpress-mcp\\docs' "$pluginPath\\docs" -Recurse -Force }`,
        // Copy readme files
        `if (Test-Path 'wordpress-mcp\\Readme.md') { Copy-Item 'wordpress-mcp\\Readme.md' $pluginPath -Force }`,
        `if (Test-Path 'wordpress-mcp\\README.md') { Copy-Item 'wordpress-mcp\\README.md' $pluginPath -Force }`,
        // DO NOT copy src folder or package.json
        `Write-Host '  - Skipping src folder and package.json' -ForegroundColor DarkGray`,
        `Write-Host 'Plugin files copied successfully!' -ForegroundColor Green`,
        `Write-Host ''`,
        // Check for vendor folder
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
      
      // Join commands with semicolon for single-line execution
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
      
      // Copy the PowerShell script to project directory
      const copyResult = await window.electronAPI.copyMcpScript(project.path, wpUrl, publicPath)
      
      if (!copyResult.success) {
        console.error('Failed to copy MCP script:', copyResult.error)
        return
      }
      
      // Execute the PowerShell script with parameters
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
              <FolderIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.type === 'wordpress' ? 'WordPress Project' : project.type}</p>
            </div>
          </div>
          <div className={clsx(
            'px-3 py-1 rounded-full text-xs font-medium',
            project.status === 'active' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          )}>
            {project.status === 'active' ? 'Running' : 'Stopped'}
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <ServerStackIcon className="h-4 w-4" />
            <span>Port {project.wpPort}</span>
          </div>
        </div>
      </div>

      {/* Service Links - Only show when active */}
      {project.status === 'active' && project.type === 'wordpress' && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOpenLink(`http://localhost:${project.wpPort}`)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <GlobeAltIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-700 dark:text-gray-300">WordPress</span>
            </button>
            <button
              onClick={() => handleOpenLink(`http://localhost:${project.pmaPort}`)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <CircleStackIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-gray-700 dark:text-gray-300">phpMyAdmin</span>
            </button>
            <button
              onClick={() => handleOpenLink(`http://localhost:${project.mailPort}`)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <EnvelopeIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-gray-700 dark:text-gray-300">Mailpit</span>
            </button>
            <button
              onClick={() => handleOpenLink(`http://localhost:${project.wpPort}/wp-admin`)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <KeyIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-gray-700 dark:text-gray-300">WP Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenVSCode}
              className="p-2.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Open in VS Code"
            >
              <CodeBracketIcon className="h-5 w-5" />
            </button>
            {project.type === 'wordpress' && project.status === 'active' && (
              <>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                <button
                  onClick={handleInstallWordPress}
                  className="p-2.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Install WordPress"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleInstallClaudeCode}
                  className="p-2.5 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  title="Install Claude Code"
                >
                  <CommandLineIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleInstallWordPressMCP}
                  className="p-2.5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  title="1. Build WordPress MCP"
                >
                  <PuzzlePieceIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCopyMCPPlugin}
                  className="p-2.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="2. Copy MCP Plugin"
                >
                  <FolderIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleInstallComposerDeps}
                  className="p-2.5 text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                  title="3. Install Composer Dependencies"
                >
                  <CubeIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleConfigureMCPToken}
                  className="p-2.5 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                  title="4. Configure MCP Token"
                >
                  <KeyIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartStop}
              disabled={isStarting || isDeleting}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
                project.status === 'active'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30',
                (isStarting || isDeleting) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {project.status === 'active' ? (
                <>
                  <StopIcon className="h-4 w-4" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  <span>Start</span>
                </>
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              title="Delete Project"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}