import React, { useState, useEffect } from 'react';
import { useStore } from '../stores/useStore';

interface ArchonStatus {
  service: any;
  health: any;
  isRunning: boolean;
}

const TopBar: React.FC = () => {
  const { showToast } = useStore();
  const [archonStatus, setArchonStatus] = useState<ArchonStatus | null>(null);
  const [archonLoading, setArchonLoading] = useState(false);

  // Check Archon status on component mount
  useEffect(() => {
    checkArchonStatus();
  }, []);

  const checkArchonStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:9976/api/system/archon/status');
      if (response.ok) {
        const result = await response.json();
        setArchonStatus(result.data);
      }
    } catch (error) {
      // Archon not initialized or error - that's fine
      setArchonStatus(null);
    }
  };

  const executeCommand = async (command: string, args: string[] = []) => {
    try {
      const response = await fetch('http://127.0.0.1:9976/api/system/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, args })
      });

      if (!response.ok) {
        throw new Error('Command execution failed');
      }

      const result = await response.json();
      
      if (result.data?.executed) {
        showToast({
          type: 'success',
          message: `Command executed: ${command}`
        });
      } else {
        showToast({
          type: 'error',
          message: `Command failed`
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: `Failed to execute command`
      });
    }
  };

  const executeClaudeCommand = async (claudeArgs: string = '') => {
    // Open Windows Terminal in dev-launcher folder and run claude command
    const devLauncherPath = 'C:/Users/jfran/Documents/dev-launcher';
    const claudeCommand = claudeArgs ? `claude ${claudeArgs}` : 'claude';
    
    // Use wt.exe to open terminal and execute the command
    const wtCommand = 'wt.exe';
    const wtArgs = [
      '-d', devLauncherPath,
      'cmd.exe', '/k', claudeCommand
    ];
    
    await executeCommand(wtCommand, wtArgs);
  };

  const openTerminal = () => {
    // Open Windows Terminal in the current working directory
    const currentPath = window.location.hostname === 'localhost' 
      ? 'C:/Users/jfran/Documents/dev-launcher'  // Dev Launcher's own path
      : '.';
    executeCommand('wt.exe', ['-d', currentPath]);
  };

  const openVSCode = () => {
    // Open VS Code in the dev-launcher project folder
    const projectPath = 'C:/Users/jfran/Documents/dev-launcher';
    executeCommand('code', [projectPath]);
  };

  const openArchon = () => {
    if (!archonStatus?.isRunning) {
      showToast({
        type: 'warning',
        message: 'Archon is not running. Please start it first from Settings.'
      });
      return;
    }

    // Open Archon UI in default browser
    const archonUrl = 'http://localhost:4000';
    executeCommand('cmd.exe', ['/c', 'start', archonUrl]);
  };

  const toggleArchon = async () => {
    if (archonLoading) return;
    
    setArchonLoading(true);
    try {
      const action = archonStatus?.isRunning ? 'stop' : 'start';
      const response = await fetch(`http://127.0.0.1:9976/api/system/archon/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        showToast({
          type: 'success',
          message: result.data.message
        });
        
        // Wait a moment then refresh status
        setTimeout(checkArchonStatus, 1000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Archon operation failed');
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: `Archon ${archonStatus?.isRunning ? 'stop' : 'start'} failed: ${error.message}`
      });
    } finally {
      setArchonLoading(false);
    }
  };

  // Get Archon button appearance based on status
  const getArchonButtonClass = () => {
    if (archonLoading) return 'btn-ghost text-sm opacity-50 cursor-not-allowed';
    if (!archonStatus?.service) return 'btn-ghost text-sm text-yellow-400'; // Not configured
    if (archonStatus.isRunning) return 'btn-ghost text-sm text-green-400'; // Running
    return 'btn-ghost text-sm text-gray-400'; // Stopped
  };

  const getArchonButtonTitle = () => {
    if (archonLoading) return 'Archon operation in progress...';
    if (!archonStatus?.service) return 'Archon not configured - Setup required';
    if (archonStatus.isRunning) return 'Archon is running - Click to open UI';
    return 'Archon is stopped - Click to start';
  };

  return (
    <div className="h-14 bg-neutral-950/50 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <span className="text-white font-bold text-sm">DL</span>
          </div>
          <span className="text-lg font-semibold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
            Dev Launcher
          </span>
          <span className="text-sm text-neutral-500">by DataDox</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => executeClaudeCommand('')}
          className="btn-ghost text-sm"
          title="Open Claude CLI"
        >
          Claude
        </button>
        
        <button
          onClick={() => executeClaudeCommand('-c')}
          className="btn-ghost text-sm"
          title="Claude Continue"
        >
          Continue
        </button>
        
        <button
          onClick={() => executeClaudeCommand('--dangerously-skip-permissions')}
          className="btn-ghost text-sm"
          title="Claude Bypass Permissions"
        >
          Bypass
        </button>
        
        <button
          onClick={() => executeClaudeCommand('--dangerously-skip-permissions -c')}
          className="btn-ghost text-sm"
          title="Claude Bypass + Continue"
        >
          Bypass+Continue
        </button>
        
        <button
          onClick={() => executeClaudeCommand('mcp list')}
          className="btn-ghost text-sm"
          title="List MCP Servers"
        >
          MCP List
        </button>
        
        <div className="w-px h-6 bg-white/[0.08] mx-2"></div>
        
        <button
          onClick={archonStatus?.isRunning ? openArchon : toggleArchon}
          className={getArchonButtonClass()}
          title={getArchonButtonTitle()}
          disabled={archonLoading}
        >
          {archonLoading ? (
            <span className="flex items-center gap-1">
              <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
              Archon
            </span>
          ) : (
            <>
              🧠 Archon
              {archonStatus?.isRunning && <span className="ml-1 w-1.5 h-1.5 bg-green-400 rounded-full"></span>}
              {!archonStatus?.service && <span className="ml-1 w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>}
            </>
          )}
        </button>
        
        <div className="w-px h-6 bg-white/[0.08] mx-2"></div>
        
        <button
          onClick={openTerminal}
          className="btn-ghost text-sm"
          title="Open Terminal in dev-launcher folder"
        >
          Terminal
        </button>
        
        <button
          onClick={openVSCode}
          className="btn-ghost text-sm"
          title="Open VS Code in dev-launcher folder"
        >
          VS Code
        </button>
      </div>
    </div>
  );
};

export default TopBar;