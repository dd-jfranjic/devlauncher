import Docker from 'dockerode';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createLogger } from '../utils/logger';
import { HttpError } from '../middleware/error-handler';
import { ProjectLocation, ProjectLocationValues } from '../domain/types';

const logger = createLogger('docker');

export interface DockerComposeOptions {
  projectPath: string;
  projectName: string;
  location: ProjectLocation;
  env?: Record<string, string>;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: Array<{
    internal: number;
    external: number;
    protocol: string;
  }>;
  created: Date;
}

export interface DockerServiceStatus {
  isRunning: boolean;
  containers: ContainerInfo[];
  networks: string[];
  volumes: string[];
}

export class DockerService {
  private docker: Docker;

  constructor() {
    // Initialize Docker client
    this.docker = new Docker({
      socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock'
    });
  }

  async validateDockerAvailability(): Promise<void> {
    try {
      await this.docker.ping();
      logger.info('Docker daemon is available');
    } catch (error) {
      logger.error('Docker daemon is not available:', error);
      throw new HttpError(
        503,
        'DockerUnavailable',
        'Docker daemon is not running or not accessible'
      );
    }
  }

  async composeUp(options: DockerComposeOptions): Promise<void> {
    logger.info('Starting Docker Compose project', { 
      projectName: options.projectName,
      location: options.location 
    });

    try {
      await this.executeCompose(['up', '-d'], options);
      logger.info('Docker Compose project started successfully', { 
        projectName: options.projectName 
      });
    } catch (error) {
      logger.error('Failed to start Docker Compose project:', error);
      throw new HttpError(
        500,
        'DockerComposeError',
        'Failed to start Docker containers',
        { projectName: options.projectName, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  async composeDown(options: DockerComposeOptions): Promise<void> {
    logger.info('Stopping Docker Compose project', { 
      projectName: options.projectName,
      location: options.location 
    });

    try {
      await this.executeCompose(['down'], options);
      logger.info('Docker Compose project stopped successfully', { 
        projectName: options.projectName 
      });
    } catch (error) {
      logger.error('Failed to stop Docker Compose project:', error);
      throw new HttpError(
        500,
        'DockerComposeError',
        'Failed to stop Docker containers',
        { projectName: options.projectName, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  async composeRestart(options: DockerComposeOptions): Promise<void> {
    logger.info('Restarting Docker Compose project', { 
      projectName: options.projectName,
      location: options.location 
    });

    try {
      await this.executeCompose(['restart'], options);
      logger.info('Docker Compose project restarted successfully', { 
        projectName: options.projectName 
      });
    } catch (error) {
      logger.error('Failed to restart Docker Compose project:', error);
      throw new HttpError(
        500,
        'DockerComposeError',
        'Failed to restart Docker containers',
        { projectName: options.projectName, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  async getProjectStatus(options: DockerComposeOptions): Promise<DockerServiceStatus> {
    try {
      const containers = await this.getProjectContainers(options.projectName);
      const networks = await this.getProjectNetworks(options.projectName);
      const volumes = await this.getProjectVolumes(options.projectName);

      const isRunning = containers.some(container => 
        container.status.toLowerCase().includes('up') || 
        container.status.toLowerCase().includes('running')
      );

      return {
        isRunning,
        containers,
        networks,
        volumes
      };
    } catch (error) {
      logger.error('Failed to get project status:', error);
      return {
        isRunning: false,
        containers: [],
        networks: [],
        volumes: []
      };
    }
  }

  async getLogs(
    options: DockerComposeOptions, 
    service?: string, 
    tail: number = 100
  ): Promise<string> {
    try {
      const args = ['logs', '--tail', tail.toString()];
      if (service) {
        args.push(service);
      }

      const output = await this.executeCompose(args, options);
      return output;
    } catch (error) {
      logger.error('Failed to get Docker logs:', error);
      throw new HttpError(
        500,
        'DockerLogsError',
        'Failed to retrieve container logs',
        { projectName: options.projectName, service, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  async executeCommand(
    options: DockerComposeOptions,
    service: string,
    command: string[]
  ): Promise<string> {
    try {
      const args = ['exec', '-T', service, ...command];
      const output = await this.executeCompose(args, options);
      return output;
    } catch (error) {
      logger.error('Failed to execute command in container:', error);
      throw new HttpError(
        500,
        'DockerExecError',
        'Failed to execute command in container',
        { projectName: options.projectName, service, command, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async executeCompose(
    args: string[], 
    options: DockerComposeOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check for location-specific compose files first
      let composeFileName = 'docker-compose.yml';
      if (options.location === ProjectLocationValues.WSL) {
        composeFileName = 'docker-compose.wsl.yml';
      } else if (options.location === ProjectLocationValues.WINDOWS) {
        composeFileName = 'docker-compose.windows.yml';
      }
      
      // For WSL, we need to use WSL path, not Windows path
      let composeFile: string;
      if (options.location === ProjectLocationValues.WSL) {
        // WSL paths are already in Unix format
        composeFile = `${options.projectPath}/${composeFileName}`;
      } else {
        composeFile = path.join(options.projectPath, composeFileName);
        
        // Check if file exists (only for Windows paths)
        if (!fs.existsSync(composeFile)) {
          composeFile = path.join(options.projectPath, 'docker-compose.yml');
        }
      }
      
      let fullArgs = [
        'compose',
        '-f', composeFile,
        '-p', options.projectName,
        ...args
      ];

      let command: string;
      let execOptions: any = {
        env: { ...(global as any).process.env, ...options.env }
      };

      // Handle WSL vs Windows execution
      if (options.location === ProjectLocationValues.WSL) {
        command = 'wsl.exe';
        // For WSL, we need to change to the project directory first
        const dockerCommand = `cd ${options.projectPath} && docker ${fullArgs.join(' ')}`;
        fullArgs = ['-d', 'Ubuntu', '-u', 'jfranjic', 'bash', '-c', dockerCommand];
      } else {
        command = 'docker';
        execOptions.cwd = options.projectPath; // Only set cwd for Windows
      }

      logger.debug('Executing Docker command:', { command, args: fullArgs });

      const childProc = spawn(command, fullArgs, execOptions);
      
      let stdout = '';
      let stderr = '';

      childProc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      childProc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      childProc.on('close', (code: number) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Docker command failed with code ${code}: ${stderr}`));
        }
      });

      childProc.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  private async getProjectContainers(projectName: string): Promise<ContainerInfo[]> {
    try {
      // For WSL projects, use WSL docker command directly
      if (process.env.WSL_DISTRO || projectName.includes('wsl')) {
        return await this.getProjectContainersViaWSL(projectName);
      }
      
      const containers = await this.docker.listContainers({ all: true });
      
      return containers
        .filter(container => 
          container.Labels?.['com.docker.compose.project'] === projectName
        )
        .map(container => ({
          id: container.Id,
          name: container.Names[0]?.replace('/', '') || '',
          image: container.Image,
          status: container.Status,
          ports: container.Ports.map(port => ({
            internal: port.PrivatePort,
            external: port.PublicPort || 0,
            protocol: port.Type
          })),
          created: new Date(container.Created * 1000)
        }));
    } catch (error) {
      logger.warn('Failed to get project containers:', error);
      return [];
    }
  }

  private async getProjectContainersViaWSL(projectName: string): Promise<ContainerInfo[]> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Get containers for this project using WSL docker
      const { stdout } = await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "docker ps -a --filter label=com.docker.compose.project=${projectName} --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.CreatedAt}}'"`);
      
      if (!stdout.trim()) {
        logger.warn(`No containers found for project: ${projectName}`);
        return [];
      }
      
      const containers: ContainerInfo[] = [];
      const lines = stdout.trim().split('\n');
      
      for (const line of lines) {
        const [id, name, image, status, ports, createdAt] = line.split('|');
        
        // Parse ports (format like "0.0.0.0:11509->5432/tcp")
        const parsedPorts: Array<{internal: number; external: number; protocol: string}> = [];
        if (ports) {
          const portMatches = ports.match(/(\d+\.\d+\.\d+\.\d+):(\d+)->(\d+)\/(\w+)/g);
          if (portMatches) {
            for (const match of portMatches) {
              const portMatch = match.match(/(\d+\.\d+\.\d+\.\d+):(\d+)->(\d+)\/(\w+)/);
              if (portMatch) {
                parsedPorts.push({
                  internal: parseInt(portMatch[3]),
                  external: parseInt(portMatch[2]),
                  protocol: portMatch[4]
                });
              }
            }
          }
        }
        
        containers.push({
          id: id.trim(),
          name: name.trim(),
          image: image.trim(),
          status: status.trim(),
          ports: parsedPorts,
          created: new Date(createdAt.trim())
        });
      }
      
      logger.info(`Found ${containers.length} containers for project ${projectName} via WSL`);
      return containers;
    } catch (error) {
      logger.error('Failed to get project containers via WSL:', error);
      return [];
    }
  }

  private async getProjectNetworks(projectName: string): Promise<string[]> {
    try {
      const networks = await this.docker.listNetworks();
      
      return networks
        .filter(network => 
          network.Labels?.['com.docker.compose.project'] === projectName
        )
        .map(network => network.Name);
    } catch (error) {
      logger.warn('Failed to get project networks:', error);
      return [];
    }
  }

  private async getProjectVolumes(projectName: string): Promise<string[]> {
    try {
      const volumes = await this.docker.listVolumes();
      
      return volumes.Volumes
        .filter(volume => 
          volume.Labels?.['com.docker.compose.project'] === projectName
        )
        .map(volume => volume.Name);
    } catch (error) {
      logger.warn('Failed to get project volumes:', error);
      return [];
    }
  }

  async buildProject(options: DockerComposeOptions): Promise<void> {
    logger.info('Building Docker Compose project', { 
      projectName: options.projectName 
    });

    try {
      await this.executeCompose(['build', '--no-cache'], options);
      logger.info('Docker Compose project built successfully', { 
        projectName: options.projectName 
      });
    } catch (error) {
      logger.error('Failed to build Docker Compose project:', error);
      throw new HttpError(
        500,
        'DockerBuildError',
        'Failed to build Docker containers',
        { projectName: options.projectName, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  async pullImages(options: DockerComposeOptions): Promise<void> {
    logger.info('Pulling Docker images for project', { 
      projectName: options.projectName 
    });

    try {
      await this.executeCompose(['pull'], options);
      logger.info('Docker images pulled successfully', { 
        projectName: options.projectName 
      });
    } catch (error) {
      logger.error('Failed to pull Docker images:', error);
      throw new HttpError(
        500,
        'DockerPullError',
        'Failed to pull Docker images',
        { projectName: options.projectName, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}