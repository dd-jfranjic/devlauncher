import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../stores/useStore';
import { 
  fetchProject, 
  startProject, 
  stopProject, 
  openTerminal,
  openFolder,
  openEditor,
  installClaude,
  installGemini,
  reallocatePorts,
  rebuildProject
} from '../lib/api';
import ProjectOverview from '../components/ProjectOverview';
import DockerTab from '../components/DockerTab';
import McpTab from '../components/McpTab';
import LogsTab from '../components/LogsTab';
import ProjectSettings from '../components/ProjectSettings';
import ArchonTab from '../components/ArchonTab';
import { 
  ArrowPathIcon,
  PlayIcon,
  StopIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const ProjectPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { projects, selectedProjectId, selectProject, activeTab, setActiveTab, showToast } = useStore();
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  useEffect(() => {
    if (slug) {
      loadProject();
    } else {
      setProject(null);
      setIsLoading(false);
    }
  }, [slug]);

  const loadProject = async () => {
    if (!slug) return;
    
    setIsLoading(true);
    try {
      const data = await fetchProject(slug);
      setProject(data);
      
      // Update in store
      const existingProject = projects.find(p => p.slug === slug);
      if (existingProject) {
        selectProject(existingProject.id);
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: `Failed to load project: ${slug}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!project) return;
    
    setIsPerformingAction(true);
    try {
      await startProject(project.slug);
      showToast({
        type: 'success',
        message: `Starting ${project.name}...`
      });
      // Reload project to get updated status
      await loadProject();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to start project'
      });
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleStop = async () => {
    if (!project) return;
    
    setIsPerformingAction(true);
    try {
      await stopProject(project.slug);
      showToast({
        type: 'success',
        message: `Stopping ${project.name}...`
      });
      await loadProject();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to stop project'
      });
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleRebuild = async () => {
    if (!project) return;
    
    setIsPerformingAction(true);
    try {
      await rebuildProject(project.slug);
      showToast({
        type: 'success',
        message: `Rebuilding ${project.name}...`
      });
      await loadProject();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to rebuild project'
      });
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleReallocatePorts = async () => {
    if (!project) return;
    
    setIsPerformingAction(true);
    try {
      const result = await reallocatePorts(project.slug);
      showToast({
        type: 'success',
        message: 'Ports reallocated successfully'
      });
      await loadProject();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to reallocate ports'
      });
    } finally {
      setIsPerformingAction(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'docker', label: 'Docker' },
    { id: 'mcp', label: 'MCP' },
    { id: 'archon', label: '🧠 Archon' },
    { id: 'logs', label: 'Logs' },
    { id: 'settings', label: 'Settings' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner w-8 h-8 mb-4" />
          <p className="text-neutral-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project && slug) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-neutral-400 mb-4">Project not found: {slug}</p>
          <button 
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-neutral-900 to-neutral-800">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
              <svg className="w-12 h-12 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-neutral-200 mb-2">Welcome to Dev Launcher</h2>
            <p className="text-neutral-400 mb-6">
              Select a project from the sidebar to view its details, manage Docker containers, configure MCP, and monitor logs.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <h3 className="font-medium text-neutral-200 mb-1">Quick Start</h3>
              <p className="text-sm text-neutral-400">
                Click "New Project" in the sidebar to create your first project
              </p>
            </div>
            
            <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <h3 className="font-medium text-neutral-200 mb-1">Keyboard Shortcuts</h3>
              <div className="text-sm text-neutral-400 space-y-1">
                <div><kbd className="px-2 py-1 bg-neutral-700 rounded text-xs">Ctrl+N</kbd> New Project</div>
                <div><kbd className="px-2 py-1 bg-neutral-700 rounded text-xs">Ctrl+,</kbd> Settings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="bg-neutral-800 border-b border-neutral-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              {project.name}
              <span className={`badge ${
                project.status === 'running' ? 'badge-success' : 
                project.status === 'error' ? 'badge-error' : 
                'badge-info'
              }`}>
                {project.status}
              </span>
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              {project.type} • {project.location === 'wsl' ? 'WSL' : 'Windows'} • {project.slug}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {project.status === 'stopped' ? (
              <button
                onClick={handleStart}
                disabled={isPerformingAction}
                className="btn-primary flex items-center gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                Start
              </button>
            ) : (
              <button
                onClick={handleStop}
                disabled={isPerformingAction}
                className="btn-secondary flex items-center gap-2"
              >
                <StopIcon className="w-4 h-4" />
                Stop
              </button>
            )}
            
            <button
              onClick={handleRebuild}
              disabled={isPerformingAction}
              className="btn-ghost"
              title="Rebuild containers"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => {
                useStore.getState().selectProject(project.id);
                useStore.getState().openModal('deleteProject');
              }}
              className="btn-ghost text-error hover:bg-error/10"
              title="Delete project"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-neutral-800 border-b border-neutral-700 px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <ProjectOverview 
            project={project} 
            onRefresh={loadProject}
            onAction={setIsPerformingAction}
          />
        )}
        {activeTab === 'docker' && (
          <DockerTab 
            project={project} 
            onRefresh={loadProject}
          />
        )}
        {activeTab === 'mcp' && (
          <McpTab 
            project={project} 
            onRefresh={loadProject}
          />
        )}
        {activeTab === 'archon' && (
          <ArchonTab 
            project={project} 
            onRefresh={loadProject}
          />
        )}
        {activeTab === 'logs' && (
          <LogsTab 
            project={project}
          />
        )}
        {activeTab === 'settings' && (
          <ProjectSettings 
            project={project} 
            onUpdate={loadProject}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectPage;