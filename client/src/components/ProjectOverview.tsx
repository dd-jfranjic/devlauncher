import React, { useState, useEffect } from 'react';
import {
  openTerminal,
  openFolder,
  openEditor,
  installClaude,
  installGemini,
  installQwen,
  reallocatePorts,
  resolveUrls,
  checkCliVersions,
  updateClaude,
  updateGemini,
  updateQwen
} from '../lib/api';
import { useStore } from '../stores/useStore';
import {
  Terminal,
  FolderOpen,
  Code2,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  Globe,
  Shield,
  Database,
  Mail,
  Settings2,
  Link as LinkIcon
} from 'lucide-react';

interface ProjectOverviewProps {
  project: any;
  onRefresh: () => void;
  onAction: (performing: boolean) => void;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project, onRefresh, onAction }) => {
  const { showToast } = useStore();
  const [installingClaude, setInstallingClaude] = useState(false);
  const [installingGemini, setInstallingGemini] = useState(false);
  const [installingQwen, setInstallingQwen] = useState(false);
  const [resolvingUrls, setResolvingUrls] = useState(false);
  const [urls, setUrls] = useState<any>(null);
  const [checkingVersions, setCheckingVersions] = useState(false);
  const [cliVersions, setCliVersions] = useState<any>(null);
  const [updatingClaude, setUpdatingClaude] = useState(false);
  const [updatingGemini, setUpdatingGemini] = useState(false);
  const [updatingQwen, setUpdatingQwen] = useState(false);

  // Auto-check CLI status when component loads
  useEffect(() => {
    const checkCliStatus = async () => {
      try {
        const response = await checkCliVersions(project.slug);
        if (response) {
          setCliVersions(response);
          // If CLI is detected but project shows not installed, trigger refresh
          if ((response.claude.installed && !project.claudeCli?.installed) ||
              (response.gemini.installed && !project.geminiCli?.installed) ||
              (response.qwen.installed && !project.qwenCli?.installed)) {
            showToast({
              type: 'info',
              message: 'CLI tools detected - refreshing project data'
            });
            onRefresh();
          }
        }
      } catch (error) {
        console.log('CLI status check failed:', error);
      }
    };

    if (project?.slug) {
      checkCliStatus();
    }
  }, [project.slug]);

  // Helper functions to get current CLI status
  const isClaudeInstalled = () => {
    return project.claudeCli?.installed || cliVersions?.claude?.installed || false;
  };

  const isGeminiInstalled = () => {
    return project.geminiCli?.installed || cliVersions?.gemini?.installed || false;
  };

  const isQwenInstalled = () => {
    return project.qwenCli?.installed || cliVersions?.qwen?.installed || false;
  };

  const getClaudeVersion = () => {
    return cliVersions?.claude?.version || project.claudeCli?.version || 'unknown';
  };

  const getGeminiVersion = () => {
    return cliVersions?.gemini?.version || project.geminiCli?.version || 'unknown';
  };

  const getQwenVersion = () => {
    return cliVersions?.qwen?.version || project.qwenCli?.version || 'unknown';
  };

  const handleAutoLogin = () => {
    // Get the port - make sure it's a number
    const httpPort = Number(project.ports?.http) || 8080;
    const adminUrl = `http://localhost:${httpPort}/wp-admin/`;
    
    // Simply open the admin URL - WordPress will redirect to login if needed
    // User can manually enter credentials if auto-login doesn't work
    window.open(adminUrl, '_blank');
    
    showToast({ 
      type: 'info', 
      message: `Opening WordPress Admin at localhost:${httpPort} - Use admin/admin123! to login` 
    });
  };

  const handleOpenTerminal = async (command?: string) => {
    try {
      await openTerminal(project.slug, command);
      if (command) {
        showToast({ type: 'success', message: `Opening terminal with: ${command}` });
      } else {
        showToast({ type: 'success', message: 'Opening terminal...' });
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to open terminal' });
    }
  };

  const handleOpenFolder = async () => {
    try {
      await openFolder(project.slug);
      showToast({ type: 'success', message: 'Opening folder...' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to open folder' });
    }
  };

  const handleOpenEditor = async () => {
    try {
      await openEditor(project.slug);
      showToast({ type: 'success', message: 'Opening VS Code...' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to open editor' });
    }
  };

  const handleInstallClaude = async (reinstall = false) => {
    setInstallingClaude(true);
    onAction(true);
    try {
      await installClaude(project.slug, reinstall);
      showToast({ 
        type: 'success', 
        message: reinstall ? 'Claude CLI reinstalled successfully' : 'Claude CLI installed successfully' 
      });
      onRefresh();
    } catch (error) {
      showToast({ 
        type: 'error', 
        message: reinstall ? 'Failed to reinstall Claude CLI' : 'Failed to install Claude CLI' 
      });
    } finally {
      setInstallingClaude(false);
      onAction(false);
    }
  };

  const handleInstallGemini = async (reinstall = false) => {
    setInstallingGemini(true);
    onAction(true);
    try {
      await installGemini(project.slug, reinstall);
      showToast({ 
        type: 'success', 
        message: reinstall ? 'Gemini CLI reinstalled successfully' : 'Gemini CLI installed successfully' 
      });
      onRefresh();
    } catch (error) {
      showToast({ 
        type: 'error', 
        message: reinstall ? 'Failed to reinstall Gemini CLI' : 'Failed to install Gemini CLI' 
      });
    } finally {
      setInstallingGemini(false);
      onAction(false);
    }
  };

  const handleInstallQwen = async (reinstall = false) => {
    setInstallingQwen(true);
    onAction(true);
    try {
      await installQwen(project.slug, reinstall);
      showToast({ 
        type: 'success', 
        message: reinstall ? 'Qwen CLI reinstalled successfully' : 'Qwen CLI installed successfully' 
      });
      onRefresh();
    } catch (error) {
      showToast({ 
        type: 'error', 
        message: reinstall ? 'Failed to reinstall Qwen CLI' : 'Failed to install Qwen CLI' 
      });
    } finally {
      setInstallingQwen(false);
      onAction(false);
    }
  };

  const handleReallocatePorts = async () => {
    onAction(true);
    try {
      await reallocatePorts(project.slug);
      showToast({ type: 'success', message: 'Ports reallocated successfully' });
      onRefresh();
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to reallocate ports' });
    } finally {
      onAction(false);
    }
  };

  const handleResolveUrls = async () => {
    setResolvingUrls(true);
    try {
      const result = await resolveUrls(project.slug);
      setUrls(result);
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to resolve URLs' });
    } finally {
      setResolvingUrls(false);
    }
  };

  const handleCheckCliVersions = async () => {
    setCheckingVersions(true);
    try {
      const result = await checkCliVersions(project.slug);
      setCliVersions(result);
      // Don't call onRefresh() here to avoid re-render loop
      showToast({ type: 'success', message: 'Version check complete' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to check CLI versions' });
    } finally {
      setCheckingVersions(false);
    }
  };

  const handleCheckClaudeVersion = async () => {
    setCheckingVersions(true);
    try {
      const result = await checkCliVersions(project.slug);
      setCliVersions(result);
      
      // Show appropriate message based on update availability
      if (result.claude?.latest) {
        showToast({ 
          type: 'info', 
          message: `Claude CLI update available: ${result.claude.latest}` 
        });
      } else {
        showToast({ 
          type: 'success', 
          message: `Claude CLI is up to date (${result.claude?.version || project.claudeCli?.version})` 
        });
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to check Claude version' });
    } finally {
      setCheckingVersions(false);
    }
  };

  const handleCheckGeminiVersion = async () => {
    setCheckingVersions(true);
    try {
      const result = await checkCliVersions(project.slug);
      setCliVersions(result);
      
      // Show appropriate message based on update availability
      if (result.gemini?.latest) {
        showToast({ 
          type: 'info', 
          message: `Gemini CLI update available: ${result.gemini.latest}` 
        });
      } else {
        showToast({ 
          type: 'success', 
          message: `Gemini CLI is up to date (${result.gemini?.version || project.geminiCli?.version})` 
        });
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to check Gemini version' });
    } finally {
      setCheckingVersions(false);
    }
  };

  // Removed automatic check to prevent reload loops
  // Users can manually click "Check Updates" button

  const handleUpdateClaude = async () => {
    setUpdatingClaude(true);
    onAction(true);
    try {
      const result = await updateClaude(project.slug);
      showToast({ type: 'success', message: `Claude CLI updated to ${result.version}` });
      // Manual refresh after update
      setTimeout(() => onRefresh(), 1000);
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update Claude CLI' });
    } finally {
      setUpdatingClaude(false);
      onAction(false);
    }
  };

  const handleUpdateGemini = async () => {
    setUpdatingGemini(true);
    onAction(true);
    try {
      const result = await updateGemini(project.slug);
      showToast({ type: 'success', message: `Gemini CLI updated to ${result.version}` });
      // Manual refresh after update
      setTimeout(() => onRefresh(), 1000);
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update Gemini CLI' });
    } finally {
      setUpdatingGemini(false);
      onAction(false);
    }
  };

  const handleCheckQwenVersion = async () => {
    setCheckingVersions(true);
    try {
      const result = await checkCliVersions(project.slug);
      setCliVersions(result);
      
      // Show appropriate message based on update availability
      if (result.qwen?.latest) {
        showToast({ 
          type: 'info', 
          message: `Qwen CLI update available: ${result.qwen.latest}` 
        });
      } else {
        showToast({ 
          type: 'success', 
          message: `Qwen CLI is up to date (${result.qwen?.version || project.qwenCli?.version})` 
        });
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to check Qwen version' });
    } finally {
      setCheckingVersions(false);
    }
  };

  const handleUpdateQwen = async () => {
    setUpdatingQwen(true);
    onAction(true);
    try {
      const result = await updateQwen(project.slug);
      showToast({ type: 'success', message: `Qwen CLI updated to ${result.version}` });
      // Manual refresh after update
      setTimeout(() => onRefresh(), 1000);
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update Qwen CLI' });
    } finally {
      setUpdatingQwen(false);
      onAction(false);
    }
  };

  const getQuickLinks = () => {
    const links = [];
    
    if (project.type === 'wordpress') {
      const httpPort = Number(project.ports?.http) || 8080;
      const phpMyAdminPort = Number(project.ports?.phpmyadmin) || 8081;
      const mailpitPort = Number(project.ports?.mailpit_ui) || 8025;
      
      links.push(
        { label: 'Site', url: `http://localhost:${httpPort}` },
        { label: 'Admin', url: `http://localhost:${httpPort}/wp-admin` },
        { label: 'phpMyAdmin', url: `http://localhost:${phpMyAdminPort}` },
        { label: 'Mailpit', url: `http://localhost:${mailpitPort}` }
      );
    } else if (project.type === 'nextjs') {
      const httpPort = Number(project.ports?.http) || 3000;
      links.push(
        { label: 'App', url: `http://localhost:${httpPort}` },
        { label: 'API Health', url: `http://localhost:${httpPort}/api/health` }
      );
    } else if (project.type === 'external-import') {
      // For external-import projects like fiskal-ai, show key service URLs
      if (project.ports?.frontend) {
        links.push({ label: 'Frontend', url: `http://172.27.151.100:${project.ports.frontend}`, desc: 'React App' });
      }
      if (project.ports?.backend) {
        links.push({ label: 'API', url: `http://localhost:${project.ports.backend}`, desc: 'Backend API' });
      }
      if (project.ports?.adminer) {
        links.push({ label: 'Adminer', url: `http://localhost:${project.ports.adminer}`, desc: 'Database UI' });
      }
      if (project.ports?.mailpit) {
        links.push({ label: 'Mailpit', url: `http://localhost:${project.ports.mailpit}`, desc: 'Email Testing' });
      }
      if (project.ports?.dozzle && project.ports.dozzle !== 9999) { // Skip if default dozzle port
        links.push({ label: 'Dozzle', url: `http://localhost:${project.ports.dozzle}`, desc: 'Docker Logs' });
      }
    }
    
    return links;
  };

  return (
    <div className="space-y-6">
      {/* Quick Links */}
      {project.status === 'running' && (
        <section className="card">
          <h3 className="text-lg font-medium mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {project.type === 'wordpress' ? (
              <>
                {/* Site */}
                <a
                  href={`http://localhost:${project.ports?.http || 8080}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 card-glass hover:bg-white/[0.04] rounded-xl transition-all duration-200 hover-lift hover-glow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium">Site</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    localhost:{project.ports?.http || 8080}
                  </div>
                </a>

                {/* Admin */}
                <button
                  onClick={() => handleAutoLogin()}
                  className="p-3 card-glass hover:bg-white/[0.04] rounded-xl transition-all duration-200 text-left w-full hover-lift hover-glow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">Admin Panel</span>
                  </div>
                  <div className="text-xs text-neutral-400 space-y-1">
                    <div>localhost:{Number(project.ports?.http) || 8080}/wp-admin</div>
                    <div>User: admin</div>
                    <div>Pass: admin123!</div>
                  </div>
                </button>

                {/* phpMyAdmin */}
                <a
                  href={`http://localhost:${project.ports?.phpmyadmin || 8081}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 card-glass hover:bg-white/[0.04] rounded-xl transition-all duration-200 hover-lift hover-glow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium">phpMyAdmin</span>
                  </div>
                  <div className="text-xs text-neutral-400 space-y-1">
                    <div>localhost:{project.ports?.phpmyadmin || 8081}</div>
                    <div>User: wpuser</div>
                    <div>Pass: wppass123</div>
                  </div>
                </a>

                {/* MariaDB */}
                <div className="p-3 card-glass rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">MariaDB</span>
                  </div>
                  <div className="text-xs text-neutral-400 space-y-1">
                    <div>localhost:{project.ports?.db || 3306}</div>
                    <div>DB: wordpress</div>
                    <div>User: wpuser</div>
                    <div>Pass: wppass123</div>
                  </div>
                </div>

                {/* Mailpit */}
                <a
                  href={`http://localhost:${project.ports?.mailpit_ui || 8025}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 card-glass hover:bg-white/[0.04] rounded-xl transition-all duration-200 hover-lift hover-glow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-medium">Mailpit</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    localhost:{project.ports?.mailpit_ui || 8025}
                  </div>
                </a>
              </>
            ) : (
              // For external-import and other non-WordPress projects
              getQuickLinks().map((link, index) => (
                <a
                  key={index}
                  href={String(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 card-glass hover:bg-white/[0.04] rounded-xl transition-all duration-200 hover-lift hover-glow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {link.label === 'Frontend' && <Globe className="w-4 h-4 text-indigo-400" />}
                    {link.label === 'API' && <Code2 className="w-4 h-4 text-green-400" />}
                    {link.label === 'Adminer' && <Database className="w-4 h-4 text-purple-400" />}
                    {link.label === 'Mailpit' && <Mail className="w-4 h-4 text-pink-400" />}
                    {link.label === 'Dozzle' && <Settings2 className="w-4 h-4 text-orange-400" />}
                    {!['Frontend', 'API', 'Adminer', 'Mailpit', 'Dozzle'].includes(link.label) && <LinkIcon className="w-4 h-4 text-primary" />}
                    <span className="text-sm font-medium">{String(link.label)}</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    <div>{String(link.url).replace('http://localhost:', 'localhost:')}</div>
                    {link.desc && <div>{link.desc}</div>}
                  </div>
                </a>
              ))
            )}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleOpenTerminal()}
            className="p-4 card-glass hover:bg-white/[0.04] rounded-xl transition-all duration-200 flex flex-col items-center gap-2 hover-lift hover-glow"
            title="Open terminal in project directory"
          >
            <Terminal className="w-6 h-6 text-indigo-400" />
            <span className="text-sm font-medium">Terminal</span>
            <span className="text-xs text-neutral-400 text-center">Open WSL terminal in project folder</span>
          </button>
          
          <button
            onClick={handleOpenFolder}
            className="p-4 card-glass hover:bg-white/[0.04] rounded-xl transition-all duration-200 flex flex-col items-center gap-2 hover-lift hover-glow"
            title="Open project folder in Windows Explorer"
          >
            <FolderOpen className="w-6 h-6 text-purple-400" />
            <span className="text-sm font-medium">Folder</span>
            <span className="text-xs text-neutral-400 text-center">Open in Windows Explorer</span>
          </button>
          
          <button
            onClick={handleOpenEditor}
            className="p-4 card-glass hover:bg-white/[0.04] rounded-xl transition-all duration-200 flex flex-col items-center gap-2 hover-lift hover-glow"
            title="Open project in VS Code or Cursor"
          >
            <Code2 className="w-6 h-6 text-blue-400" />
            <span className="text-sm font-medium">Editor</span>
            <span className="text-xs text-neutral-400 text-center">Open in VS Code/Cursor</span>
          </button>
          
          <button
            onClick={handleReallocatePorts}
            className="p-4 card-glass hover:bg-white/[0.04] rounded-xl transition-all duration-200 flex flex-col items-center gap-2 hover-lift hover-glow"
            title="Reassign new random ports to avoid conflicts"
          >
            <RefreshCw className="w-6 h-6 text-green-400" />
            <span className="text-sm font-medium">Reallocate Ports</span>
            <span className="text-xs text-neutral-400 text-center">Fix port conflicts</span>
          </button>
        </div>
      </section>

      {/* CLI Tools */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">CLI Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 card-flat rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Claude CLI</h4>
              <div className="flex items-center gap-2">
                {isClaudeInstalled() && (
                  <>
                    <button
                      onClick={handleCheckClaudeVersion}
                      disabled={checkingVersions}
                      className="btn-ghost btn-xs flex items-center gap-1"
                      title="Check for Claude updates"
                    >
                      {checkingVersions ? <span className="spinner-sm" /> : <ArrowRightLeft className="w-3 h-3" />}
                      Check
                    </button>
                    <button
                      onClick={() => handleInstallClaude(true)}
                      disabled={installingClaude}
                      className="btn-ghost btn-xs flex items-center gap-1"
                      title="Reinstall Claude CLI"
                    >
                      {installingClaude ? <span className="spinner-sm" /> : <RefreshCw className="w-3 h-3" />}
                      Reinstall
                    </button>
                  </>
                )}
                {isClaudeInstalled() && cliVersions?.claude?.latest && (
                  <button
                    onClick={handleUpdateClaude}
                    disabled={updatingClaude}
                    className="btn-primary btn-xs flex items-center gap-1"
                    title="Update Claude CLI"
                  >
                    {updatingClaude ? <span className="spinner-sm" /> : <RefreshCw className="w-3 h-3" />}
                    Update
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-neutral-400">
              {isClaudeInstalled() ? (
                <>
                  Version: {getClaudeVersion()}
                  {cliVersions?.claude?.latest && (
                    <span className="text-xs text-primary ml-2">
                      (Latest: {cliVersions.claude.latest})
                    </span>
                  )}
                </>
              ) : (
                'Not installed'
              )}
            </p>
            {!isClaudeInstalled() && (
              <button
                onClick={handleInstallClaude}
                disabled={installingClaude}
                className="btn-primary btn-sm flex items-center gap-2 mt-2"
              >
                {installingClaude && <span className="spinner" />}
                Install
              </button>
            )}
            {isClaudeInstalled() && (
              <div className="flex flex-wrap gap-1 mt-2">
                <button
                  onClick={() => handleOpenTerminal('claude')}
                  className="btn-ghost btn-xs"
                  title="Open Claude CLI"
                >
                  Claude
                </button>
                <button
                  onClick={() => handleOpenTerminal('claude -c')}
                  className="btn-ghost btn-xs"
                  title="Continue with Claude"
                >
                  Continue
                </button>
                <button
                  onClick={() => handleOpenTerminal('claude --dangerously-skip-permissions')}
                  className="btn-ghost btn-xs"
                  title="Bypass permissions"
                >
                  Bypass
                </button>
                <button
                  onClick={() => handleOpenTerminal('claude --dangerously-skip-permissions -c')}
                  className="btn-ghost btn-xs"
                  title="Bypass and continue"
                >
                  Bypass+Continue
                </button>
                <button
                  onClick={() => handleOpenTerminal('claude mcp list')}
                  className="btn-ghost btn-xs"
                  title="List MCP servers"
                >
                  MCP List
                </button>
                <button
                  onClick={() => handleOpenTerminal('claude --debug')}
                  className="btn-ghost btn-xs"
                  title="Start Claude CLI in debug mode"
                >
                  Debug
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 card-flat rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Gemini CLI</h4>
              <div className="flex items-center gap-2">
                {isGeminiInstalled() && (
                  <>
                    <button
                      onClick={handleCheckGeminiVersion}
                      disabled={checkingVersions}
                      className="btn-ghost btn-xs flex items-center gap-1"
                      title="Check for Gemini updates"
                    >
                      {checkingVersions ? <span className="spinner-sm" /> : <ArrowRightLeft className="w-3 h-3" />}
                      Check
                    </button>
                    <button
                      onClick={() => handleInstallGemini(true)}
                      disabled={installingGemini}
                      className="btn-ghost btn-xs flex items-center gap-1"
                      title="Reinstall Gemini CLI"
                    >
                      {installingGemini ? <span className="spinner-sm" /> : <RefreshCw className="w-3 h-3" />}
                      Reinstall
                    </button>
                  </>
                )}
                {isGeminiInstalled() && cliVersions?.gemini?.latest && (
                  <button
                    onClick={handleUpdateGemini}
                    disabled={updatingGemini}
                    className="btn-primary btn-xs flex items-center gap-1"
                    title="Update Gemini CLI"
                  >
                    {updatingGemini ? <span className="spinner-sm" /> : <RefreshCw className="w-3 h-3" />}
                    Update
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-neutral-400">
              {isGeminiInstalled() ? (
                <>
                  Version: {getGeminiVersion()}
                  {cliVersions?.gemini?.latest && (
                    <span className="text-xs text-primary ml-2">
                      (Latest: {cliVersions.gemini.latest})
                    </span>
                  )}
                </>
              ) : (
                'Not installed'
              )}
            </p>
            {!isGeminiInstalled() && (
              <button
                onClick={handleInstallGemini}
                disabled={installingGemini}
                className="btn-primary btn-sm flex items-center gap-2 mt-2"
              >
                {installingGemini && <span className="spinner" />}
                Install
              </button>
            )}
            {isGeminiInstalled() && (
              <div className="flex flex-wrap gap-1 mt-2">
                <button
                  onClick={() => handleOpenTerminal('gemini')}
                  className="btn-ghost btn-xs"
                  title="Open Gemini CLI"
                >
                  Gemini
                </button>
                <button
                  onClick={() => handleOpenTerminal('gemini -h')}
                  className="btn-ghost btn-xs"
                  title="Show Gemini help"
                >
                  Help
                </button>
                <button
                  onClick={() => handleOpenTerminal('gemini search')}
                  className="btn-ghost btn-xs"
                  title="Search with Gemini"
                >
                  Search
                </button>
                <button
                  onClick={() => handleOpenTerminal('gemini config list')}
                  className="btn-ghost btn-xs"
                  title="List Gemini configuration"
                >
                  Config
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 card-flat rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Qwen CLI</h4>
              <div className="flex items-center gap-2">
                {isQwenInstalled() && (
                  <>
                    <button
                      onClick={handleCheckQwenVersion}
                      disabled={checkingVersions}
                      className="btn-ghost btn-xs flex items-center gap-1"
                      title="Check for Qwen updates"
                    >
                      {checkingVersions ? <span className="spinner-sm" /> : <ArrowRightLeft className="w-3 h-3" />}
                      Check
                    </button>
                    <button
                      onClick={() => handleInstallQwen(true)}
                      disabled={installingQwen}
                      className="btn-ghost btn-xs flex items-center gap-1"
                      title="Reinstall Qwen CLI"
                    >
                      {installingQwen ? <span className="spinner-sm" /> : <RefreshCw className="w-3 h-3" />}
                      Reinstall
                    </button>
                  </>
                )}
                {isQwenInstalled() && cliVersions?.qwen?.latest && (
                  <button
                    onClick={handleUpdateQwen}
                    disabled={updatingQwen}
                    className="btn-primary btn-xs flex items-center gap-1"
                    title="Update Qwen CLI"
                  >
                    {updatingQwen ? <span className="spinner-sm" /> : <RefreshCw className="w-3 h-3" />}
                    Update
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-neutral-400">
              {isQwenInstalled() ? (
                <>
                  Version: {getQwenVersion()}
                  {cliVersions?.qwen?.latest && (
                    <span className="text-xs text-primary ml-2">
                      (Latest: {cliVersions.qwen.latest})
                    </span>
                  )}
                </>
              ) : (
                'Not installed'
              )}
            </p>
            {!isQwenInstalled() && (
              <button
                onClick={handleInstallQwen}
                disabled={installingQwen}
                className="btn-primary btn-sm flex items-center gap-2 mt-2"
              >
                {installingQwen && <span className="spinner" />}
                Install
              </button>
            )}
            {isQwenInstalled() && (
              <div className="flex flex-wrap gap-1 mt-2">
                <button
                  onClick={() => handleOpenTerminal('qwen')}
                  className="btn-ghost btn-xs"
                  title="Open Qwen CLI"
                >
                  Qwen
                </button>
                <button
                  onClick={() => handleOpenTerminal('qwen --help')}
                  className="btn-ghost btn-xs"
                  title="Show Qwen help"
                >
                  Help
                </button>
                <button
                  onClick={() => handleOpenTerminal('qwen --version')}
                  className="btn-ghost btn-xs"
                  title="Show Qwen version"
                >
                  Version
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ports & URLs */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Ports & URLs</h3>
          <button
            onClick={handleResolveUrls}
            disabled={resolvingUrls}
            className="btn-ghost btn-sm flex items-center gap-2"
          >
            {resolvingUrls && <span className="spinner" />}
            Test URLs
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-neutral-400 pb-2 border-b border-white/[0.05]">
            <div>Service</div>
            <div>Port</div>
            <div>Status</div>
          </div>
          
          {Object.entries(project.ports || {}).map(([service, port]) => (
            <div key={service} className="grid grid-cols-3 gap-4 text-sm py-2">
              <div className="font-medium">{service}</div>
              <div className="font-mono text-neutral-400">{String(port)}</div>
              <div>
                {project.status === 'running' ? (
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="status-dot status-running" />
                    Active
                  </span>
                ) : (
                  <span className="text-neutral-500 flex items-center gap-1">
                    <span className="status-dot status-stopped" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {urls && (
          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <h4 className="text-sm font-medium mb-2">URL Test Results</h4>
            <div className="space-y-1">
              {urls.matrix?.map((test: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-neutral-400">{String(test.url)}</span>
                  {test.ok ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              ))}
            </div>
            {urls.baseUrl && (
              <p className="mt-2 text-sm">
                <span className="text-neutral-400">Selected URL:</span>{' '}
                <span className="font-mono text-primary">{String(urls.baseUrl)}</span>
              </p>
            )}
          </div>
        )}
      </section>

      {/* Project Info */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Project Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Type</span>
            <span className="font-medium">{project.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Location</span>
            <span className="font-medium">{project.location === 'wsl' ? 'WSL' : 'Windows'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Path</span>
            <span className="font-mono text-xs">
              {project.location === 'wsl' 
                ? (typeof project.paths?.wsl === 'string' ? project.paths.wsl : '') 
                : (typeof project.paths?.windows === 'string' ? project.paths.windows : '')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Docker Project</span>
            <span className="font-mono">{project.dockerProject}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Created</span>
            <span>{new Date(project.createdAt).toLocaleDateString('hr-HR')}</span>
          </div>
        </div>
      </section>

      {/* Credentials (for WordPress projects) */}
      {project.type === 'wordpress' && (
        <>
          <section className="card">
            <h3 className="text-lg font-medium mb-4">Default Credentials</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-300 mb-2">WordPress Admin</h4>
                <div className="space-y-2 text-sm pl-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Username</span>
                    <span className="font-mono">admin</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Password</span>
                    <span className="font-mono">admin123!</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Login URL</span>
                    <a 
                      href={`http://localhost:${project.ports?.http || 8080}/wp-admin`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary hover:underline"
                    >
                      localhost:{project.ports?.http || 8080}/wp-admin
                    </a>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-300 mb-2">Database (MariaDB)</h4>
                <div className="space-y-2 text-sm pl-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Host</span>
                    <span className="font-mono">localhost:{project.ports?.db || 3306}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Database</span>
                    <span className="font-mono">wordpress</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Username</span>
                    <span className="font-mono">wpuser</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Password</span>
                    <span className="font-mono">wppass123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Root Password</span>
                    <span className="font-mono">rootpass123</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-300 mb-2">phpMyAdmin</h4>
                <div className="space-y-2 text-sm pl-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">URL</span>
                    <a 
                      href={`http://localhost:${project.ports?.phpmyadmin || 8081}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary hover:underline"
                    >
                      localhost:{project.ports?.phpmyadmin || 8081}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Login with</span>
                    <span className="font-mono">wpuser / wppass123</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ProjectOverview;