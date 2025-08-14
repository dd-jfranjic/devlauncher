import React, { useState } from 'react';
import { useStore } from '../stores/useStore';
import { deleteProject } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import {
  TrashIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

interface ProjectSettingsProps {
  project: any;
  onUpdate: () => void;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = ({ project, onUpdate }) => {
  const navigate = useNavigate();
  const { showToast, projects, setProjects } = useStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [purgeVolumes, setPurgeVolumes] = useState(false);

  const handleDelete = async () => {
    if (deleteConfirmation !== project.slug) {
      showToast({
        type: 'error',
        message: 'Please type the project slug to confirm deletion'
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProject(project.slug, purgeVolumes);
      
      // Remove from store
      setProjects(projects.filter(p => p.slug !== project.slug));
      
      showToast({
        type: 'success',
        message: `Project "${project.name}" deleted successfully`
      });
      
      // Navigate to projects list
      navigate('/projects');
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to delete project'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = () => {
    showToast({
      type: 'info',
      message: 'Project duplication will be available in the next version'
    });
  };

  const handleArchive = () => {
    showToast({
      type: 'info',
      message: 'Project archiving will be available in the next version'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      message: 'Copied to clipboard'
    });
  };

  return (
    <div className="space-y-6">
      {/* Project Information */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Project Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Project Name</label>
            <input
              type="text"
              value={project.name}
              className="input"
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={project.slug}
                className="input font-mono flex-1"
                disabled
              />
              <button
                onClick={() => copyToClipboard(project.slug)}
                className="btn-ghost"
              >
                Copy
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <input
                type="text"
                value={project.type}
                className="input"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={project.location === 'wsl' ? 'WSL' : 'Windows'}
                className="input"
                disabled
              />
            </div>
          </div>
        </div>
      </section>

      {/* Paths */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Project Paths</h3>
        <div className="space-y-3">
          {project.location === 'wsl' && project.paths?.wsl && (
            <div>
              <label className="block text-sm font-medium mb-2">WSL Path</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={project.paths.wsl}
                  className="input font-mono text-xs flex-1"
                  disabled
                />
                <button
                  onClick={() => copyToClipboard(project.paths.wsl)}
                  className="btn-ghost btn-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          
          {project.paths?.windows && (
            <div>
              <label className="block text-sm font-medium mb-2">Windows Path</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={project.paths.windows}
                  className="input font-mono text-xs flex-1"
                  disabled
                />
                <button
                  onClick={() => copyToClipboard(project.paths.windows)}
                  className="btn-ghost btn-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          
          {project.location === 'wsl' && project.paths?.unc && (
            <div>
              <label className="block text-sm font-medium mb-2">UNC Path</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={project.paths.unc}
                  className="input font-mono text-xs flex-1"
                  disabled
                />
                <button
                  onClick={() => copyToClipboard(project.paths.unc)}
                  className="btn-ghost btn-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Docker Configuration */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Docker Configuration</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2">
            <span className="text-neutral-400">Project Name</span>
            <span className="font-mono">{project.dockerProject}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-neutral-400">Network</span>
            <span className="font-mono">{project.slug}_network</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-neutral-400">Compose File</span>
            <span className="font-mono">docker-compose.yml</span>
          </div>
        </div>
      </section>

      {/* Project Actions */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Project Actions</h3>
        <div className="space-y-3">
          <button
            onClick={handleDuplicate}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <DocumentDuplicateIcon className="w-5 h-5" />
            Duplicate Project
          </button>
          
          <button
            onClick={handleArchive}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <ArchiveBoxIcon className="w-5 h-5" />
            Archive Project
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="card border-2 border-error/20">
        <div className="flex items-center gap-3 mb-4">
          <ExclamationTriangleIcon className="w-5 h-5 text-error" />
          <h3 className="text-lg font-medium text-error">Danger Zone</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-error/10 rounded-lg">
            <p className="text-sm text-neutral-300 mb-4">
              Deleting a project will permanently remove all files and Docker resources. 
              This action cannot be undone.
            </p>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={purgeVolumes}
                  onChange={(e) => setPurgeVolumes(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600 text-error focus:ring-error"
                />
                <span className="text-sm">Also delete Docker volumes (database data)</span>
              </label>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Type <span className="font-mono text-error">{project.slug}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Enter project slug"
                  className="input"
                />
              </div>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirmation !== project.slug}
                className="btn-primary bg-error hover:bg-error/90 w-full flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="spinner" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-5 h-5" />
                    Delete Project Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Metadata */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Metadata</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2">
            <span className="text-neutral-400">Project ID</span>
            <span className="font-mono text-xs">{project.id}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-neutral-400">Created</span>
            <span>{new Date(project.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-neutral-400">Last Updated</span>
            <span>{new Date(project.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectSettings;