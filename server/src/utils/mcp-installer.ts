import { exec } from 'child_process';
import { promisify } from 'util';
import { createLogger } from '../utils/logger';

const execAsync = promisify(exec);
const logger = createLogger('mcp-installer');

interface McpServerConfig {
  id: string;
  name: string;
  description: string;
  repository?: string;
  type: string;
  icon: string;
  installCommand: string;
  tested: boolean;
  wslSupported: boolean;
  windowsSupported: boolean;
  requiredTools: string[];
  requiresApiToken?: boolean;
  apiTokenEnvVar?: string;
  apiTokenPlaceholder?: string;
  requiresManualSetup?: boolean;
  setupInstructions?: string[];
  notes?: string[];
  configTemplate: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  };
}

export class McpInstaller {
  /**
   * Install MCP server for WSL project
   */
  static async installForWSL(server: McpServerConfig, projectPath: string, apiToken?: string): Promise<void> {
    logger.info(`Installing ${server.id} for WSL project at ${projectPath}`);
    
    // Check if this server requires manual setup (like Chrome MCP)
    if (server.requiresManualSetup) {
      logger.info(`${server.id} requires manual setup - installing bridge component only`);
      
      // For Chrome MCP, install the bridge component
      if (server.id === 'chrome-mcp') {
        await this.installChromeMCPBridge(server, projectPath);
        return;
      } else {
        logger.warn(`Unknown manual setup server: ${server.id}`);
        throw new Error(`Manual setup required for ${server.id}. Please follow setup instructions.`);
      }
    }
    
    // For npm-based MCP servers that use npx, we don't need to install anything
    // npx will download and run the package on demand
    if (server.configTemplate?.command === 'npx') {
      logger.info(`${server.id} uses npx - no installation needed, will run on demand`);
      // Just configure Claude CLI to use npx command
      await this.configureClaudeForWSL(server, projectPath, apiToken);
      return;
    }
    
    // Determine if we need to use pip3 instead of pip for Python packages
    let installCmd = server.installCommand;
    if (installCmd.startsWith('pip install')) {
      // Use pip3 explicitly and install in user space to avoid permission issues
      installCmd = installCmd.replace('pip install', 'pip3 install --user');
    }
    
    // For other packages, run the install command
    const installCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "${installCmd}"`;
    logger.info(`Running: ${installCommand}`);
    
    try {
      const { stdout, stderr } = await execAsync(installCommand, { timeout: 120000 });
      if (stdout) logger.info(`Install output: ${stdout}`);
      if (stderr) logger.warn(`Install warnings: ${stderr}`);
    } catch (error: any) {
      logger.error(`Failed to install ${server.id}:`, error);
      throw new Error(`Installation failed: ${error.message}`);
    }
    
    // Configure Claude CLI to use this MCP server
    await this.configureClaudeForWSL(server, projectPath, apiToken);
  }
  
  /**
   * Configure Claude CLI to use the MCP server using 'claude mcp add' command
   */
  static async configureClaudeForWSL(server: McpServerConfig, projectPath: string, apiToken?: string): Promise<void> {
    logger.info(`Configuring Claude CLI for ${server.id}`);
    
    // Use claude mcp add command to register the MCP server
    const serverId = server.id.replace('-mcp', '');
    const { command, args = [] } = server.configTemplate;
    
    // Build the claude mcp add command
    // Example: claude mcp add -s user playwright npx @playwright/mcp@latest
    let addCommand = `claude mcp add -s user ${serverId}`;
    
    // Add environment variables if API token is provided
    let envFlags = '';
    if (apiToken && server.configTemplate?.env) {
      // Find the environment variable that needs the token
      const envVars = Object.entries(server.configTemplate.env);
      for (const [key, value] of envVars) {
        if (value === `\${${key}}`) {
          // Add --env flag to claude mcp add command (before the command)
          envFlags = ` --env ${key}="${apiToken}"`;
        }
      }
    }
    
    // Add env flags before the command
    if (envFlags) {
      addCommand += envFlags;
    }
    
    // Now add the command and args
    // For npx with args, we need -- separator to prevent claude from parsing the args
    if (command === 'npx' && args.length > 0) {
      addCommand += ` -- ${command} ${args.join(' ')}`;
    } else {
      addCommand += ` ${command}`;
      if (args.length > 0) {
        addCommand += ` ${args.join(' ')}`;
      }
    }
    
    const wslCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd ${projectPath} && ${addCommand}"`;
    logger.info(`Running: ${wslCommand}`);
    
    try {
      const { stdout, stderr } = await execAsync(wslCommand, { timeout: 10000 });
      if (stdout) logger.info(`Add output: ${stdout}`);
      if (stderr && !stderr.includes('Added')) logger.warn(`Add warnings: ${stderr}`);
      
      logger.info(`Claude CLI configured for ${server.id}`);
    } catch (error: any) {
      logger.error(`Failed to configure Claude CLI:`, error);
      throw new Error(`Configuration failed: ${error.message}`);
    }
  }
  
  /**
   * Test if MCP server is working
   */
  static async testMCPServer(serverId: string, projectPath: string): Promise<boolean> {
    logger.info(`Testing MCP server ${serverId}`);
    
    try {
      // Run claude mcp list to see if server is configured
      const listCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd ${projectPath} && claude mcp list"`;
      const { stdout } = await execAsync(listCommand, { timeout: 5000 });
      
      // Check if the server appears in the list
      const serverName = serverId.replace('-mcp', '');
      const isConfigured = stdout.includes(serverName);
      
      if (isConfigured) {
        logger.info(`MCP server ${serverId} is configured and appears in list`);
        return true;
      } else {
        logger.warn(`MCP server ${serverId} not found in list`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to test MCP server:`, error);
      return false;
    }
  }
  
  /**
   * Remove MCP server configuration
   */
  static async removeForWSL(serverId: string, projectPath: string): Promise<void> {
    logger.info(`Removing MCP server ${serverId}`);
    
    const serverName = serverId.replace('-mcp', '');
    
    // Use claude mcp remove command
    const removeCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd ${projectPath} && claude mcp remove ${serverName}"`;
    logger.info(`Running: ${removeCommand}`);
    
    try {
      const { stdout, stderr } = await execAsync(removeCommand, { timeout: 10000 });
      if (stdout) logger.info(`Remove output: ${stdout}`);
      if (stderr && !stderr.includes('Removed')) logger.warn(`Remove warnings: ${stderr}`);
      
      logger.info(`MCP server ${serverId} removed successfully`);
    } catch (error: any) {
      logger.error(`Failed to remove MCP server:`, error);
      throw new Error(`Removal failed: ${error.message}`);
    }
  }

  /**
   * Install Chrome MCP Bridge component
   */
  static async installChromeMCPBridge(server: McpServerConfig, projectPath: string): Promise<void> {
    logger.info(`Installing Chrome MCP Bridge for project at ${projectPath}`);
    
    try {
      // Install the npm bridge component
      const installCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "${server.installCommand}"`;
      logger.info(`Installing bridge: ${installCommand}`);
      
      const { stdout, stderr } = await execAsync(installCommand, { timeout: 120000 });
      if (stdout) logger.info(`Bridge install output: ${stdout}`);
      if (stderr) logger.warn(`Bridge install warnings: ${stderr}`);
      
      // Configure Claude CLI to use HTTP connection to localhost:12306
      logger.info(`Configuring Claude CLI for Chrome MCP Bridge`);
      const serverId = server.id.replace('-mcp', '');
      
      // Use sse transport for HTTP connection to Chrome extension
      const addCommand = `claude mcp add -s user ${serverId} --transport sse http://localhost:12306/sse`;
      const wslCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd ${projectPath} && ${addCommand}"`;
      logger.info(`Running: ${wslCommand}`);
      
      const configResult = await execAsync(wslCommand, { timeout: 10000 });
      if (configResult.stdout) logger.info(`Chrome MCP config output: ${configResult.stdout}`);
      if (configResult.stderr && !configResult.stderr.includes('Added')) {
        logger.warn(`Chrome MCP config warnings: ${configResult.stderr}`);
      }
      
      logger.info(`Chrome MCP Bridge configured successfully`);
      logger.info(`Next steps: Install Chrome extension from ${server.repository}/releases`);
      
    } catch (error: any) {
      logger.error(`Failed to install Chrome MCP Bridge:`, error);
      throw new Error(`Chrome MCP Bridge installation failed: ${error.message}`);
    }
  }
}