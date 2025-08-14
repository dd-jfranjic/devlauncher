import React from 'react';
import { useStore } from '../stores/useStore';

const TopBar: React.FC = () => {
  const { showToast } = useStore();

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
    const devLauncherPath = 'C:\\Users\\jfran\\Documents\\dev-launcher';
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
      ? 'C:\\Users\\jfran\\Documents\\dev-launcher'  // Dev Launcher's own path
      : '.';
    executeCommand('wt.exe', ['-d', currentPath]);
  };

  const openVSCode = () => {
    // Open VS Code in the dev-launcher project folder
    const projectPath = 'C:\\Users\\jfran\\Documents\\dev-launcher';
    executeCommand('code', [projectPath]);
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