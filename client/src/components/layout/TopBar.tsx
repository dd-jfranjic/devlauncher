import React from 'react'
import { useAppStore } from '@stores/appStore'
import Button from '@components/ui/Button'

const TopBar: React.FC = () => {
  const { appVersion } = useAppStore()

  const handleClaudeClick = async () => {
    if (window.electronAPI) {
      await window.electronAPI.cmd.claude()
    }
  }

  const handleClaudeContinueClick = async () => {
    if (window.electronAPI) {
      await window.electronAPI.cmd.claude('-c')
    }
  }

  const handleClaudeBypassClick = async () => {
    if (window.electronAPI) {
      await window.electronAPI.cmd.claude('--dangerously-skip-permissions')
    }
  }

  const handleClaudeBypassContinueClick = async () => {
    if (window.electronAPI) {
      await window.electronAPI.cmd.claude('--dangerously-skip-permissions -c')
    }
  }

  const handleMcpListClick = async () => {
    if (window.electronAPI) {
      await window.electronAPI.cmd.claude('mcp list')
    }
  }

  const handleTerminalClick = async () => {
    if (window.electronAPI) {
      await window.electronAPI.cmd.terminal()
    }
  }

  return (
    <div className="h-topbar bg-white border-b border-neutral-200 flex items-center justify-between px-6 windows-titlebar-area">
      {/* Left side - Branding */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          {/* Logo placeholder - you can replace with actual logo */}
          <div className="w-8 h-8 bg-primary rounded-button flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-body font-semibold text-neutral-900">
              Dev Launcher by DataDox
            </h1>
            <p className="text-caption text-neutral-500">
              v{appVersion}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Global actions */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClaudeClick}
          className="text-neutral-700 hover:text-neutral-900"
        >
          Claude
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClaudeContinueClick}
          className="text-neutral-700 hover:text-neutral-900"
        >
          Continue
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClaudeBypassClick}
          className="text-neutral-700 hover:text-neutral-900"
        >
          Bypass
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClaudeBypassContinueClick}
          className="text-neutral-700 hover:text-neutral-900"
        >
          Bypass+Continue
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleMcpListClick}
          className="text-neutral-700 hover:text-neutral-900"
        >
          MCP List
        </Button>

        <div className="w-px h-6 bg-neutral-300 mx-2" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleTerminalClick}
          className="text-neutral-700 hover:text-neutral-900"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Terminal
        </Button>
      </div>
    </div>
  )
}

export default TopBar