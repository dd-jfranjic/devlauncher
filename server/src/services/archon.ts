import { PrismaClient } from '@prisma/client';
import Docker from 'dockerode';
import pino from 'pino';
import path from 'path';
import fs from 'fs/promises';

const logger = pino({ name: 'ArchonService' });

export interface ArchonPorts {
  ui: number;
  server: number;
  mcp: number;
  agents: number;
}

export interface ArchonConfig {
  supabaseUrl: string;
  supabaseKey: string;
  openaiKey: string;
  geminiKey?: string;
}

export interface SystemServiceData {
  id: string;
  name: string;
  type: string;
  status: string;
  ports: ArchonPorts;
  config: ArchonConfig;
  version?: string;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ArchonService {
  private docker: Docker;
  private globalPorts: ArchonPorts = {
    ui: 4000,
    server: 4001,
    mcp: 4002,
    agents: 4003
  };

  constructor(private prisma: PrismaClient) {
    this.docker = new Docker();
  }

  /**
   * Get global Archon service status
   */
  async getGlobalStatus(): Promise<SystemServiceData | null> {
    try {
      const service = await this.prisma.systemService.findUnique({
        where: { name: 'archon-global' }
      });

      if (!service) {
        return null;
      }

      return {
        id: service.id,
        name: service.name,
        type: service.type,
        status: service.status,
        ports: JSON.parse(service.ports) as ArchonPorts,
        config: JSON.parse(service.config) as ArchonConfig,
        version: service.version || undefined,
        lastError: service.lastError || undefined,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get global Archon status');
      throw error;
    }
  }

  /**
   * Initialize global Archon service entry
   */
  async initializeGlobalArchon(config: ArchonConfig): Promise<SystemServiceData> {
    try {
      const service = await this.prisma.systemService.upsert({
        where: { name: 'archon-global' },
        create: {
          name: 'archon-global',
          type: 'archon-global',
          status: 'stopped',
          ports: JSON.stringify(this.globalPorts),
          config: JSON.stringify(config)
        },
        update: {
          config: JSON.stringify(config),
          updatedAt: new Date()
        }
      });

      return await this.getGlobalStatus() as SystemServiceData;
    } catch (error) {
      logger.error({ error }, 'Failed to initialize global Archon');
      throw error;
    }
  }

  /**
   * Start global Archon services
   */
  async startGlobalArchon(): Promise<void> {
    try {
      logger.info('Starting global Archon services...');
      
      await this.updateStatus('archon-global', 'starting', null);

      // Get current configuration from database
      const currentConfig = await this.getGlobalStatus();
      if (!currentConfig) {
        throw new Error('Global Archon not initialized. Please configure first.');
      }

      // Check if Archon source exists
      const archonPath = path.join(process.cwd(), 'archon');
      try {
        await fs.access(archonPath);
      } catch {
        throw new Error('Archon source code not found. Please run: git submodule update --init archon');
      }

      // Check if docker-compose.archon-global.yml exists
      const composePath = path.join(process.cwd(), 'docker-compose.archon-global.yml');
      try {
        await fs.access(composePath);
      } catch {
        throw new Error('Global Archon Docker configuration not found');
      }

      // Create data and logs directories
      const dataDir = path.join(process.cwd(), '.devlauncher', 'archon', 'global', 'data');
      const logsDir = path.join(process.cwd(), '.devlauncher', 'archon', 'global', 'logs');
      
      try {
        await fs.mkdir(dataDir, { recursive: true });
        await fs.mkdir(logsDir, { recursive: true });
        logger.info('Created Archon data and logs directories');
      } catch (error) {
        logger.warn('Failed to create directories:', error);
      }

      // Create .env.archon-global file with environment variables
      const envContent = [
        `GLOBAL_ARCHON_SUPABASE_URL=${currentConfig.config.supabaseUrl}`,
        `GLOBAL_ARCHON_SUPABASE_KEY=${currentConfig.config.supabaseKey}`,
        `GLOBAL_ARCHON_OPENAI_KEY=${currentConfig.config.openaiKey || ''}`,
        `GLOBAL_ARCHON_GEMINI_KEY=${currentConfig.config.geminiKey || ''}`,
        `GLOBAL_ARCHON_LOG_LEVEL=INFO`
      ].join('\n');

      const envFilePath = path.join(process.cwd(), '.env.archon-global');
      await fs.writeFile(envFilePath, envContent);
      
      logger.info('Created .env.archon-global file with configuration');
      logger.info('Environment variables:', {
        GLOBAL_ARCHON_SUPABASE_URL: currentConfig.config.supabaseUrl,
        GLOBAL_ARCHON_SUPABASE_KEY: currentConfig.config.supabaseKey ? '[SET]' : '[NOT SET]',
        GLOBAL_ARCHON_OPENAI_KEY: currentConfig.config.openaiKey ? '[SET]' : '[NOT SET]'
      });

      // Start Docker containers using docker-compose
      logger.info('Starting Docker containers with docker-compose...');
      
      const { spawn } = await import('child_process');
      
      const dockerCompose = spawn('docker', [
        'compose', 
        '-f', 'docker-compose.archon-global.yml', 
        '--env-file', '.env.archon-global',
        'up', '-d'
      ], {
        cwd: process.cwd(),
        stdio: 'pipe',
        shell: process.platform === 'win32'
      });

      let stdout = '';
      let stderr = '';

      dockerCompose.stdout?.on('data', (data) => {
        stdout += data.toString();
        logger.info('Docker compose stdout:', data.toString().trim());
      });

      dockerCompose.stderr?.on('data', (data) => {
        stderr += data.toString();
        logger.info('Docker compose stderr:', data.toString().trim());
      });

      await new Promise<void>((resolve, reject) => {
        dockerCompose.on('close', (code) => {
          if (code === 0) {
            logger.info('Docker containers started successfully');
            resolve();
          } else {
            logger.error(`Docker compose exited with code ${code}`);
            logger.error('Docker compose stdout:', stdout);
            logger.error('Docker compose stderr:', stderr);
            reject(new Error(`Docker compose failed with exit code ${code}. Check logs for details.`));
          }
        });

        dockerCompose.on('error', (error) => {
          logger.error('Docker compose spawn error:', error);
          reject(error);
        });
      });
      
      await this.updateStatus('archon-global', 'running', null);
      
      logger.info('Global Archon services started successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to start global Archon');
      await this.updateStatus('archon-global', 'error', error.message);
      throw error;
    }
  }

  /**
   * Stop global Archon services
   */
  async stopGlobalArchon(): Promise<void> {
    try {
      logger.info('Stopping global Archon services...');
      
      await this.updateStatus('archon-global', 'stopping', null);

      // Stop Docker containers using docker-compose
      logger.info('Stopping Docker containers with docker-compose...');
      
      const { spawn } = await import('child_process');
      
      const dockerCompose = spawn('docker', [
        'compose', 
        '-f', 'docker-compose.archon-global.yml', 
        '--env-file', '.env.archon-global',
        'down'
      ], {
        cwd: process.cwd(),
        stdio: 'pipe',
        shell: process.platform === 'win32'
      });

      let stdout = '';
      let stderr = '';

      dockerCompose.stdout?.on('data', (data) => {
        stdout += data.toString();
        logger.info('Docker compose stdout:', data.toString().trim());
      });

      dockerCompose.stderr?.on('data', (data) => {
        stderr += data.toString();
        logger.info('Docker compose stderr:', data.toString().trim());
      });

      await new Promise<void>((resolve, reject) => {
        dockerCompose.on('close', (code) => {
          if (code === 0) {
            logger.info('Docker containers stopped successfully');
            resolve();
          } else {
            logger.error(`Docker compose down exited with code ${code}`);
            logger.error('Docker compose stdout:', stdout);
            logger.error('Docker compose stderr:', stderr);
            reject(new Error(`Docker compose down failed with exit code ${code}. Check logs for details.`));
          }
        });

        dockerCompose.on('error', (error) => {
          logger.error('Docker compose spawn error:', error);
          reject(error);
        });
      });
      
      await this.updateStatus('archon-global', 'stopped', null);
      
      logger.info('Global Archon services stopped successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to stop global Archon');
      await this.updateStatus('archon-global', 'error', error.message);
      throw error;
    }
  }

  /**
   * Update Archon configuration
   */
  async updateGlobalConfig(config: Partial<ArchonConfig>): Promise<void> {
    try {
      const current = await this.getGlobalStatus();
      if (!current) {
        throw new Error('Global Archon not initialized');
      }

      const newConfig = { ...current.config, ...config };

      await this.prisma.systemService.update({
        where: { name: 'archon-global' },
        data: {
          config: JSON.stringify(newConfig),
          updatedAt: new Date()
        }
      });

      logger.info('Global Archon configuration updated');
    } catch (error) {
      logger.error({ error }, 'Failed to update global Archon config');
      throw error;
    }
  }

  /**
   * Check if global Archon is running
   */
  async isGlobalArchonRunning(): Promise<boolean> {
    try {
      const status = await this.getGlobalStatus();
      return status?.status === 'running';
    } catch {
      return false;
    }
  }

  /**
   * Get Archon health status by checking container health
   */
  async getHealthStatus(): Promise<{
    overall: string;
    services: Record<string, string>;
  }> {
    try {
      const services = ['server', 'mcp', 'agents', 'ui'];
      const serviceStatus: Record<string, string> = {};
      
      for (const service of services) {
        try {
          const container = this.docker.getContainer(`archon-global-${service}`);
          const info = await container.inspect();
          serviceStatus[service] = info.State.Running ? 'healthy' : 'stopped';
        } catch {
          serviceStatus[service] = 'not_found';
        }
      }

      const allHealthy = Object.values(serviceStatus).every(status => status === 'healthy');
      const overall = allHealthy ? 'healthy' : 'unhealthy';

      return { overall, services: serviceStatus };
    } catch (error) {
      logger.error({ error }, 'Failed to get Archon health status');
      return {
        overall: 'error',
        services: {}
      };
    }
  }

  /**
   * Get port allocation for project-specific Archon
   */
  async allocateProjectPorts(projectSlug: string): Promise<ArchonPorts> {
    // This will be implemented in Phase 3
    // For now, return a placeholder
    const basePort = 4100;
    const projectIndex = projectSlug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
    const startPort = basePort + (projectIndex * 10);

    return {
      ui: startPort,
      server: startPort + 1,
      mcp: startPort + 2,
      agents: startPort + 3
    };
  }

  /**
   * Update service status in database
   */
  private async updateStatus(serviceName: string, status: string, error: string | null): Promise<void> {
    try {
      await this.prisma.systemService.update({
        where: { name: serviceName },
        data: {
          status,
          lastError: error,
          updatedAt: new Date()
        }
      });
    } catch (err) {
      logger.error({ err }, `Failed to update status for ${serviceName}`);
    }
  }

  /**
   * Get logs for global Archon services
   */
  async getLogs(lines: number = 100): Promise<string[]> {
    try {
      const services = ['server', 'mcp', 'agents', 'ui'];
      const logs: string[] = [];

      for (const service of services) {
        try {
          const container = this.docker.getContainer(`archon-global-${service}`);
          const stream = await container.logs({
            stdout: true,
            stderr: true,
            tail: lines
          });
          
          logs.push(`=== ${service} ===`);
          logs.push(stream.toString());
        } catch (error) {
          logs.push(`=== ${service} ===`);
          logs.push(`Error retrieving logs: ${error.message}`);
        }
      }

      return logs;
    } catch (error) {
      logger.error({ error }, 'Failed to get Archon logs');
      return [`Error retrieving logs: ${error.message}`];
    }
  }

  /**
   * Validate Archon configuration
   */
  validateConfig(config: Partial<ArchonConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.supabaseUrl && !config.supabaseUrl.startsWith('https://')) {
      errors.push('Supabase URL must start with https://');
    }

    if (config.supabaseKey && config.supabaseKey.length < 10) {
      errors.push('Supabase key appears to be invalid (too short)');
    }

    if (config.openaiKey && !config.openaiKey.startsWith('sk-')) {
      errors.push('OpenAI API key must start with sk-');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}