import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../stores/useStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Search,
  Settings,
  Folder,
  Play,
  Square,
  Zap,
  FileText,
  Layout
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { 
    projects, 
    sidebarCollapsed, 
    toggleSidebar, 
    openModal,
    selectProject 
  } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectClick = (project: typeof projects[0]) => {
    selectProject(project.id);
    navigate(`/projects/${project.slug}`);
  };

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'nextjs':
        return <Zap className="w-4 h-4" />;
      case 'wordpress':
        return <FileText className="w-4 h-4" />;
      default:
        return <Layout className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-neutral-500';
    }
  };

  return (
    <aside 
      className={`${
        sidebarCollapsed ? 'w-16' : 'w-80'
      } bg-neutral-950/50 backdrop-blur-xl border-r border-white/[0.05] flex flex-col transition-all duration-300 flex-shrink-0`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/[0.05]">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">
              Projects
            </h2>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-white/[0.03] rounded-lg transition-all duration-200"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-neutral-400" />
            )}
          </button>
        </div>
      </div>

      {/* Search and Actions */}
      {!sidebarCollapsed && (
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 text-sm"
            />
          </div>
          
          <button
            onClick={() => openModal('newProject')}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            New Project
          </button>
        </div>
      )}

      {/* Project List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sidebarCollapsed ? (
          <div className="p-2 space-y-1">
            <button
              onClick={() => openModal('newProject')}
              className="w-12 h-12 flex items-center justify-center hover:bg-white/[0.03] rounded-lg transition-all duration-200"
              title="New Project"
            >
              <PlusCircle className="w-5 h-5 text-neutral-400" />
            </button>
            
            {filteredProjects.slice(0, 10).map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className={`w-12 h-12 flex items-center justify-center hover:bg-white/[0.03] rounded-lg transition-all duration-200 ${
                  slug === project.slug ? 'bg-white/[0.05] border border-indigo-500/30' : ''
                }`}
                title={project.name}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 flex items-center justify-center text-neutral-400">
                  {getProjectIcon(project.type)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-2">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">
                  {searchQuery ? 'No projects found' : 'No projects yet'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => openModal('newProject')}
                    className="text-primary text-sm mt-2 hover:underline"
                  >
                    Create your first project
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectClick(project)}
                    className={`w-full text-left p-3 rounded-lg hover:bg-white/[0.03] transition-all duration-200 group ${
                      slug === project.slug ? 'bg-white/[0.05] border border-indigo-500/30' : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 flex items-center justify-center text-neutral-400 mt-0.5">
                        {getProjectIcon(project.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-neutral-100 truncate group-hover:text-white">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            {project.status === 'running' && (
                              <span className="status-dot status-running" />
                            )}
                            {project.status === 'stopped' && (
                              <span className="status-dot status-stopped" />
                            )}
                            {project.status === 'error' && (
                              <span className="status-dot status-error" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500 truncate">{project.slug}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-600">
                            {project.location === 'wsl' ? 'WSL' : 'Windows'}
                          </span>
                          <span className={`text-xs ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/[0.05]">
        <button
          onClick={() => navigate('/settings')}
          className={`${
            sidebarCollapsed ? 'w-12 h-12 justify-center' : 'w-full justify-start px-3'
          } flex items-center gap-3 hover:bg-neutral-700 rounded-lg transition-colors py-2`}
          title="Settings"
        >
          <Settings className="w-5 h-5 text-neutral-400" />
          {!sidebarCollapsed && (
            <span className="text-sm text-neutral-300">Settings</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;