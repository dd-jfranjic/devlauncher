export interface McpIntegration {
  id: string
  name: string
  description: string
  icon: string // icon name from Heroicons
  iconColor: string
  requiresApiKey: boolean
  installCommand: string
  configCommand?: string // For MCPs that need API key
  documentation?: string
  installed?: boolean // Track if already installed
}

// Define all available MCP integrations
export const mcpIntegrations: McpIntegration[] = [
  {
    id: 'docker-mcp-toolkit',
    name: 'Docker MCP Gateway',
    description: 'Control Docker containers, images, and compose through Claude',
    icon: 'ServerStackIcon',
    iconColor: 'text-blue-500 dark:text-blue-400',
    requiresApiKey: false,
    installCommand: 'claude mcp add --transport stdio docker-mcp-gateway docker mcp gateway run',
    documentation: 'https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/',
  },
  {
    id: 'semgrep',
    name: 'Semgrep MCP',
    description: 'Code security analysis and pattern matching',
    icon: 'ShieldCheckIcon',
    iconColor: 'text-blue-600 dark:text-blue-400',
    requiresApiKey: false, // Optional API key for advanced features
    installCommand: 'claude mcp add --transport stdio semgrep pipx run semgrep-mcp',
    documentation: 'https://github.com/semgrep/mcp',
  },
  {
    id: 'exa',
    name: 'Exa MCP',
    description: 'AI-powered web search and research',
    icon: 'MagnifyingGlassIcon',
    iconColor: 'text-purple-600 dark:text-purple-400',
    requiresApiKey: true,
    installCommand: 'claude mcp add --transport http exa', // Will be completed with URL
    configCommand: '', // Not needed - API key is in URL
    documentation: 'https://dashboard.exa.ai/api-keys',
  },
  {
    id: 'ref-tools',
    name: 'Ref Tools MCP',
    description: 'Access documentation for APIs, services, and libraries with token-efficient search',
    icon: 'BookOpenIcon',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    requiresApiKey: true,
    installCommand: 'claude mcp add --transport http ref-tools', // Will be completed with URL
    configCommand: '', // API key is in URL
    documentation: 'https://ref.tools',
  },
  {
    id: 'magic-mcp',
    name: 'Magic MCP',
    description: 'AI-powered UI component generation - create beautiful, modern components instantly',
    icon: 'SparklesIcon',
    iconColor: 'text-pink-600 dark:text-pink-400',
    requiresApiKey: true,
    installCommand: 'npx @21st-dev/cli@latest install claude --api-key', // Will be completed with API key
    configCommand: '', // API key is passed during installation
    documentation: 'https://github.com/21st-dev/magic-mcp',
  },
  {
    id: 'playwright-mcp',
    name: 'Playwright MCP',
    description: 'Browser automation and testing - control Chrome, Firefox, Safari programmatically',
    icon: 'ComputerDesktopIcon',
    iconColor: 'text-green-600 dark:text-green-400',
    requiresApiKey: false,
    installCommand: 'claude mcp add playwright npx -- @playwright/mcp@latest',
    documentation: 'https://github.com/microsoft/playwright-mcp',
  },
]

// Helper function to get icon component by name
export const getIconComponent = (iconName: string) => {
  // This will be implemented in the component
  const icons: Record<string, any> = {
    FolderIcon: 'FolderIcon',
    CodeBracketSquareIcon: 'CodeBracketSquareIcon',
    CloudIcon: 'CloudIcon',
    ServerIcon: 'ServerIcon',
    CubeIcon: 'CubeIcon',
    // Add more as needed
  }
  return icons[iconName] || 'CubeIcon'
}