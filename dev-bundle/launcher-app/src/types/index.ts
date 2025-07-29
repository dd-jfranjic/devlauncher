export interface Project {
  id: string
  name: string
  path: string
  type: 'wordpress' | 'static' | 'ai-agent' | 'node' | 'fiskal-ai'
  createdAt: string
  mcpEnabled: boolean
  wordpressMcpEnabled: boolean
  contextEngineeringEnabled: boolean
  pocketFlowEnabled: boolean
  prpsEnabled: boolean
  prpsTemplate?: 'basic' | 'advanced' | 'enterprise'
  status: 'active' | 'stopped' | 'error'
  // WordPress specific ports
  wpPort?: number
  wpHttpsPort?: number
  dbPort?: number
  pmaPort?: number
  mailPort?: number
  smtpPort?: number
  // Fiskal AI specific ports
  backendPort?: number
  redisPort?: number
  browserPort?: number
}

export interface MCPService {
  id: string
  name: string
  url: string
  transport: 'sse' | 'stdio'
  status: 'running' | 'stopped' | 'error'
}

export interface ElectronAPI {
  getProjects: () => Promise<Project[]>
  saveProject: (project: Project) => Promise<{ success: boolean }>
  runCommand: (command: string, args: string[], cwd?: string) => Promise<any>
  openInVSCode: (path: string) => Promise<void>
  openInBrowser: (url: string) => Promise<void>
  selectDirectory: () => Promise<string>
  copyTemplate: (templateType: string, targetPath: string, projectData: any) => Promise<{ success: boolean, error?: string }>
  deleteProject: (projectId: string, projectPath: string) => Promise<{ success: boolean, error?: string }>
  getWpCredentials: (projectPath: string) => Promise<{ success: boolean, username: string, password: string }>
  copyMcpScript: (projectPath: string, wpUrl: string, publicPath: string) => Promise<{ success: boolean, scriptPath?: string, error?: string }>
  writePsScript: (scriptPath: string, scriptContent: string) => Promise<{ success: boolean, error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}