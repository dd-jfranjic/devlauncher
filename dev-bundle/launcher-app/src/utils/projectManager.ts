import { Project } from '../types'

export class ProjectManager {
  // Note: File operations will be handled through Electron IPC
  static async createProject(project: Project): Promise<void> {
    // Create project directory
    await window.electronAPI.runCommand('mkdir', ['-p', project.path])

    // Copy template files based on project type
    // Template copying will be handled server-side
    // await this.copyTemplate(templatePath, project.path)

    // Copy PRPs template if enabled
    if (project.prpsEnabled && project.prpsTemplate) {
      // PRPs template copying will be handled server-side
      // await this.copyTemplate(prpsTemplatePath, project.path)
    }

    // Generate .env file
    await this.generateEnvFile(project)

    // Create docker-compose.override.yml if needed
    if (project.type === 'wordpress') {
      await this.createDockerComposeOverride(project)
    }

    // Initialize git repository
    await window.electronAPI.runCommand('git', ['init'], project.path)

    // Register MCP servers if enabled
    if (project.mcpEnabled) {
      await this.registerMCPServers(project)
    }
  }

  static async copyTemplate(src: string, dest: string): Promise<void> {
    const entries = await fs.readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true })
        await this.copyTemplate(srcPath, destPath)
      } else {
        let content = await fs.readFile(srcPath, 'utf8')
        
        // Replace template variables
        content = content
          .replace(/{{PROJECT_NAME}}/g, path.basename(dest))
          .replace(/{{PROJECT_TYPE}}/g, 'wordpress') // or from project
          .replace(/{{CREATED_DATE}}/g, new Date().toISOString())

        await fs.writeFile(destPath, content)
      }
    }
  }

  static async generateEnvFile(project: Project): Promise<void> {
    const envPath = path.join(project.path, '.env')
    const templatePath = path.join(__dirname, '../../../templates', project.type, '.env.template')

    try {
      let envContent = await fs.readFile(templatePath, 'utf8')
      envContent = envContent.replace(/{{PROJECT_NAME}}/g, project.name)
      
      // Generate random ports to avoid conflicts
      const basePort = 8000 + Math.floor(Math.random() * 1000)
      envContent = envContent.replace('8080', String(basePort))
      envContent = envContent.replace('3307', String(basePort + 1))
      envContent = envContent.replace('8082', String(basePort + 2))

      await fs.writeFile(envPath, envContent)
    } catch (error) {
      console.error('Failed to generate .env file:', error)
    }
  }

  static async createDockerComposeOverride(project: Project): Promise<void> {
    const overridePath = path.join(project.path, 'docker-compose.override.yml')
    const content = `version: '3.9'

services:
  wordpress:
    volumes:
      - ./themes:/var/www/html/wp-content/themes
      - ./plugins:/var/www/html/wp-content/plugins
      - ./uploads:/var/www/html/wp-content/uploads
`
    await fs.writeFile(overridePath, content)
  }

  static async registerMCPServers(project: Project): Promise<void> {
    // Register project-specific MCP servers
    const servers = [
      {
        id: `${project.name}-filesystem`,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', project.path]
      }
    ]

    for (const server of servers) {
      await window.electronAPI.runCommand(
        'npx',
        ['@anthropic-ai/claude-code', 'mcp', 'add', server.id, ...server.args],
        project.path
      )
    }
  }
}