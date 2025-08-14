import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { createLogger } from './logger';

const execAsync = promisify(exec);
const logger = createLogger('mcp-installer');

export interface McpServerConfig {
  id: string;
  name: string;
  installCommand: string;
  configTemplate: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  };
}

export class McpInstaller {
  /**
   * Install MCP server for WSL project
   */
  static async installForWSL(server: McpServerConfig, projectPath: string): Promise<void> {
    logger.info(`Installing ${server.id} for WSL project at ${projectPath}`);
    
    // For npm-based MCP servers that use npx, we don't need to install anything
    // npx will download and run the package on demand
    if (server.configTemplate?.command === 'npx') {
      logger.info(`${server.id} uses npx - no installation needed, will run on demand`);
      // Just configure Claude CLI to use npx command
      await this.configureClaudeForWSL(server, projectPath);
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
    await this.configureClaudeForWSL(server, projectPath);
  }
  
  /**
   * Configure Claude CLI to use the MCP server
   */
  static async configureClaudeForWSL(server: McpServerConfig, projectPath: string): Promise<void> {
    logger.info(`Configuring Claude CLI for ${server.id}`);
    
    // Read existing Claude config or create new one
    const configPath = '~/.config/claude/config.json';
    const readCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "cat ${configPath} 2>/dev/null || echo '{}'"`; 
    
    let config: any = {};
    try {
      const { stdout } = await execAsync(readCommand);
      if (stdout && stdout.trim() !== '') {
        config = JSON.parse(stdout);
      }
    } catch (error) {
      logger.warn('No existing Claude config found, creating new one');
    }
    
    // Add or update MCP server configuration
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    
    // For Python-based tools installed with pip3 --user, adjust the command path
    let configTemplate = { ...server.configTemplate };
    if (server.installCommand.includes('pip install')) {
      // Python tools installed with --user go to ~/.local/bin
      // But we'll just use the command name since it's in PATH after login shell
      // Keep the command as-is since bash -l will have the right PATH
    }
    
    // Use a simplified server ID without the -mcp suffix for Claude
    const serverId = server.id.replace('-mcp', '');
    config.mcpServers[serverId] = configTemplate;
    
    // Write updated config back
    const configJson = JSON.stringify(config, null, 2);  // Pretty print for readability
    // Use base64 encoding to avoid shell escaping issues
    const base64Config = Buffer.from(configJson).toString('base64');
    const writeCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "mkdir -p ~/.config/claude && echo '${base64Config}' | base64 -d > ${configPath}"`;
    
    try {
      await execAsync(writeCommand);
      logger.info(`Claude CLI configured for ${server.id}`);
      
      // Verify the config was written correctly
      const verifyCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "cat ${configPath}"`;
      const { stdout } = await execAsync(verifyCommand);
      logger.info(`Verified config: ${stdout}`);
    } catch (error: any) {
      logger.error(`Failed to configure Claude CLI:`, error);
      throw new Error(`Configuration failed: ${error.message}`);
    }
  }
  
  /**
   * Test MCP server connection
   */
  static async testMcpServer(serverId: string, projectPath: string): Promise<boolean> {
    logger.info(`Testing MCP server ${serverId}`);
    
    const testCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd ${projectPath} && claude mcp test ${serverId}"`;
    
    try {
      const { stdout } = await execAsync(testCommand, { timeout: 10000 });
      logger.info(`Test output: ${stdout}`);
      return true;
    } catch (error) {
      logger.error(`MCP server test failed:`, error);
      return false;
    }
  }
  
  /**
   * List installed MCP servers
   */
  static async listMcpServers(projectPath: string): Promise<string[]> {
    const listCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd ${projectPath} && claude mcp list"`;
    
    try {
      const { stdout } = await execAsync(listCommand);
      const lines = stdout.trim().split('\n');
      return lines.map(line => line.split(':')[0].trim());
    } catch (error) {
      logger.error(`Failed to list MCP servers:`, error);
      return [];
    }
  }
  
  /**
   * Remove MCP server from Claude config
   */
  static async removeMcpServer(serverId: string): Promise<void> {
    logger.info(`Removing MCP server ${serverId} from Claude config`);
    
    // Read existing Claude config
    const configPath = '~/.config/claude/config.json';
    const readCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "cat ${configPath} 2>/dev/null || echo '{}'"`; 
    
    let config: any = {};
    try {
      const { stdout } = await execAsync(readCommand);
      if (stdout && stdout.trim() !== '') {
        config = JSON.parse(stdout);
      }
    } catch (error) {
      logger.warn('No existing Claude config found');
      return;
    }
    
    // Remove MCP server
    if (config.mcpServers && config.mcpServers[serverId]) {
      delete config.mcpServers[serverId];
      
      // Write updated config back
      const configJson = JSON.stringify(config, null, 2);
      const base64Config = Buffer.from(configJson).toString('base64');
      const writeCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "echo '${base64Config}' | base64 -d > ${configPath}"`;
      
      try {
        await execAsync(writeCommand);
        logger.info(`Removed ${serverId} from Claude config`);
      } catch (error: any) {
        logger.error(`Failed to update Claude config:`, error);
        throw new Error(`Configuration update failed: ${error.message}`);
      }
    }
  }
}