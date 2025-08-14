import path from 'path';
import fs from 'fs/promises';
import { pipeline } from 'stream/promises';
import { createWriteStream, createReadStream } from 'fs';
import { Readable } from 'stream';
import unzipper from 'unzipper';
import { createLogger } from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const logger = createLogger('wordpress-mcp-installer');

export class WordPressMcpInstaller {
  private readonly GITHUB_RELEASE_URL = 'https://api.github.com/repos/Automattic/wordpress-mcp/releases/latest';
  
  /**
   * Download and install WordPress MCP plugin
   */
  async installPlugin(projectPath: string, isWSL: boolean): Promise<{ success: boolean; message: string }> {
    try {
      logger.info(`Installing WordPress MCP plugin for project at ${projectPath}`);
      
      // Step 1: Get latest release info
      const releaseInfo = await this.getLatestReleaseInfo();
      if (!releaseInfo.downloadUrl) {
        throw new Error('Could not find WordPress MCP plugin download URL');
      }
      
      // Step 2: Download plugin zip
      const tempDir = process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp';
      const tempZipPath = path.join(tempDir, `wordpress-mcp-${Date.now()}.zip`);
      await this.downloadFile(releaseInfo.downloadUrl, tempZipPath);
      
      // Step 3: Extract to WordPress plugins directory
      const pluginsPath = isWSL 
        ? `/home/jfranjic/dev-projects/${path.basename(projectPath)}/wp-content/plugins`
        : path.join(projectPath, 'wp-content', 'plugins');
      
      await this.extractPlugin(tempZipPath, pluginsPath, isWSL);
      
      // Step 4: Clean up temp file
      await fs.unlink(tempZipPath).catch(() => {});
      
      logger.info('WordPress MCP plugin installed successfully');
      return {
        success: true,
        message: 'WordPress MCP plugin installed successfully. Please activate it in WordPress admin.'
      };
      
    } catch (error) {
      logger.error('Failed to install WordPress MCP plugin:', error);
      return {
        success: false,
        message: `Failed to install plugin: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Get latest release information from GitHub
   */
  private async getLatestReleaseInfo(): Promise<{ version: string; downloadUrl: string | null }> {
    const response = await fetch(this.GITHUB_RELEASE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch release info: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    // Find wordpress-mcp.zip asset
    const zipAsset = data.assets?.find((asset: any) => 
      asset.name === 'wordpress-mcp.zip' || asset.name.endsWith('.zip')
    );
    
    return {
      version: data.tag_name || 'unknown',
      downloadUrl: zipAsset?.browser_download_url || null
    };
  }
  
  /**
   * Download file from URL
   */
  private async downloadFile(url: string, destPath: string): Promise<void> {
    logger.info(`Downloading from ${url} to ${destPath}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    
    const fileStream = createWriteStream(destPath);
    await pipeline(
      Readable.fromWeb(response.body as any),
      fileStream
    );
  }
  
  /**
   * Extract plugin to WordPress plugins directory
   */
  private async extractPlugin(zipPath: string, pluginsPath: string, isWSL: boolean): Promise<void> {
    if (isWSL) {
      // Use WSL unzip command
      const wslPluginsPath = pluginsPath;
      const wslZipPath = zipPath.replace(/\\/g, '/').replace('C:', '/mnt/c');
      
      logger.info(`Extracting plugin to WSL path: ${wslPluginsPath}`);
      
      try {
        // Create plugins directory if it doesn't exist
        logger.info('Creating plugins directory...');
        await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "mkdir -p '${wslPluginsPath}'"`, { timeout: 10000 });
        
        // Check if unzip is installed
        try {
          await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "which unzip"`, { timeout: 5000 });
        } catch {
          logger.info('Installing unzip in WSL...');
          await execAsync(`wsl.exe -d Ubuntu bash -c "sudo apt-get update && sudo apt-get install -y unzip"`, { timeout: 60000 });
        }
        
        // Copy zip to WSL and extract
        const tempWSLPath = `/tmp/wordpress-mcp-${Date.now()}.zip`;
        logger.info(`Copying zip to WSL: ${tempWSLPath}`);
        await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "cp '${wslZipPath}' '${tempWSLPath}'"`, { timeout: 10000 });
        
        logger.info('Extracting zip file...');
        // Need sudo because wp-content is owned by www-data (UID 82)
        await execAsync(`wsl.exe -d Ubuntu bash -c "cd '${wslPluginsPath}' && sudo unzip -o '${tempWSLPath}'"`, { timeout: 20000 });
        
        logger.info('Setting proper permissions...');
        // Set ownership to www-data (UID 82) to match WordPress container
        await execAsync(`wsl.exe -d Ubuntu bash -c "sudo chown -R 82:82 '${wslPluginsPath}/wordpress-mcp'"`, { timeout: 5000 });
        
        logger.info('Cleaning up temp file...');
        await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "rm '${tempWSLPath}'"`, { timeout: 5000 });
        
        logger.info('WordPress MCP plugin extracted successfully');
      } catch (error) {
        logger.error('Failed to extract plugin:', error);
        throw new Error(`Failed to extract plugin: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
    } else {
      // Use Node.js unzipper for Windows
      logger.info(`Extracting plugin to Windows path: ${pluginsPath}`);
      
      // Create plugins directory if it doesn't exist
      await fs.mkdir(pluginsPath, { recursive: true });
      
      // Extract zip
      await pipeline(
        createReadStream(zipPath),
        unzipper.Extract({ path: pluginsPath })
      );
    }
  }
  
  /**
   * Configure Claude CLI with WordPress MCP
   */
  async configureClaude(
    siteUrl: string,
    jwtToken: string,
    projectSlug: string,
    isWSL: boolean
  ): Promise<{ success: boolean; message: string; command?: string }> {
    try {
      const serverName = `wordpress-${projectSlug}`;
      
      // Build the claude mcp add command
      const envVars = `WP_API_URL="${siteUrl}" JWT_TOKEN="${jwtToken}"`;
      const addCommand = `claude mcp add -s user ${serverName} --env ${envVars} -- npx -y @automattic/mcp-wordpress-remote@latest`;
      
      if (isWSL) {
        // Execute in WSL
        const fullCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "${addCommand}"`;
        logger.info(`Configuring Claude CLI in WSL: ${addCommand}`);
        
        const result = await execAsync(fullCommand, { timeout: 30000 });
        logger.info('Claude CLI configuration result:', result);
        
        return {
          success: true,
          message: `WordPress MCP configured for ${projectSlug}`,
          command: addCommand
        };
      } else {
        // Execute in Windows
        logger.info(`Configuring Claude CLI in Windows: ${addCommand}`);
        
        const result = await execAsync(addCommand, { timeout: 30000 });
        logger.info('Claude CLI configuration result:', result);
        
        return {
          success: true,
          message: `WordPress MCP configured for ${projectSlug}`,
          command: addCommand
        };
      }
      
    } catch (error) {
      logger.error('Failed to configure Claude CLI:', error);
      return {
        success: false,
        message: `Failed to configure Claude CLI: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Remove WordPress MCP from Claude CLI
   */
  async removeClaude(projectSlug: string, isWSL: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const serverName = `wordpress-${projectSlug}`;
      const removeCommand = `claude mcp remove ${serverName} -s user`;
      
      if (isWSL) {
        await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -l -c "${removeCommand}"`);
      } else {
        await execAsync(removeCommand);
      }
      
      return {
        success: true,
        message: `WordPress MCP removed for ${projectSlug}`
      };
      
    } catch (error) {
      logger.error('Failed to remove Claude CLI configuration:', error);
      return {
        success: false,
        message: `Failed to remove configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const wordPressMcpInstaller = new WordPressMcpInstaller();