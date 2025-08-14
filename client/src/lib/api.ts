const API_BASE_URL = 'http://127.0.0.1:9976/api';

interface ApiError {
  error: string;
  message: string;
  code: number;
  details?: any;
}

class ApiClient {
  private token: string | null = null;
  private csrfToken: string | null = null;

  constructor() {
    this.loadToken();
  }

  private loadToken() {
    // In production, this would load from secure storage
    this.token = localStorage.getItem('dev-launcher-token');
  }

  private async getCsrfToken() {
    // TODO: Implement CSRF protection
    return 'dev-token';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
      const csrfToken = await this.getCsrfToken();
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const error: ApiError = JSON.parse(text);
        throw new Error(error.message || 'API request failed');
      } catch (e) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;
    
    const result = JSON.parse(text);
    // API returns data wrapped in { data, error, meta } structure
    return result.data || result;
  }

  // Projects
  async getProjects(query?: string, page = 1, size = 100) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    params.append('page', page.toString());
    params.append('size', size.toString());

    return this.request<any>(`/projects?${params}`);
  }

  async getProject(slug: string) {
    return this.request<any>(`/projects/${slug}`);
  }

  async createProject(data: any) {
    return this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteProject(slug: string, purgeVolumes = false) {
    return this.request<any>(`/projects/${slug}?purgeVolumes=${purgeVolumes}`, {
      method: 'DELETE'
    });
  }

  // Project lifecycle
  async startProject(slug: string) {
    return this.request<any>(`/projects/${slug}/start`, {
      method: 'POST'
    });
  }

  async stopProject(slug: string) {
    return this.request<any>(`/projects/${slug}/stop`, {
      method: 'POST'
    });
  }

  async rebuildProject(slug: string) {
    return this.request<any>(`/projects/${slug}/rebuild`, {
      method: 'POST'
    });
  }

  async reallocatePorts(slug: string) {
    return this.request<any>(`/projects/${slug}/reallocate-ports`, {
      method: 'POST'
    });
  }

  // Shortcuts
  async openTerminal(slug: string, command?: string) {
    return this.request<any>(`/projects/${slug}/open/terminal`, {
      method: 'POST',
      body: JSON.stringify(command ? { command } : {})
    });
  }

  async openFolder(slug: string) {
    return this.request<any>(`/projects/${slug}/open/folder`, {
      method: 'POST'
    });
  }

  async openEditor(slug: string) {
    return this.request<any>(`/projects/${slug}/open/editor`, {
      method: 'POST'
    });
  }

  // CLI Tools
  async installClaude(slug: string, reinstall = false) {
    return this.request<any>(`/projects/${slug}/install/claude`, {
      method: 'POST',
      body: JSON.stringify({ reinstall })
    });
  }

  async installGemini(slug: string, reinstall = false) {
    return this.request<any>(`/projects/${slug}/install/gemini`, {
      method: 'POST',
      body: JSON.stringify({ reinstall })
    });
  }

  async checkCliVersions(slug: string) {
    return this.request<any>(`/projects/${slug}/check-cli-versions`);
  }

  async updateClaude(slug: string) {
    return this.request<any>(`/projects/${slug}/update/claude`, {
      method: 'POST'
    });
  }

  async updateGemini(slug: string) {
    return this.request<any>(`/projects/${slug}/update/gemini`, {
      method: 'POST'
    });
  }

  async installQwen(slug: string, reinstall = false) {
    return this.request<any>(`/projects/${slug}/install/qwen`, {
      method: 'POST',
      body: JSON.stringify({ reinstall })
    });
  }

  async updateQwen(slug: string) {
    return this.request<any>(`/projects/${slug}/update/qwen`, {
      method: 'POST'
    });
  }

  // WordPress MCP
  wordPressMcp = {
    installPlugin: async (projectSlug: string) => {
      return this.request<any>('/wordpress-mcp/install', {
        method: 'POST',
        body: JSON.stringify({ projectSlug })
      });
    },
    
    configureClaude: async (projectSlug: string, jwtToken: string, siteUrl?: string) => {
      return this.request<any>('/wordpress-mcp/configure', {
        method: 'POST',
        body: JSON.stringify({ projectSlug, jwtToken, siteUrl })
      });
    },
    
    remove: async (projectSlug: string) => {
      return this.request<any>(`/wordpress-mcp/${projectSlug}`, {
        method: 'DELETE'
      });
    }
  };

  // URLs
  async resolveUrls(slug: string) {
    return this.request<any>(`/projects/${slug}/resolve-urls`, {
      method: 'POST'
    });
  }

  // Settings
  async getSettings() {
    return this.request<any>('/settings');
  }

  async updateSettings(settings: any) {
    return this.request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Logs (SSE)
  async streamLogs(slug: string, service?: string): Promise<EventSource> {
    const params = new URLSearchParams();
    if (service) params.append('service', service);
    params.append('follow', 'true');

    const url = `${API_BASE_URL}/projects/${slug}/logs?${params}`;
    const eventSource = new EventSource(url);
    
    return eventSource;
  }

  // Tests
  async runSmokeTest(slug: string) {
    return this.request<any>(`/projects/${slug}/tests/smoke`, {
      method: 'POST'
    });
  }

  async getTestStatus(taskId: string) {
    return this.request<any>(`/tests/${taskId}`);
  }

  // Ports
  async allocatePorts(template: string, slug: string) {
    return this.request<any>('/ports/allocate', {
      method: 'POST',
      body: JSON.stringify({ template, slug })
    });
  }

  async checkPort(port: number) {
    return this.request<any>(`/ports/check/${port}`);
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export the client instance for direct use
export { apiClient };

// Export convenient functions
export const fetchProjects = async () => {
  const response = await apiClient.getProjects();
  return response.projects || response.items || [];
};

export const fetchProject = (slug: string) => apiClient.getProject(slug);
export const createProject = (data: any) => {
  // Get settings for project paths
  const settings = JSON.parse(localStorage.getItem('dev-launcher-settings') || '{}');
  const rootPath = data.location === 'wsl' 
    ? settings.projectsRootWSL || '/home/jfranjic/dev-projects'
    : settings.projectsRootWindows || 'C:\\Users\\jfran\\Documents\\dev-projects';
  
  // Construct full paths
  const projectPath = `${rootPath}/${data.slug}`;
  
  // Transform data to match backend expectations
  const requestData = {
    ...data,
    paths: data.location === 'wsl' ? {
      host: projectPath.replace(/\\/g, '/'),  // WSL path like /home/jfranjic/dev-projects/slug
      wsl: projectPath.replace(/\\/g, '/'),   // Same as host for WSL
      windows: `\\\\wsl$\\Ubuntu${projectPath.replace(/\\/g, '/')}`, // UNC path for Windows access
      unc: `\\\\wsl$\\Ubuntu${projectPath.replace(/\\/g, '/')}`, // Same as windows
      container: `/workspace`,
      relative: data.slug
    } : {
      host: projectPath.replace(/\//g, '\\'),  // Windows path
      container: `/workspace`,
      relative: data.slug
    }
  };
  
  return apiClient.createProject(requestData);
};
export const deleteProject = (slug: string, purgeVolumes?: boolean) => 
  apiClient.deleteProject(slug, purgeVolumes);

export const startProject = (slug: string) => apiClient.startProject(slug);
export const stopProject = (slug: string) => apiClient.stopProject(slug);
export const rebuildProject = (slug: string) => apiClient.rebuildProject(slug);
export const reallocatePorts = (slug: string) => apiClient.reallocatePorts(slug);

export const openTerminal = (slug: string, command?: string) => apiClient.openTerminal(slug, command);
export const openFolder = (slug: string) => apiClient.openFolder(slug);
export const openEditor = (slug: string) => apiClient.openEditor(slug);

export const installClaude = (slug: string, reinstall?: boolean) => apiClient.installClaude(slug, reinstall);
export const installGemini = (slug: string, reinstall?: boolean) => apiClient.installGemini(slug, reinstall);
export const installQwen = (slug: string, reinstall?: boolean) => apiClient.installQwen(slug, reinstall);
export const checkCliVersions = (slug: string) => apiClient.checkCliVersions(slug);
export const updateClaude = (slug: string) => apiClient.updateClaude(slug);
export const updateGemini = (slug: string) => apiClient.updateGemini(slug);
export const updateQwen = (slug: string) => apiClient.updateQwen(slug);

export const resolveUrls = (slug: string) => apiClient.resolveUrls(slug);

export const getSettings = () => apiClient.getSettings();
export const updateSettings = (settings: any) => apiClient.updateSettings(settings);

export const streamLogs = (slug: string, service?: string) => 
  apiClient.streamLogs(slug, service);

export const runSmokeTest = (slug: string) => apiClient.runSmokeTest(slug);
export const getTestStatus = (taskId: string) => apiClient.getTestStatus(taskId);

export const allocatePorts = (template: string, slug: string) => 
  apiClient.allocatePorts(template, slug);
export const checkPort = (port: number) => apiClient.checkPort(port);

export default apiClient;