import React, { useState, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import {
  PlayIcon,
  StopIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  LinkIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

interface ArchonTabProps {
  project: any;
  onRefresh: () => void;
}

interface ArchonStatus {
  service: {
    id: string;
    name: string;
    type: string;
    status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
    ports: {
      ui: number;
      server: number;
      mcp: number;
      agents: number;
    };
    config: {
      supabaseUrl: string;
      supabaseKey: string;
      openaiKey: string;
      geminiKey?: string;
    };
    version?: string;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  health: {
    overall: 'healthy' | 'unhealthy' | 'error';
    services: Record<string, string>;
  };
  isRunning: boolean;
}

interface ArchonConfig {
  supabaseUrl: string;
  supabaseKey: string;
  openaiKey: string;
  geminiKey?: string;
}

const ArchonTab: React.FC<ArchonTabProps> = ({ project, onRefresh }) => {
  const { showToast } = useStore();
  const [archonStatus, setArchonStatus] = useState<ArchonStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<ArchonConfig>({
    supabaseUrl: '',
    supabaseKey: '',
    openaiKey: '',
    geminiKey: ''
  });
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    loadArchonStatus();
  }, []);

  const loadArchonStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:9976/api/system/archon/status');
      if (response.ok) {
        const data = await response.json();
        setArchonStatus(data.data);
        
        // Load config if service exists
        if (data.data.service) {
          setConfig({
            supabaseUrl: data.data.service.config.supabaseUrl || '',
            supabaseKey: data.data.service.config.supabaseKey || '',
            openaiKey: data.data.service.config.openaiKey || '',
            geminiKey: data.data.service.config.geminiKey || ''
          });
        }
      }
    } catch (error) {
      console.error('Failed to load Archon status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartArchon = async () => {
    if (!archonStatus?.service) {
      showToast({
        type: 'error',
        message: 'Archon not configured. Please set up configuration first.'
      });
      return;
    }

    setIsOperating(true);
    try {
      const response = await fetch('http://127.0.0.1:9976/api/system/archon/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showToast({
          type: 'success',
          message: result.data.message
        });
        setTimeout(loadArchonStatus, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start Archon');
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        message: `Failed to start Archon: ${error.message}`
      });
    } finally {
      setIsOperating(false);
    }
  };

  const handleStopArchon = async () => {
    setIsOperating(true);
    try {
      const response = await fetch('http://127.0.0.1:9976/api/system/archon/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        showToast({
          type: 'success',
          message: result.data.message
        });
        setTimeout(loadArchonStatus, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stop Archon');
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        message: `Failed to stop Archon: ${error.message}`
      });
    } finally {
      setIsOperating(false);
    }
  };

  const handleInitializeArchon = async () => {
    if (!config.supabaseUrl || !config.supabaseKey || !config.openaiKey) {
      showToast({
        type: 'error',
        message: 'Please fill in all required configuration fields'
      });
      return;
    }

    setIsOperating(true);
    try {
      const response = await fetch('http://127.0.0.1:9976/api/system/archon/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const result = await response.json();
        showToast({
          type: 'success',
          message: 'Archon initialized successfully'
        });
        setShowConfig(false);
        loadArchonStatus();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initialize Archon');
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        message: `Failed to initialize Archon: ${error.message}`
      });
    } finally {
      setIsOperating(false);
    }
  };

  const handleUpdateConfig = async () => {
    setIsOperating(true);
    try {
      const response = await fetch('http://127.0.0.1:9976/api/system/archon/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        showToast({
          type: 'success',
          message: 'Configuration updated successfully'
        });
        setShowConfig(false);
        loadArchonStatus();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update configuration');
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        message: `Failed to update configuration: ${error.message}`
      });
    } finally {
      setIsOperating(false);
    }
  };

  const openArchonUI = () => {
    if (!archonStatus?.isRunning) {
      showToast({
        type: 'warning',
        message: 'Archon is not running'
      });
      return;
    }
    window.open('http://localhost:4000', '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'starting': return 'text-yellow-400';
      case 'stopping': return 'text-orange-400';
      case 'stopped': return 'text-gray-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'starting':
      case 'stopping':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-neutral-400">Loading Archon status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CubeIcon className="h-8 w-8 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">🧠 Archon AI Command Center</h2>
            <p className="text-sm text-neutral-400">Knowledge management & AI agents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadArchonStatus}
            className="btn-ghost text-sm"
            disabled={isLoading}
          >
            Refresh
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="btn-ghost text-sm"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            Config
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {archonStatus?.service ? (
              getStatusIcon(archonStatus.service.status)
            ) : (
              <XCircleIcon className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <h3 className="font-semibold text-white">
                {archonStatus?.service ? 'Global Archon' : 'Not Configured'}
              </h3>
              <p className={`text-sm ${getStatusColor(archonStatus?.service?.status || 'stopped')}`}>
                {archonStatus?.service?.status.charAt(0).toUpperCase() + (archonStatus?.service?.status?.slice(1) || 'Not initialized')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {archonStatus?.isRunning ? (
              <>
                <button
                  onClick={openArchonUI}
                  className="btn-primary flex items-center gap-2"
                  disabled={isOperating}
                >
                  <LinkIcon className="h-4 w-4" />
                  Open UI
                </button>
                <button
                  onClick={handleStopArchon}
                  className="btn-danger flex items-center gap-2"
                  disabled={isOperating}
                >
                  <StopIcon className="h-4 w-4" />
                  Stop
                </button>
              </>
            ) : (
              <button
                onClick={archonStatus?.service ? handleStartArchon : () => setShowConfig(true)}
                className="btn-primary flex items-center gap-2"
                disabled={isOperating}
              >
                <PlayIcon className="h-4 w-4" />
                {archonStatus?.service ? 'Start' : 'Setup'}
              </button>
            )}
          </div>
        </div>

        {/* Service Details */}
        {archonStatus?.service && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/[0.08]">
            <div>
              <p className="text-xs text-neutral-500">UI Port</p>
              <p className="text-sm text-white font-mono">{archonStatus.service.ports.ui}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Server Port</p>
              <p className="text-sm text-white font-mono">{archonStatus.service.ports.server}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">MCP Port</p>
              <p className="text-sm text-white font-mono">{archonStatus.service.ports.mcp}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Agents Port</p>
              <p className="text-sm text-white font-mono">{archonStatus.service.ports.agents}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {archonStatus?.service?.lastError && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">
              <strong>Last Error:</strong> {archonStatus.service.lastError}
            </p>
          </div>
        )}
      </div>

      {/* Health Status */}
      {archonStatus?.health && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Service Health</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(archonStatus.health.services).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between">
                <span className="text-sm text-neutral-300">{service}</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  status === 'healthy' ? 'bg-green-900/30 text-green-400' :
                  status === 'stopped' ? 'bg-gray-900/30 text-gray-400' :
                  'bg-red-900/30 text-red-400'
                }`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      {archonStatus?.isRunning && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="http://localhost:4000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-white">Archon UI</p>
                <p className="text-xs text-neutral-500">Knowledge & Projects</p>
              </div>
            </a>
            <a
              href={`http://localhost:${archonStatus.service?.ports.server}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <ChartBarIcon className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-white">API Docs</p>
                <p className="text-xs text-neutral-500">FastAPI Documentation</p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/[0.08] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">
              {archonStatus?.service ? 'Update Configuration' : 'Initialize Archon'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Supabase URL *</label>
                <input
                  type="url"
                  value={config.supabaseUrl}
                  onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                  placeholder="https://your-project.supabase.co"
                  className="input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Supabase Service Key *</label>
                <input
                  type="password"
                  value={config.supabaseKey}
                  onChange={(e) => setConfig({ ...config, supabaseKey: e.target.value })}
                  placeholder="Your Supabase service role key"
                  className="input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-300 mb-1">OpenAI API Key *</label>
                <input
                  type="password"
                  value={config.openaiKey}
                  onChange={(e) => setConfig({ ...config, openaiKey: e.target.value })}
                  placeholder="sk-..."
                  className="input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Gemini API Key (Optional)</label>
                <input
                  type="password"
                  value={config.geminiKey}
                  onChange={(e) => setConfig({ ...config, geminiKey: e.target.value })}
                  placeholder="Your Gemini API key"
                  className="input w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfig(false)}
                className="btn-ghost flex-1"
                disabled={isOperating}
              >
                Cancel
              </button>
              <button
                onClick={archonStatus?.service ? handleUpdateConfig : handleInitializeArchon}
                className="btn-primary flex-1"
                disabled={isOperating || !config.supabaseUrl || !config.supabaseKey || !config.openaiKey}
              >
                {isOperating ? 'Saving...' : archonStatus?.service ? 'Update' : 'Initialize'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchonTab;