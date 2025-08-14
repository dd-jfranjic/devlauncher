export type ProjectType = 'blank' | 'nextjs' | 'wordpress' | 'external-import';

export type ProjectLocation = 'windows' | 'wsl';

export type ProjectStatus = 'stopped' | 'running' | 'error';

export type TaskType = 'install_claude' | 'install_gemini' | 'smoke_test';

export type TaskStatus = 'queued' | 'running' | 'success' | 'failed';

// Enum-like objects for validation and iteration
export const ProjectTypeValues = {
  BLANK: 'blank' as ProjectType,
  NEXTJS: 'nextjs' as ProjectType,
  WORDPRESS: 'wordpress' as ProjectType,
  EXTERNAL_IMPORT: 'external-import' as ProjectType
};

export const ProjectLocationValues = {
  WINDOWS: 'windows' as ProjectLocation,
  WSL: 'wsl' as ProjectLocation
};

export const ProjectStatusValues = {
  STOPPED: 'stopped' as ProjectStatus,
  RUNNING: 'running' as ProjectStatus,
  ERROR: 'error' as ProjectStatus
};

export const TaskTypeValues = {
  INSTALL_CLAUDE: 'install_claude' as TaskType,
  INSTALL_GEMINI: 'install_gemini' as TaskType,
  SMOKE_TEST: 'smoke_test' as TaskType
};

export const TaskStatusValues = {
  QUEUED: 'queued' as TaskStatus,
  RUNNING: 'running' as TaskStatus,
  SUCCESS: 'success' as TaskStatus,
  FAILED: 'failed' as TaskStatus
};

export interface ProjectPaths {
  host: string;
  container: string;
  relative: string;
}

export interface ProjectPorts {
  [serviceName: string]: {
    internal: number;
    external: number;
    protocol: 'tcp' | 'udp';
  };
}

export interface ClaudeCliConfig {
  installed: boolean;
  version?: string;
  configPath?: string;
  mcpConfig?: string;
}

export interface GeminiCliConfig {
  installed: boolean;
  version?: string;
  configPath?: string;
}

export interface UrlResolverConfig {
  candidates: string[];
  resolved?: string;
  lastChecked?: string;
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown';
}

export interface ProjectData {
  id: string;
  name: string;
  slug: string;
  type: ProjectType;
  location: ProjectLocation;
  paths: ProjectPaths;
  ports: ProjectPorts;
  dockerProject: string;
  status: ProjectStatus;
  claudeCli: ClaudeCliConfig;
  geminiCli: GeminiCliConfig;
  urlResolver?: UrlResolverConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskData {
  id: string;
  projectSlug: string;
  type: TaskType;
  status: TaskStatus;
  logPath: string;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortReservationData {
  id: string;
  slug: string;
  template: string;
  portName: string;
  portNumber: number;
  createdAt: Date;
}

export interface AuditLogData {
  id: string;
  ts: Date;
  actor: string;
  action: string;
  params?: any;
  result?: any;
}

export interface SettingsData {
  id: string;
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  data: T;
  error: null;
  meta: {
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  code: number;
  details?: any;
}