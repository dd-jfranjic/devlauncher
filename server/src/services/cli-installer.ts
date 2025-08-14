import { spawn } from 'child_process';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';

const log = logger.child({ component: 'CliInstaller' });

export interface InstallOptions {
  projectSlug: string;
  projectPath: string;
  location: 'wsl' | 'windows';
  tool: 'claude' | 'gemini';
}

export interface InstallResult {
  success: boolean;
  version?: string;
  error?: string;
  logPath: string;
}

export class CliInstallerService extends EventEmitter {
  private readonly logDir = '.devlauncher/logs';
  
  async installClaude(options: InstallOptions): Promise<InstallResult> {
    return this.installTool({
      ...options,
      tool: 'claude',
      packageName: '@anthropic-ai/claude-code',
      binaryName: 'claude'
    });
  }
  
  async installGemini(options: InstallOptions): Promise<InstallResult> {
    return this.installTool({
      ...options,
      tool: 'gemini',
      packageName: '@google/gemini-cli',
      binaryName: 'gemini'
    });
  }
  
  private async installTool(
    options: InstallOptions & { packageName: string; binaryName: string }
  ): Promise<InstallResult> {
    const { projectSlug, projectPath, location, tool, packageName, binaryName } = options;
    
    log.info({ projectSlug, tool, location }, 'Installing CLI tool');
    
    // Create log file
    const logFileName = `${tool}-install-${Date.now()}.log`;
    const logPath = path.join(projectPath, this.logDir, logFileName);
    await this.ensureLogDir(path.join(projectPath, this.logDir));
    
    const logStream = await this.createLogStream(logPath);
    
    try {
      // Install the package
      await this.runInstallCommand(
        packageName,
        projectPath,
        location,
        logStream
      );
      
      // Get version
      const version = await this.getToolVersion(
        binaryName,
        projectPath,
        location
      );
      
      logStream.write(`\n✓ Installation successful\n`);
      logStream.write(`Version: ${version || 'unknown'}\n`);
      logStream.end();
      
      return {
        success: true,
        version,
        logPath
      };
    } catch (error: any) {
      logStream.write(`\n✗ Installation failed\n`);
      logStream.write(`Error: ${error.message}\n`);
      logStream.end();
      
      return {
        success: false,
        error: error.message,
        logPath
      };
    }
  }
  
  private async runInstallCommand(
    packageName: string,
    projectPath: string,
    location: 'wsl' | 'windows',
    logStream: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command: string;
      let args: string[];
      
      if (location === 'wsl') {
        // Install in WSL
        const wslPath = projectPath.replace(/\\/g, '/');
        command = 'wsl.exe';
        args = [
          '-d', 'Ubuntu',
          '--',
          'bash', '-lc',
          `cd ${wslPath} && npm install -g ${packageName}`
        ];
      } else {
        // Install in Windows
        command = 'pwsh';
        args = [
          '-NoProfile',
          '-Command',
          `Set-Location '${projectPath}'; npm install -g ${packageName}`
        ];
      }
      
      log.info({ command, args }, 'Running install command');
      
      const process = spawn(command, args, {
        cwd: location === 'windows' ? projectPath : undefined,
        shell: false
      });
      
      process.stdout.on('data', (data) => {
        const output = data.toString();
        logStream.write(output);
        this.emit('output', { type: 'stdout', data: output });
      });
      
      process.stderr.on('data', (data) => {
        const output = data.toString();
        logStream.write(output);
        this.emit('output', { type: 'stderr', data: output });
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Installation failed with code ${code}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  private async getToolVersion(
    binaryName: string,
    projectPath: string,
    location: 'wsl' | 'windows'
  ): Promise<string | undefined> {
    return new Promise((resolve) => {
      let command: string;
      let args: string[];
      
      if (location === 'wsl') {
        const wslPath = projectPath.replace(/\\/g, '/');
        command = 'wsl.exe';
        args = [
          '-d', 'Ubuntu',
          '--',
          'bash', '-lc',
          `cd ${wslPath} && ${binaryName} --version || ${binaryName} --help | head -1`
        ];
      } else {
        command = 'pwsh';
        args = [
          '-NoProfile',
          '-Command',
          `Set-Location '${projectPath}'; if (Get-Command ${binaryName} -ErrorAction SilentlyContinue) { ${binaryName} --version } else { ${binaryName} --help | Select-Object -First 1 }`
        ];
      }
      
      const process = spawn(command, args, {
        cwd: location === 'windows' ? projectPath : undefined,
        shell: false
      });
      
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', () => {
        // Extract version from output
        const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
        resolve(versionMatch ? versionMatch[1] : undefined);
      });
      
      process.on('error', () => {
        resolve(undefined);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        process.kill();
        resolve(undefined);
      }, 5000);
    });
  }
  
  private async ensureLogDir(logDir: string): Promise<void> {
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      log.warn({ error, logDir }, 'Failed to create log directory');
    }
  }
  
  private async createLogStream(logPath: string): Promise<any> {
    const { createWriteStream } = await import('fs');
    return createWriteStream(logPath, { flags: 'a' });
  }
  
  async checkInstallation(
    tool: 'claude' | 'gemini',
    projectPath: string,
    location: 'wsl' | 'windows'
  ): Promise<{ installed: boolean; version?: string }> {
    const binaryName = tool === 'claude' ? 'claude' : 'gemini';
    
    try {
      const version = await this.getToolVersion(binaryName, projectPath, location);
      return {
        installed: !!version,
        version
      };
    } catch (error) {
      return { installed: false };
    }
  }
}

export const cliInstallerService = new CliInstallerService();