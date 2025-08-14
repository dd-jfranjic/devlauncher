// Re-export store types for convenience
export type { Project, TabType } from '@stores/appStore'

// Component prop types
export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export interface IconProps {
  className?: string
  size?: number
}

// Form types
export interface NewProjectFormData {
  name: string
  slug: string
  template: 'blank' | 'nextjs' | 'wordpress'
  location: 'windows' | 'wsl'
  path: string
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Docker types
export interface DockerContainer {
  id: string
  name: string
  image: string
  status: 'created' | 'running' | 'paused' | 'restarting' | 'removing' | 'dead' | 'exited'
  ports: Array<{
    privatePort: number
    publicPort?: number
    type: string
  }>
  created: string
}

export interface DockerImage {
  id: string
  repository: string
  tag: string
  size: number
  created: string
}

// MCP types
export interface MCPServer {
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
  disabled?: boolean
}

export interface MCPTool {
  name: string
  description?: string
  inputSchema: any
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

// Log types
export interface LogEntry {
  id: string
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  source: string
  message: string
  data?: any
}

// Settings types
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  autoStart: boolean
  notifications: boolean
  dockerPath?: string
  defaultLocation: 'windows' | 'wsl'
  defaultTemplate: 'blank' | 'nextjs' | 'wordpress'
  closeToTray: boolean
  launchOnStartup: boolean
}

// Command execution types
export interface CommandResult {
  success: boolean
  output?: string
  error?: string
  exitCode?: number
}

// Port management types
export interface PortMapping {
  internal: number
  external: number
  protocol: 'tcp' | 'udp'
  service: string
}

export interface PortStatus {
  port: number
  status: 'available' | 'in-use' | 'reserved'
  service?: string
}

// Template types
export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: 'web' | 'api' | 'fullstack' | 'database'
  tags: string[]
  dockerCompose: string
  files: Array<{
    path: string
    content: string
    executable?: boolean
  }>
  ports: PortMapping[]
  environment?: Record<string, string>
  postInstall?: string[]
}

// Audit log types
export interface AuditLogEntry {
  id: string
  timestamp: string
  action: string
  resource: string
  resourceId: string
  userId?: string
  details?: Record<string, any>
  success: boolean
  error?: string
}

// System info types
export interface SystemInfo {
  platform: string
  arch: string
  nodeVersion: string
  electronVersion: string
  chromeVersion: string
  dockerVersion?: string
  wslVersion?: string
  availableMemory: number
  totalMemory: number
  cpuCount: number
}

// Window state types
export interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
  isFullScreen: boolean
}

// Notification types
export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  silent?: boolean
  urgency?: 'low' | 'normal' | 'critical'
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}