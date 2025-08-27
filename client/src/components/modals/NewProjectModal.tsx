import React, { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { createProject, startProject } from '../../lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

const NewProjectModal: React.FC = () => {
  const { modals, closeModal, showToast, setProjects, projects } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'blank' as 'blank' | 'nextjs' | 'wordpress' | 'php-saas',
    location: 'wsl' as 'windows' | 'wsl',
    autoStart: true,
    setupClaude: false,
    setupGemini: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!modals.newProject) return null;

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
    setErrors(prev => ({ ...prev, name: '', slug: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const slugRegex = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;
    if (!formData.slug) {
      newErrors.slug = 'Slug is required';
    } else if (!slugRegex.test(formData.slug)) {
      newErrors.slug = 'Invalid slug format (lowercase, alphanumeric, hyphens)';
    } else if (projects.some(p => p.slug === formData.slug)) {
      newErrors.slug = 'A project with this slug already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const newProject = await createProject(formData);
      
      setProjects([...projects, newProject]);
      
      showToast({
        type: 'success',
        message: `Project "${formData.name}" created successfully`
      });

      if (formData.autoStart) {
        // Start the project
        try {
          await startProject(newProject.slug);
        } catch (error) {
          console.error('Failed to start project:', error);
        }
      }

      if (formData.setupClaude) {
        // Install Claude CLI - TODO: Add API client method
        try {
          await fetch(`http://127.0.0.1:9976/api/projects/${newProject.slug}/install/claude`, { method: 'POST' });
        } catch (error) {
          console.error('Failed to install Claude CLI:', error);
        }
      }

      if (formData.setupGemini) {
        // Install Gemini CLI - TODO: Add API client method
        try {
          await fetch(`http://127.0.0.1:9976/api/projects/${newProject.slug}/install/gemini`, { method: 'POST' });
        } catch (error) {
          console.error('Failed to install Gemini CLI:', error);
        }
      }

      closeModal('newProject');
      setFormData({
        name: '',
        slug: '',
        type: 'blank',
        location: 'wsl',
        autoStart: true,
        setupClaude: false,
        setupGemini: false
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.message || 'Failed to create project'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getRootPath = () => {
    const settings = useStore.getState().settings;
    return formData.location === 'wsl' 
      ? settings.projectsRootWSL 
      : settings.projectsRootWindows;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create New Project</h2>
          <button
            onClick={() => closeModal('newProject')}
            className="p-1 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[calc(90vh-180px)]">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Project Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="input"
              placeholder="My Awesome Project"
              autoFocus
            />
            {errors.name && (
              <p className="text-error text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-2">Slug (URL-friendly name)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="input font-mono"
              placeholder="my-awesome-project"
            />
            {errors.slug && (
              <p className="text-error text-sm mt-1">{errors.slug}</p>
            )}
            <p className="text-neutral-500 text-xs mt-1">
              Path: {getRootPath()}/{formData.slug || '<slug>'}
            </p>
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Project Type</label>
            <div className="grid grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'blank' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'blank' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <span className="text-2xl mb-2 block">📁</span>
                <span className="text-sm font-medium">Blank</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'nextjs' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'nextjs' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <span className="text-2xl mb-2 block">⚡</span>
                <span className="text-sm font-medium">Next.js</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'wordpress' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'wordpress' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <span className="text-2xl mb-2 block">📝</span>
                <span className="text-sm font-medium">WordPress</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'php-saas' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'php-saas' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <span className="text-2xl mb-2 block">🚀</span>
                <span className="text-sm font-medium">PHP-SaaS</span>
              </button>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, location: 'wsl' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.location === 'wsl' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <span className="text-sm font-medium">WSL (Recommended)</span>
                <p className="text-xs text-neutral-500 mt-1">Better Docker performance</p>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, location: 'windows' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.location === 'windows' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <span className="text-sm font-medium">Windows</span>
                <p className="text-xs text-neutral-500 mt-1">Direct file access</p>
              </button>
            </div>
            {formData.location === 'windows' && formData.type !== 'blank' && (
              <p className="text-warning text-xs mt-2">
                ⚠️ Docker bind mounts may be slower on Windows. Consider using WSL for better performance.
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.autoStart}
                onChange={(e) => setFormData(prev => ({ ...prev, autoStart: e.target.checked }))}
                className="w-4 h-4 rounded border-neutral-600 text-primary focus:ring-primary"
              />
              <span className="text-sm">Auto-start after creation</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.setupClaude}
                onChange={(e) => setFormData(prev => ({ ...prev, setupClaude: e.target.checked }))}
                className="w-4 h-4 rounded border-neutral-600 text-primary focus:ring-primary"
              />
              <span className="text-sm">Set up Claude CLI</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.setupGemini}
                onChange={(e) => setFormData(prev => ({ ...prev, setupGemini: e.target.checked }))}
                className="w-4 h-4 rounded border-neutral-600 text-primary focus:ring-primary"
              />
              <span className="text-sm">Set up Gemini CLI</span>
            </label>
          </div>
        </form>

        <div className="p-6 border-t border-neutral-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => closeModal('newProject')}
            className="btn-secondary"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex items-center gap-2"
            disabled={isCreating}
          >
            {isCreating && <span className="spinner" />}
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;