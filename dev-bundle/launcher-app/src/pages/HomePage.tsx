import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  FolderIcon,
  CodeBracketIcon,
  CommandLineIcon,
  ServerStackIcon,
  GlobeAltIcon,
  CircleStackIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  StopIcon,
  ArrowTopRightOnSquareIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'
import { Project } from '../types'
import clsx from 'clsx'
import ProjectDetail from '../components/ProjectDetail'

export default function HomePage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])
  
  useEffect(() => {
    const interval = setInterval(loadProjects, 5000)
    return () => clearInterval(interval)
  }, [loading]) // Dependency on loading to avoid stale closure

  const loadProjects = async () => {
    try {
      const loadedProjects = await window.electronAPI.getProjects()
      setProjects(loadedProjects)
      
      // Keep selected project updated
      setSelectedProject(prevSelected => {
        if (!prevSelected) {
          // Only auto-select first project on initial load
          if (loading && loadedProjects.length > 0) {
            return loadedProjects[0]
          }
          return null
        }
        
        // Find the updated version of the selected project
        const updated = loadedProjects.find(p => p.id === prevSelected.id)
        if (updated) {
          return updated
        } else {
          return null
        }
      })
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaudeCommand = async (command: string) => {
    if (!selectedProject) return
    
    // Different path for different project types
    let projectPath = selectedProject.path.replace(/\//g, '\\')
    if (selectedProject.type === 'wordpress') {
      projectPath = `${projectPath}\\app\\public`
    }
    // For nextjs-fullstack and other project types, use root directory
    
    await window.electronAPI.runCommand('cmd', [
      '/c', 'start', 'powershell', '-NoExit', '-Command', 
      `cd '${projectPath}'; ${command}`
    ])
  }

  // Filter and sort projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterActive === null || 
      (filterActive ? project.status === 'active' : project.status !== 'active')
    return matchesSearch && matchesFilter
  })

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <RocketLaunchIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">DevLauncher</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Local Development Environment Manager</p>
            </div>
          </div>
          
          {/* New Project Button */}
          <button
            onClick={() => navigate('/new-project')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
          >
            <PlusIcon className="h-5 w-5" />
            New Project
          </button>
        </div>
        
        {/* Search and Filter */}
        <div className="p-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          
          {/* Sort and Filter Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'name' ? 'date' : 'name')}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300"
            >
              <ArrowsUpDownIcon className="h-4 w-4" />
              <span>{sortBy === 'name' ? 'Name' : 'Date'}</span>
            </button>
            <button
              onClick={() => setFilterActive(filterActive === null ? true : filterActive === true ? false : null)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm',
                filterActive === null
                  ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white'
                  : filterActive
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              )}
            >
              <FunnelIcon className="h-4 w-4" />
              <span>{filterActive === null ? 'All' : filterActive ? 'Active' : 'Stopped'}</span>
            </button>
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-white">
              <FolderIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">
                {searchQuery || filterActive !== null ? 'No projects found' : 'No projects yet'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {sortedProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={clsx(
                    'w-full p-4 rounded-lg border transition-all text-left',
                    selectedProject?.id === project.id
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={clsx(
                        'p-2 rounded-lg',
                        selectedProject?.id === project.id
                          ? 'bg-purple-200 dark:bg-purple-800'
                          : 'bg-gray-100 dark:bg-gray-700'
                      )}>
                        <FolderIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Port {project.wpPort} • {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      project.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    )}>
                      {project.status === 'active' ? 'Active' : 'Stopped'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Sidebar Footer - Stats */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-white">Total Projects</span>
            <span className="font-medium text-gray-900 dark:text-white">{projects.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-white">Active</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {projects.filter(p => p.status === 'active').length}
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel - Project Details */}
      <div className="flex-1 flex flex-col">
        {selectedProject ? (
          <>
            {/* Project Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedProject.name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <ServerStackIcon className="h-4 w-4" />
                      <span>Port {selectedProject.wpPort}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>{new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      selectedProject.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    )}>
                      {selectedProject.status === 'active' ? 'Running' : 'Stopped'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Claude Commands */}
                  <button
                    onClick={() => handleClaudeCommand('claude --resume --dangerously-skip-permissions')}
                    className="px-3 py-1.5 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30 rounded-md transition-colors font-medium"
                    title="Resume Claude session (Bypass mode)"
                  >
                    Resume (Bypass)
                  </button>
                  <button
                    onClick={() => handleClaudeCommand('claude --dangerously-skip-permissions -c')}
                    className="px-3 py-1.5 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30 rounded-md transition-colors font-medium"
                    title="Start Claude in chat mode (Bypass mode)"
                  >
                    Chat (Bypass)
                  </button>
                  <button
                    onClick={() => handleClaudeCommand('claude mcp list')}
                    className="px-3 py-1.5 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30 rounded-md transition-colors font-medium"
                    title="List MCP servers"
                  >
                    MCP List
                  </button>
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                  <button
                    onClick={loadProjects}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="Refresh"
                  >
                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Project Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <ProjectDetail 
                project={selectedProject} 
                onRefresh={loadProjects}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Squares2X2Icon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Select a project
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a project from the sidebar to view details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}