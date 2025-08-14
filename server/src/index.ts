import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { apiRouter } from './api';
import { DatabaseService } from './db/database-service';
import { WebSocketService } from './services/websocket-service';

const PORT = 9976;
const WS_PORT = 9977;
const HOST = '0.0.0.0'; // Listen on all interfaces in Docker

async function bootstrap(): Promise<void> {
  const logger = createLogger('server');
  
  try {
    // Initialize database connection
    const prisma = new PrismaClient();
    const databaseService = new DatabaseService(prisma);
    await databaseService.connect();
    
    // Create Express app
    const app = express();
    
    // CORS configuration - allow local connections
    app.use(cors({
      origin: ['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:3000'], // Vite dev server
      credentials: true,
      optionsSuccessStatus: 200
    }));
    
    // Middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(requestLogger());
    
    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        websocket: `ws://${HOST}:${WS_PORT}`
      });
    });
    
    // API routes
    app.use('/api', apiRouter);
    
    // Error handling
    app.use(errorHandler);
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Initialize WebSocket service
    const wsService = new WebSocketService(httpServer);
    logger.info('WebSocket service initialized');
    
    // Start server
    const server = httpServer.listen(PORT, HOST, () => {
      logger.info(`Dev Launcher API server running on http://${HOST}:${PORT}`);
      logger.info(`WebSocket server available on ws://${HOST}:${PORT}/ws`);
      logger.info('Server ready to accept connections');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      await prisma.$disconnect();
      logger.info('Database connection closed');
      
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      await prisma.$disconnect();
      logger.info('Database connection closed');
      
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
bootstrap().catch((error) => {
  console.error('Failed to bootstrap server:', error);
  process.exit(1);
});