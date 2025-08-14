import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');

export class DatabaseService {
  constructor(private prisma: PrismaClient) {}

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Database connection established');
      
      // Run any pending migrations if needed
      await this.ensureSchema();
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async ensureSchema(): Promise<void> {
    try {
      // Check if tables exist by trying a simple query
      await this.prisma.project.findFirst();
      logger.info('Database schema is ready');
    } catch (error) {
      logger.warn('Database schema might not be initialized. Please run: npx prisma migrate dev');
      // Don't throw here as this is just a warning
    }
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}