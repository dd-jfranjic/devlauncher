import React, { useState, useEffect } from 'react'
import { useAppStore } from '@stores/appStore'
import { NewProjectFormData } from '@types'
import { generateSlug, isValidSlug } from '@lib/utils'
import Button from '@components/ui/Button'
import Modal from '@components/ui/Modal'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose
}) => {
  const { createProject, isCreatingProject, projects } = useAppStore()
  
  const [formData, setFormData] = useState<NewProjectFormData>({
    name: '',
    slug: '',
    template: 'blank',
    location: 'windows',
    path: ''
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof NewProjectFormData, string>>>({})
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && formData.name) {
      const generatedSlug = generateSlug(formData.name)
      setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.name, slugManuallyEdited])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        slug: '',
        template: 'blank',
        location: 'windows',
        path: ''
      })
      setErrors({})
      setSlugManuallyEdited(false)
    }
  }, [isOpen])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewProjectFormData, string>> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Project name must be at least 2 characters'
    } else if (formData.name.length > 50) {
      newErrors.name = 'Project name must be less than 50 characters'
    }

    // Slug validation
    if (!formData.slug.trim()) {
      newErrors.slug = 'Project slug is required'
    } else if (!isValidSlug(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    } else if (projects.some(p => p.slug === formData.slug)) {
      newErrors.slug = 'A project with this slug already exists'
    }

    // Path validation
    if (!formData.path.trim()) {
      newErrors.path = 'Project path is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof NewProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    // Mark slug as manually edited if user changes it
    if (field === 'slug') {
      setSlugManuallyEdited(true)
    }
  }

  const handleSelectPath = async () => {
    if (window.electronAPI) {
      const selectedPath = await window.electronAPI.fs.selectFolder()
      if (selectedPath) {
        setFormData(prev => ({ ...prev, path: selectedPath }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await createProject({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        template: formData.template,
        location: formData.location,
        path: formData.path.trim(),
        ports: {},
        status: 'stopped'
      })
      onClose()
    } catch (error) {
      // Error is handled in the store
      console.error('Failed to create project:', error)
    }
  }

  const getTemplateDescription = (template: string) => {
    switch (template) {
      case 'nextjs':
        return 'Next.js React framework with TypeScript, Tailwind CSS, and Docker setup'
      case 'wordpress':
        return 'WordPress with MySQL database, phpMyAdmin, and Docker configuration'
      case 'blank':
      default:
        return 'Empty project with basic Docker Compose setup'
    }
  }

  const getLocationDescription = (location: string) => {
    switch (location) {
      case 'wsl':
        return 'Better performance for Docker operations, Linux compatibility'
      case 'windows':
      default:
        return 'Native Windows filesystem, easier file access from Windows apps'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Project">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label htmlFor="project-name" className="block text-caption font-medium text-neutral-900 mb-2">
            Project Name
          </label>
          <input
            id="project-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="My Awesome Project"
            disabled={isCreatingProject}
          />
          {errors.name && (
            <p className="mt-1 text-caption text-error">{errors.name}</p>
          )}
        </div>

        {/* Project Slug */}
        <div>
          <label htmlFor="project-slug" className="block text-caption font-medium text-neutral-900 mb-2">
            Project Slug
          </label>
          <input
            id="project-slug"
            type="text"
            value={formData.slug}
            onChange={(e) => handleInputChange('slug', e.target.value)}
            className={`input ${errors.slug ? 'input-error' : ''}`}
            placeholder="my-awesome-project"
            disabled={isCreatingProject}
          />
          {errors.slug && (
            <p className="mt-1 text-caption text-error">{errors.slug}</p>
          )}
          <p className="mt-1 text-caption text-neutral-500">
            Used for Docker container names and folder structure
          </p>
        </div>

        {/* Template Selection */}
        <div>
          <label className="block text-caption font-medium text-neutral-900 mb-3">
            Template
          </label>
          <div className="space-y-3">
            {(['blank', 'nextjs', 'wordpress'] as const).map((template) => (
              <label key={template} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="template"
                  value={template}
                  checked={formData.template === template}
                  onChange={(e) => handleInputChange('template', e.target.value)}
                  className="mt-1 text-primary focus:ring-primary"
                  disabled={isCreatingProject}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-body font-medium text-neutral-900 capitalize">
                    {template === 'nextjs' ? 'Next.js' : template}
                  </div>
                  <div className="text-caption text-neutral-600">
                    {getTemplateDescription(template)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Location Selection */}
        <div>
          <label className="block text-caption font-medium text-neutral-900 mb-3">
            Location
          </label>
          <div className="space-y-3">
            {(['windows', 'wsl'] as const).map((location) => (
              <label key={location} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="location"
                  value={location}
                  checked={formData.location === location}
                  onChange={(e) => handleInputChange('location', e.target.value as 'windows' | 'wsl')}
                  className="mt-1 text-primary focus:ring-primary"
                  disabled={isCreatingProject}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-body font-medium text-neutral-900 uppercase">
                    {location}
                  </div>
                  <div className="text-caption text-neutral-600">
                    {getLocationDescription(location)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Project Path */}
        <div>
          <label htmlFor="project-path" className="block text-caption font-medium text-neutral-900 mb-2">
            Project Path
          </label>
          <div className="flex space-x-2">
            <input
              id="project-path"
              type="text"
              value={formData.path}
              onChange={(e) => handleInputChange('path', e.target.value)}
              className={`input flex-1 ${errors.path ? 'input-error' : ''}`}
              placeholder={formData.location === 'wsl' ? '/home/user/projects' : 'C:\\Projects'}
              disabled={isCreatingProject}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleSelectPath}
              disabled={isCreatingProject}
            >
              Browse
            </Button>
          </div>
          {errors.path && (
            <p className="mt-1 text-caption text-error">{errors.path}</p>
          )}
          {formData.location === 'windows' && (
            <p className="mt-1 text-caption text-warning">
              Note: Windows bind mounts may have slower performance compared to WSL
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isCreatingProject}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isCreatingProject}
            disabled={isCreatingProject}
          >
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default NewProjectModal