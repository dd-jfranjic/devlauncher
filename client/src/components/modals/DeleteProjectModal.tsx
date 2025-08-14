import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../stores/useStore';
import { deleteProject } from '../../lib/api';
import Modal from '../ui/Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DeleteProjectModal: React.FC = () => {
  const navigate = useNavigate();
  const { modals, closeModal, selectedProjectId, projects, deleteProject: removeProject, showToast } = useStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [purgeVolumes, setPurgeVolumes] = useState(false);
  
  const project = projects.find(p => p.id === selectedProjectId);
  
  if (!modals.deleteProject || !project) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.slug, purgeVolumes);
      
      // Remove from store
      removeProject(project.id);
      
      // Show success toast
      showToast({
        type: 'success',
        message: `Project "${project.name}" deleted successfully`
      });
      
      // Close modal and navigate to home
      closeModal('deleteProject');
      navigate('/');
    } catch (error) {
      showToast({
        type: 'error',
        message: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={modals.deleteProject}
      onClose={() => closeModal('deleteProject')}
      title="Delete Project"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-error flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-neutral-200">
              Are you sure you want to delete <strong>{project.name}</strong>?
            </p>
            <p className="text-sm text-neutral-400">
              This action cannot be undone. The project folder and all its contents will be permanently removed.
            </p>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-3 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={purgeVolumes}
              onChange={(e) => setPurgeVolumes(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-primary focus:ring-primary"
              disabled={isDeleting}
            />
            <div>
              <p className="text-sm font-medium">Purge Docker volumes</p>
              <p className="text-xs text-neutral-500">
                Also remove Docker volumes and persistent data
              </p>
            </div>
          </label>
        </div>

        <div className="bg-error/10 border border-error/20 rounded-lg p-3">
          <p className="text-xs text-error">
            <strong>Warning:</strong> This will delete:
          </p>
          <ul className="text-xs text-neutral-400 mt-1 space-y-0.5 list-disc list-inside">
            <li>Project folder: {project.paths.windows || project.paths.wsl}</li>
            <li>All source code and files</li>
            {purgeVolumes && <li>Docker volumes and databases</li>}
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => closeModal('deleteProject')}
            disabled={isDeleting}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-danger flex items-center gap-2"
          >
            {isDeleting && <span className="spinner" />}
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteProjectModal;