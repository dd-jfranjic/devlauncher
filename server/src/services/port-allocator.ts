import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { HttpError } from '../middleware/error-handler';
import net from 'net';

const logger = createLogger('port-allocator');

export interface PortAllocationRequest {
  slug: string;
  template: string;
  portName: string;
  preferredPort?: number;
}

export interface PortAllocation {
  portName: string;
  portNumber: number;
  isNew: boolean;
}

export class PortAllocatorService {
  private readonly MIN_PORT = 3000;
  private readonly MAX_PORT = 9999;
  private readonly EXCLUDED_PORTS = new Set([
    9976, // Dev Launcher API
    5173, // Vite dev server
    3000, // Common dev port
    8080, // Common web port
    8000, // Common dev port
    5432, // PostgreSQL
    3306, // MySQL
    6379, // Redis
    27017, // MongoDB
    // Fiskal-AI ports to avoid conflicts
    13264, // fiskal-ai_adminer
    2375, // fiskal-ai_docker_proxy
    11509, // fiskal-ai_postgres
    13128, // fiskal-ai_redis
    10625, // fiskal-ai_browser_context
    8888, // fiskal-ai_dozzle
    9999, // fiskal-ai_dozzle
    10393, // fiskal-ai_mailpit SMTP
    10451 // fiskal-ai_mailpit UI
  ]);

  constructor(private prisma: PrismaClient) {}

  async allocatePorts(requests: PortAllocationRequest[]): Promise<PortAllocation[]> {
    const startTime = Date.now();
    logger.info('Starting port allocation', { 
      slug: requests[0]?.slug,
      requestCount: requests.length 
    });

    try {
      const allocations: PortAllocation[] = [];

      for (const request of requests) {
        const allocation = await this.allocatePort(request);
        allocations.push(allocation);
      }

      const duration = Date.now() - startTime;
      logger.info('Port allocation completed', { 
        slug: requests[0]?.slug,
        allocations,
        duration: `${duration}ms`
      });

      return allocations;
    } catch (error) {
      logger.error('Port allocation failed:', { error, requests });
      throw error;
    }
  }

  async allocatePort(request: PortAllocationRequest): Promise<PortAllocation> {
    const { slug, template, portName, preferredPort } = request;

    // Check if port is already allocated for this project
    const existing = await this.prisma.portReservation.findFirst({
      where: {
        slug,
        template,
        portName
      }
    });

    if (existing) {
      logger.debug('Using existing port allocation', { 
        slug, 
        portName, 
        portNumber: existing.portNumber 
      });
      
      return {
        portName,
        portNumber: existing.portNumber,
        isNew: false
      };
    }

    // Try preferred port first if provided
    if (preferredPort && await this.isPortAvailable(preferredPort)) {
      const portNumber = await this.reservePort(slug, template, portName, preferredPort);
      return {
        portName,
        portNumber,
        isNew: true
      };
    }

    // Find next available port
    const portNumber = await this.findAvailablePort();
    await this.reservePort(slug, template, portName, portNumber);

    return {
      portName,
      portNumber,
      isNew: true
    };
  }

  async deallocateProjectPorts(slug: string): Promise<void> {
    logger.info('Deallocating ports for project', { slug });

    const deleted = await this.prisma.portReservation.deleteMany({
      where: { slug }
    });

    logger.info('Ports deallocated', { slug, count: deleted.count });
  }

  async isPortAvailable(port: number): Promise<boolean> {
    if (this.EXCLUDED_PORTS.has(port)) {
      return false;
    }

    // Check database reservation
    const existing = await this.prisma.portReservation.findFirst({
      where: { portNumber: port }
    });

    if (existing) {
      return false;
    }

    // Check if port is actually in use
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, '127.0.0.1', () => {
        server.close(() => {
          resolve(true);
        });
      });

      server.on('error', () => {
        resolve(false);
      });
    });
  }

  private async findAvailablePort(): Promise<number> {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const port = Math.floor(Math.random() * (this.MAX_PORT - this.MIN_PORT + 1)) + this.MIN_PORT;
      
      if (await this.isPortAvailable(port)) {
        return port;
      }

      attempts++;
    }

    throw new HttpError(
      500,
      'PortAllocationError',
      'Unable to find available port after maximum attempts',
      { attempts: maxAttempts, range: { min: this.MIN_PORT, max: this.MAX_PORT } }
    );
  }

  private async reservePort(
    slug: string, 
    template: string, 
    portName: string, 
    portNumber: number
  ): Promise<number> {
    try {
      await this.prisma.portReservation.create({
        data: {
          slug,
          template,
          portName,
          portNumber
        }
      });

      logger.debug('Port reserved', { slug, template, portName, portNumber });
      return portNumber;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        // Port was taken between check and reservation - try again with a new port
        logger.warn('Port conflict during reservation, finding new port', { portNumber });
        const newPort = await this.findAvailablePort();
        // Recursively try to reserve the new port
        return await this.reservePort(slug, template, portName, newPort);
      }
      throw error;
    }
  }

  async getPortReservations(slug?: string): Promise<any[]> {
    const reservations = await this.prisma.portReservation.findMany({
      where: slug ? { slug } : undefined,
      orderBy: { portNumber: 'asc' }
    });

    return reservations;
  }

  async validatePortRange(ports: { [key: string]: any }): Promise<void> {
    for (const [portName, config] of Object.entries(ports)) {
      const { internal, external } = config;

      if (internal < 1 || internal > 65535) {
        throw new HttpError(
          400,
          'ValidationError',
          `Invalid internal port for ${portName}: must be between 1 and 65535`,
          { portName, port: internal }
        );
      }

      if (external < 1024 || external > 65535) {
        throw new HttpError(
          400,
          'ValidationError',
          `Invalid external port for ${portName}: must be between 1024 and 65535`,
          { portName, port: external }
        );
      }

      if (this.EXCLUDED_PORTS.has(external)) {
        throw new HttpError(
          400,
          'ValidationError',
          `Port ${external} is reserved and cannot be used for ${portName}`,
          { portName, port: external }
        );
      }
    }
  }
}