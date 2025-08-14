import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { Shield, Download, Key, CheckCircle, XCircle, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { apiClient } from '../lib/api';

interface WordPressMcpProps {
  project: Project;
}

export const WordPressMcp: React.FC<WordPressMcpProps> = ({ project }) => {
  // Load saved state from localStorage
  const getSavedState = () => {
    const saved = localStorage.getItem(`wordpress-mcp-${project.slug}`);
    if (saved) {
      const data = JSON.parse(saved);
      return data;
    }
    return { step: 'install', configured: false };
  };
  
  const savedState = getSavedState();
  const [step, setStep] = useState<'install' | 'activate' | 'token' | 'configure' | 'done'>(savedState.step);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [configCommand, setConfigCommand] = useState(savedState.configCommand || '');
  
  // Handle both array and object format for ports
  const getHttpPort = () => {
    if (Array.isArray(project.ports)) {
      return project.ports.find(p => p.name === 'HTTP')?.hostPort || 8080;
    } else if (project.ports?.http) {
      return project.ports.http;
    } else if (project.ports?.HTTP) {
      return project.ports.HTTP;
    }
    return 8080;
  };
  
  const httpPort = getHttpPort();
  const defaultSiteUrl = `http://localhost:${httpPort}/`;
  
  // Save state to localStorage
  const saveState = (newStep: string, additionalData?: any) => {
    const data = {
      step: newStep,
      configCommand: configCommand || additionalData?.configCommand,
      configured: newStep === 'done',
      ...additionalData
    };
    localStorage.setItem(`wordpress-mcp-${project.slug}`, JSON.stringify(data));
  };
  
  // Check if WordPress MCP is installed in Claude CLI on component mount
  useEffect(() => {
    const checkInstalled = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:9976/api/projects/${project.slug}/mcp/servers`);
        const data = await response.json();
        
        if (data.success) {
          // Check if wordpress-{slug} is in the installed list
          const wpMcpName = `wordpress-${project.slug}`;
          const isInstalled = data.data?.installed?.some((serverName: string) => 
            serverName === wpMcpName || serverName.includes('wordpress')
          );
          
          if (isInstalled) {
            // If installed, load from saved state or set to done
            const saved = getSavedState();
            if (!saved.configured) {
              setStep('done');
              saveState('done');
            }
          }
        }
      } catch (error) {
        console.error('Failed to check MCP installation:', error);
      }
    };
    
    checkInstalled();
  }, [project.slug]);
  
  const handleInstallPlugin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.wordPressMcp.installPlugin(project.slug);
      if (response.success) {
        setStep('activate');
        saveState('activate');
      } else {
        setError(response.message || 'Failed to install plugin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install plugin');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove WordPress MCP? This will remove it from Claude CLI but not from WordPress.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.wordPressMcp.remove(project.slug);
      
      if (response.success) {
        setStep('install');
        setJwtToken('');
        setSiteUrl('');
        setConfigCommand('');
        localStorage.removeItem(`wordpress-mcp-${project.slug}`);
        setError(null);
      } else {
        setError(response.message || 'Failed to remove WordPress MCP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setLoading(false);
    }
  };
  
  const handleConfigureClaude = async () => {
    if (!jwtToken) {
      setError('Please enter the JWT token');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.wordPressMcp.configureClaude(
        project.slug,
        jwtToken,
        siteUrl || defaultSiteUrl
      );
      
      if (response.success) {
        setConfigCommand(response.command || '');
        setStep('done');
        saveState('done', { configCommand: response.command });
      } else {
        setError(response.message || 'Failed to configure Claude CLI');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure');
    } finally {
      setLoading(false);
    }
  };
  
  const getStepContent = () => {
    switch (step) {
      case 'install':
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Download className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-100">Step 1: Install WordPress MCP Plugin</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Download and install the WordPress MCP plugin to your WordPress site.
                </p>
                <button
                  onClick={handleInstallPlugin}
                  disabled={loading}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Installing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Install Plugin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'activate':
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-100">Step 2: Activate Plugin</h3>
                <p className="text-sm text-gray-400 mt-1">
                  The plugin has been installed. Now you need to:
                </p>
                <ol className="mt-2 space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <span className="text-gray-500 mr-2">1.</span>
                    Go to your WordPress admin panel
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 mr-2">2.</span>
                    Navigate to Plugins → Installed Plugins
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 mr-2">3.</span>
                    Find "WordPress MCP" and click "Activate"
                  </li>
                </ol>
                <div className="mt-3 flex items-center space-x-3">
                  <a
                    href={`${defaultSiteUrl}wp-admin/plugins.php`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Plugins Page</span>
                  </a>
                  <button
                    onClick={() => {
                      setStep('token');
                      saveState('token');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Plugin Activated →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'token':
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Key className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-100">Step 3: Generate JWT Token</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Generate a JWT token in WordPress MCP settings:
                </p>
                <ol className="mt-2 space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <span className="text-gray-500 mr-2">1.</span>
                    Go to Settings → WordPress MCP
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 mr-2">2.</span>
                    Click on "Authentication Tokens" tab
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 mr-2">3.</span>
                    Select token duration (e.g., 24 hours)
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 mr-2">4.</span>
                    Click "Generate New Token" and copy it
                  </li>
                </ol>
                <div className="mt-3">
                  <a
                    href={`${defaultSiteUrl}wp-admin/options-general.php?page=wordpress-mcp`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open MCP Settings</span>
                  </a>
                </div>
                <button
                  onClick={() => {
                    setStep('configure');
                    saveState('configure');
                  }}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  I Have the Token →
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'configure':
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-100">Step 4: Configure Claude CLI</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Enter the JWT token to configure Claude CLI with your WordPress site.
                </p>
                
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      JWT Token
                    </label>
                    <input
                      type="text"
                      value={jwtToken}
                      onChange={(e) => setJwtToken(e.target.value)}
                      placeholder="Enter the JWT token you generated"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Site URL (optional)
                    </label>
                    <input
                      type="url"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      placeholder={defaultSiteUrl}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use default: {defaultSiteUrl}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleConfigureClaude}
                    disabled={loading || !jwtToken}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Configuring...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Configure Claude CLI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'done':
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-100">WordPress MCP Configured!</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Your WordPress site is now connected to Claude CLI. You can use Claude to interact with your WordPress site.
                </p>
                
                {configCommand && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-300 mb-2">Command used:</p>
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                      <code className="text-xs text-green-400 break-all">{configCommand}</code>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>You can now use Claude to:</strong>
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-300">
                    <li>• Create and edit posts and pages</li>
                    <li>• Manage media files</li>
                    <li>• Update settings and configurations</li>
                    <li>• Interact with plugins and themes</li>
                  </ul>
                </div>
                
                <div className="mt-4 flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setStep('install');
                      setJwtToken('');
                      setSiteUrl('');
                      setConfigCommand('');
                      // Clear saved state
                      localStorage.removeItem(`wordpress-mcp-${project.slug}`);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Reconfigure
                  </button>
                  
                  <button
                    onClick={handleRemove}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Removing...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Remove WordPress MCP</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-100">WordPress MCP Integration</h2>
          {step === 'done' && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
              ✓ Configured
            </span>
          )}
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6">
        {['install', 'activate', 'token', 'configure', 'done'].map((s, index) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : index < ['install', 'activate', 'token', 'configure', 'done'].indexOf(step)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {index < ['install', 'activate', 'token', 'configure', 'done'].indexOf(step) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs text-gray-400 mt-1 capitalize">{s}</span>
            </div>
            {index < 4 && (
              <div
                className={`flex-1 h-0.5 ${
                  index < ['install', 'activate', 'token', 'configure', 'done'].indexOf(step)
                    ? 'bg-green-600'
                    : 'bg-gray-700'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start space-x-2">
          <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      
      {/* Step content */}
      {getStepContent()}
    </div>
  );
};