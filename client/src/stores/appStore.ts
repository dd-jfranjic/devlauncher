import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Types
export interface Project {
  id: string
  name: string
  slug: string
  path: string
  template: 'blank' | 'nextjs' | 'wordpress'
  location: 'windows' | 'wsl'
  status: 'stopped' | 'starting' | 'running' | 'error'
  ports: Record<string, number>
  createdAt: string
  updatedAt: string
}

export type TabType = 'Overview' | 'Docker' | 'MCP' | 'Logs' | 'Settings'

interface AppState {
  // App metadata
  appVersion: string
  electronReady: boolean
  
  // UI state
  activeTab: TabType
  sidebarCollapsed: boolean
  showNewProjectModal: boolean
  
  // Projects
  projects: Project[]
  selectedProjectId: string | null
  
  // Loading states
  isLoadingProjects: boolean
  isCreatingProject: boolean
  
  // Error states
  error: string | null
  
  // Filters and search
  projectSearchQuery: string
  projectSortBy: 'name' | 'created' | 'updated'
  projectSortOrder: 'asc' | 'desc'
}

interface AppActions {
  // App actions
  setAppVersion: (version: string) => void
  setElectronReady: (ready: boolean) => void
  clearError: () => void
  
  // UI actions
  setActiveTab: (tab: TabType) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setShowNewProjectModal: (show: boolean) => void
  
  // Project actions
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  removeProject: (id: string) => void
  setSelectedProjectId: (id: string | null) => void
  
  // Loading actions
  setIsLoadingProjects: (loading: boolean) => void
  setIsCreatingProject: (creating: boolean) => void
  
  // Error actions
  setError: (error: string | null) => void
  
  // Filter actions
  setProjectSearchQuery: (query: string) => void
  setProjectSortBy: (sortBy: 'name' | 'created' | 'updated') => void
  setProjectSortOrder: (order: 'asc' | 'desc') => void
  
  // Async actions
  loadProjects: () => Promise<void>
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  startProject: (id: string) => Promise<void>
  stopProject: (id: string) => Promise<void>
}

type AppStore = AppState & AppActions

// Initial state
const initialState: AppState = {
  appVersion: '0.1.0',
  electronReady: false,
  activeTab: 'Overview',
  sidebarCollapsed: false,
  showNewProjectModal: false,
  projects: [],
  selectedProjectId: null,
  isLoadingProjects: false,
  isCreatingProject: false,
  error: null,
  projectSearchQuery: '',
  projectSortBy: 'updated',
  projectSortOrder: 'desc'
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // App actions
        setAppVersion: (version: string) => set({ appVersion: version }),
        setElectronReady: (ready: boolean) => set({ electronReady: ready }),
        clearError: () => set({ error: null }),
        
        // UI actions
        setActiveTab: (tab: TabType) => set({ activeTab: tab }),
        setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
        setShowNewProjectModal: (show: boolean) => set({ showNewProjectModal: show }),
        
        // Project actions
        setProjects: (projects: Project[]) => set({ projects }),
        addProject: (project: Project) => set(state => ({ 
          projects: [...state.projects, project] 
        })),
        updateProject: (id: string, updates: Partial<Project>) => set(state => ({
          projects: state.projects.map(project => 
            project.id === id ? { ...project, ...updates, updatedAt: new Date().toISOString() } : project
          )
        })),
        removeProject: (id: string) => set(state => ({
          projects: state.projects.filter(project => project.id !== id),
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId
        })),
        setSelectedProjectId: (id: string | null) => set({ selectedProjectId: id }),
        
        // Loading actions
        setIsLoadingProjects: (loading: boolean) => set({ isLoadingProjects: loading }),
        setIsCreatingProject: (creating: boolean) => set({ isCreatingProject: creating }),
        
        // Error actions
        setError: (error: string | null) => set({ error }),
        
        // Filter actions
        setProjectSearchQuery: (query: string) => set({ projectSearchQuery: query }),
        setProjectSortBy: (sortBy: 'name' | 'created' | 'updated') => set({ projectSortBy: sortBy }),
        setProjectSortOrder: (order: 'asc' | 'desc') => set({ projectSortOrder: order }),
        
        // Async actions
        loadProjects: async () => {
          const { setIsLoadingProjects, setProjects, setError } = get()
          
          try {
            setIsLoadingProjects(true)
            setError(null)
            
            if (window.electronAPI) {
              const result = await window.electronAPI.project.list()
              if (result.success) {
                setProjects(result.data)
              } else {
                throw new Error(result.error)
              }
            } else {
              // Mock data for browser development
              setProjects([])
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to load projects')
          } finally {
            setIsLoadingProjects(false)
          }
        },
        
        createProject: async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
          const { setIsCreatingProject, addProject, setError, setSelectedProjectId, setActiveTab } = get()
          
          try {
            setIsCreatingProject(true)
            setError(null)
            
            const newProject: Project = {
              ...projectData,
              id: crypto.randomUUID(),
              status: 'stopped',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            if (window.electronAPI) {
              const result = await window.electronAPI.project.create(newProject)
              if (result.success) {
                addProject(newProject)
                setSelectedProjectId(newProject.id)
                setActiveTab('Overview')
              } else {
                throw new Error(result.error)
              }
            } else {
              // Mock for browser development
              addProject(newProject)
              setSelectedProjectId(newProject.id)
              setActiveTab('Overview')
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create project')
            throw error
          } finally {
            setIsCreatingProject(false)
          }
        },
        
        startProject: async (id: string) => {
          const { updateProject, setError } = get()
          
          try {
            setError(null)
            updateProject(id, { status: 'starting' })
            
            if (window.electronAPI) {
              const result = await window.electronAPI.project.start(id)
              if (result.success) {
                updateProject(id, { status: 'running' })
              } else {
                updateProject(id, { status: 'error' })
                throw new Error(result.error)
              }
            } else {
              // Mock for browser development
              setTimeout(() => {
                updateProject(id, { status: 'running' })
              }, 2000)
            }
          } catch (error) {
            updateProject(id, { status: 'error' })
            setError(error instanceof Error ? error.message : 'Failed to start project')
            throw error
          }
        },
        
        stopProject: async (id: string) => {
          const { updateProject, setError } = get()
          
          try {
            setError(null)
            
            if (window.electronAPI) {
              const result = await window.electronAPI.project.stop(id)
              if (result.success) {
                updateProject(id, { status: 'stopped' })
              } else {
                throw new Error(result.error)
              }
            } else {
              // Mock for browser development
              updateProject(id, { status: 'stopped' })
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to stop project')
            throw error
          }
        }
      }),
      {
        name: 'dev-launcher-store',
        // Only persist UI preferences and project data, not loading states
        partialize: (state) => ({
          activeTab: state.activeTab,
          sidebarCollapsed: state.sidebarCollapsed,
          projects: state.projects,
          selectedProjectId: state.selectedProjectId,
          projectSortBy: state.projectSortBy,
          projectSortOrder: state.projectSortOrder
        })
      }
    ),
    { name: 'dev-launcher-store' }
  )
)

// Selectors for computed values
export const useSelectedProject = () => {
  return useAppStore(state => 
    state.projects.find(project => project.id === state.selectedProjectId) || null
  )
}

export const useFilteredProjects = () => {
  return useAppStore(state => {
    let filtered = state.projects

    // Apply search filter
    if (state.projectSearchQuery) {
      const query = state.projectSearchQuery.toLowerCase()
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query) ||
        project.slug.toLowerCase().includes(query) ||
        project.template.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (state.projectSortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'updated':
        default:
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
      }

      if (aValue < bValue) return state.projectSortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return state.projectSortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  })
}