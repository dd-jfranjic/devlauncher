import React, { useState, useEffect } from 'react'
import { useAppStore, useFilteredProjects } from '@stores/appStore'
import Button from '@components/ui/Button'
import ProjectCard from '@components/projects/ProjectCard'
import NewProjectModal from '@components/projects/NewProjectModal'
import { Project } from '@types'

const Sidebar: React.FC = () => {
  const {
    projects,
    selectedProjectId,
    isLoadingProjects,
    projectSearchQuery,
    showNewProjectModal,
    setProjectSearchQuery,
    setSelectedProjectId,
    setShowNewProjectModal,
    loadProjects
  } = useAppStore()

  const filteredProjects = useFilteredProjects()
  const [searchValue, setSearchValue] = useState(projectSearchQuery)

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setProjectSearchQuery(searchValue)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchValue, setProjectSearchQuery])

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleProjectSelect = (project: Project) => {
    setSelectedProjectId(project.id)
  }

  const handleNewProject = () => {
    setShowNewProjectModal(true)
  }

  return (
    <>
      <div className="h-full bg-white border-r border-neutral-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200">
          <Button
            onClick={handleNewProject}
            className="w-full justify-center"
            size="md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Button>
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b border-neutral-200 space-y-3">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="input pr-10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Quick stats */}
          {!isLoadingProjects && (
            <div className="flex items-center justify-between text-caption text-neutral-500">
              <span>
                {filteredProjects.length} of {projects.length} projects
              </span>
              <div className="flex items-center space-x-2">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-success rounded-full mr-1" />
                  {projects.filter(p => p.status === 'running').length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {isLoadingProjects ? (
            <div className="p-4 space-y-3">
              {/* Loading skeletons */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-button" />
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="p-4 space-y-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isSelected={project.id === selectedProjectId}
                  onSelect={() => handleProjectSelect(project)}
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="p-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-body font-medium text-neutral-900 mb-2">
                  No projects yet
                </h3>
                <p className="text-caption text-neutral-600 mb-4">
                  Create your first project to get started with Dev Launcher.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNewProject}
                >
                  Create Project
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-body font-medium text-neutral-900 mb-2">
                  No matching projects
                </h3>
                <p className="text-caption text-neutral-600 mb-4">
                  Try adjusting your search terms or create a new project.
                </p>
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchValue('')
                      setProjectSearchQuery('')
                    }}
                  >
                    Clear search
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleNewProject}
                  >
                    New Project
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts hint */}
        <div className="p-4 border-t border-neutral-200">
          <div className="text-caption text-neutral-500">
            <div className="flex items-center justify-between">
              <span>Ctrl+N</span>
              <span>New Project</span>
            </div>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </>
  )
}

export default Sidebar