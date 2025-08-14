import React, { useState, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import {
  PlusIcon,
  TrashIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { ApiTokenModal } from './ApiTokenModal';
import { WordPressMcp } from './WordPressMcp';

interface McpTabProps {
  project: any;
  onRefresh: () => void;
}

interface McpServer {
  id: string;
  name: string;
  description: string;
  repository: string;
  type: 'testing' | 'security' | 'search' | 'docker' | 'ai' | 'cms' | 'documentation' | 'database';
  icon: string;
  installed: boolean;
  configured: boolean;
  status: 'active' | 'inactive' | 'error' | 'not_installed';
  tested: boolean;
  wslSupported: boolean;
  windowsSupported: boolean;
  requiresApiToken?: boolean;
  apiTokenEnvVar?: string;
  apiTokenPlaceholder?: string;
}

const McpTab: React.FC<McpTabProps> = ({ project, onRefresh }) => {
  const { showToast } = useStore();
  const [servers, setServers] = useState<McpServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tokenModalServer, setTokenModalServer] = useState<McpServer | null>(null);

  useEffect(() => {
    loadMcpServers();
  }, [project]);

  const loadMcpServers = async () => {
    setIsLoading(true);
    try {
      // Load real MCP servers from configuration
      const response = await fetch(`http://127.0.0.1:9976/api/projects/${project.slug}/mcp/servers`);
      const data = await response.json();
      
      // Map servers with installation status
      const serversWithStatus: McpServer[] = data.servers.map((server: any) => ({
        ...server,
        installed: server.installed || false, // Use the value from API
        configured: server.configured || false, // Use the value from API
        status: server.installed ? 'active' : 'not_installed' as const,
        tested: server.tested || false
      }));

      // Filter servers based on project location
      const filteredServers = serversWithStatus.filter((server: McpServer) => {
        if (project.location === 'wsl') {
          return server.wslSupported;
        } else {
          return server.windowsSupported;
        }
      });

      // Prioritize relevant servers for project type
      const sortedServers = filteredServers.sort((a, b) => {
        // WordPress projects should show WordPress MCP first
        if (project.type === 'wordpress') {
          if (a.id === 'wordpress-mcp') return -1;
          if (b.id === 'wordpress-mcp') return 1;
          if (a.id === 'mysql-mcp') return -1;
          if (b.id === 'mysql-mcp') return 1;
        }
        // Docker-based projects should show Docker MCP first
        if (a.type === 'docker' && b.type !== 'docker') return -1;
        if (b.type === 'docker' && a.type !== 'docker') return 1;
        return 0;
      });

      setServers(sortedServers);
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
      // Fallback to default servers if API fails
      const defaultServers: McpServer[] = [
        {
          id: 'docker-mcp',
          name: 'Docker MCP',
          description: 'Docker container management',
          repository: 'https://github.com/QuantGeekDev/docker-mcp',
          type: 'docker',
          icon: '🐋',
          installed: false,
          configured: false,
          status: 'not_installed',
          tested: false,
          wslSupported: true,
          windowsSupported: false
        }
      ];
      setServers(defaultServers);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstall = async (serverId: string, apiToken?: string) => {
    try {
      showToast({
        type: 'info',
        message: `Installing ${serverId}...`
      });
      
      const requestBody: any = { serverId };
      if (apiToken) {
        requestBody.apiToken = apiToken;
      }
      
      const response = await fetch(`http://127.0.0.1:9976/api/projects/${project.slug}/mcp/install`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error - invalid response');
      }
      
      const data = await response.json();
      
      if (data.success) {
        showToast({
          type: 'success',
          message: data.message || `${serverId} installed successfully`
        });
        loadMcpServers();
      } else {
        throw new Error(data.error || data.message || 'Installation failed');
      }
    } catch (error: any) {
      console.error('Installation error:', error);
      showToast({
        type: 'error',
        message: `Failed to install: ${error.message}`
      });
    }
  };

  const handleInstallClick = (server: McpServer) => {
    if (server.requiresApiToken) {
      setTokenModalServer(server);
    } else {
      handleInstall(server.id);
    }
  };

  const handleTokenConfirm = (token: string) => {
    if (tokenModalServer) {
      handleInstall(tokenModalServer.id, token);
      setTokenModalServer(null);
    }
  };

  const handleConfigure = async (serverName: string) => {
    setSelectedServer(serverName);
    // Open configuration modal or panel
  };

  const handleRemove = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    if (!confirm(`Are you sure you want to remove ${server.name}?`)) return;
    
    try {
      showToast({
        type: 'info',
        message: `Removing ${server.name}...`
      });
      
      const response = await fetch(`http://127.0.0.1:9976/api/projects/${project.slug}/mcp/remove/${serverId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast({
          type: 'success',
          message: data.message || `${server.name} removed successfully`
        });
        loadMcpServers();
      } else {
        throw new Error(data.error || 'Remove failed');
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        message: `Failed to remove ${server.name}: ${error.message}`
      });
    }
  };

  const handleTest = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    try {
      showToast({
        type: 'info',
        message: `Opening MCP list to check ${server.name}...`
      });
      
      // Open terminal with claude mcp list command
      const response = await fetch(`http://127.0.0.1:9976/api/projects/${project.slug}/open/terminal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: 'claude mcp list' })
      });
      
      const data = await response.json();
      
      if (data.data?.opened) {
        showToast({
          type: 'success',
          message: `Terminal opened with MCP list`
        });
      } else {
        showToast({
          type: 'error',
          message: `Failed to open terminal`
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: `Failed to open terminal`
      });
    }
  };

  const getTypeIcon = (server: McpServer) => {
    // Use custom icon if provided, otherwise default by type
    if (server.icon) return server.icon;
    
    switch (server.type) {
      case 'docker':
        return '🐳';
      case 'database':
        return '🗄️';
      case 'testing':
        return '🧪';
      case 'security':
        return '🔐';
      case 'search':
        return '🔎';
      case 'ai':
        return '🤖';
      case 'cms':
        return '📝';
      case 'documentation':
        return '📚';
      default:
        return '🔧';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success';
      case 'error':
        return 'text-error';
      default:
        return 'text-neutral-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner w-8 h-8 mb-4" />
          <p className="text-neutral-400">Loading MCP servers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* WordPress MCP Integration - Show only for WordPress projects */}
      {project.type === 'wordpress' && project.status === 'running' && (
        <section className="card">
          <WordPressMcp project={project} />
        </section>
      )}
      
      {/* MCP Overview */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Model Context Protocol</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary btn-sm flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Server
          </button>
        </div>
        
        <div className="p-4 bg-neutral-700 rounded-lg">
          <p className="text-sm text-neutral-300 mb-3">
            MCP servers extend Claude's capabilities by providing access to external tools and services.
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-neutral-400">Total Servers</span>
              <p className="text-lg font-medium mt-1">{servers.length}</p>
            </div>
            <div>
              <span className="text-neutral-400">Active</span>
              <p className="text-lg font-medium mt-1 text-success">
                {servers.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div>
              <span className="text-neutral-400">Configured</span>
              <p className="text-lg font-medium mt-1">
                {servers.filter(s => s.configured).length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Servers */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Available Servers</h3>
        
        {servers.length === 0 ? (
          <div className="text-center py-8">
            <CommandLineIcon className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-500">No MCP servers configured</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-primary text-sm mt-2 hover:underline"
            >
              Add your first server
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map((server) => (
              <div
                key={server.name}
                className="p-4 bg-neutral-700 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(server)}</span>
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center gap-2">
                          {!server.tested && !server.installed && <span className="text-error text-lg font-bold">❌</span>}
                          {server.name}
                          {server.installed && (
                            <CheckCircleIcon className="w-5 h-5 text-success" title="Installed" />
                          )}
                        </h4>
                        <p className="text-sm text-neutral-400">{server.description}</p>
                        <a 
                          href={server.repository} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {server.repository}
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <span className={`${server.installed ? 'text-success' : 'text-neutral-500'}`}>
                        {server.installed ? '✓ Installed' : '○ Not installed'}
                      </span>
                      <span className={`${server.configured ? 'text-success' : 'text-neutral-500'}`}>
                        {server.configured ? '✓ Configured' : '○ Not configured'}
                      </span>
                      <span className={getStatusColor(server.status)}>
                        Status: {server.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!server.installed ? (
                      <button
                        onClick={() => handleInstallClick(server)}
                        className="btn-primary btn-sm"
                      >
                        Install
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRemove(server.id)}
                          className="btn-secondary btn-sm text-error border-error hover:bg-error hover:text-white"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => handleTest(server.id)}
                          className="btn-ghost btn-sm"
                          title="Test connection"
                        >
                          Test
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MCP Configuration */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Configuration</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2">
            <span className="text-neutral-400">Configuration File</span>
            <span className="font-mono">.claude/mcp.json</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-neutral-400">Base URL</span>
            <span className="font-mono">http://localhost:{project.ports?.http || 3000}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-neutral-400">Auto-reload on change</span>
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-neutral-600 text-primary focus:ring-primary"
              defaultChecked
            />
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-neutral-700">
          <div className="flex gap-3">
            <button className="btn-secondary btn-sm">
              View Config
            </button>
            <button className="btn-secondary btn-sm">
              Export Profile
            </button>
            <button className="btn-secondary btn-sm">
              Import Profile
            </button>
          </div>
        </div>
      </section>

      {/* Quick Commands */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Quick Commands</h3>
        <div className="space-y-2">
          <div className="p-3 bg-neutral-700 rounded font-mono text-sm">
            claude mcp list
          </div>
          <div className="p-3 bg-neutral-700 rounded font-mono text-sm">
            claude mcp add docker-mcp-toolkit
          </div>
          <div className="p-3 bg-neutral-700 rounded font-mono text-sm">
            claude mcp test docker-mcp-toolkit
          </div>
        </div>
      </section>

      {/* API Token Modal */}
      {tokenModalServer && (
        <ApiTokenModal
          serverName={tokenModalServer.name}
          placeholder={tokenModalServer.apiTokenPlaceholder || 'Enter API token'}
          onConfirm={handleTokenConfirm}
          onCancel={() => setTokenModalServer(null)}
        />
      )}
    </div>
  );
};

export default McpTab;