import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { spawn } from 'child_process';
import { validateBody } from '../middleware/validation';
import { createLogger } from '../utils/logger';
import { HttpError } from '../middleware/error-handler';
import { ArchonService, ArchonConfig } from '../services/archon';
import { PrismaClient } from '@prisma/client';

const logger = createLogger('system-api');
const prisma = new PrismaClient();
const archonService = new ArchonService(prisma);

export const systemRouter = Router();

const executeSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional().default([])
});

// POST /system/execute - Execute system command
systemRouter.post('/execute', validateBody(executeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { command, args } = req.body;
    
    logger.info('Executing system command', { command, args });
    
    // Security check - only allow specific commands
    const allowedCommands = ['wt.exe', 'explorer.exe', 'code', 'cursor', 'cmd.exe', 'powershell.exe'];
    const baseCommand = command.split(' ')[0].toLowerCase();
    
    if (!allowedCommands.some(allowed => baseCommand.includes(allowed))) {
      throw new HttpError(403, 'ForbiddenError', 'Command not allowed');
    }
    
    // Execute command - for Windows Terminal, use different approach
    if (command.includes('wt.exe')) {
      // Use exec with start command to bring window to front
      const { exec } = require('child_process');
      const fullCommand = args.length > 0 
        ? `start "" "${command}" ${args.map((arg: any) => `"${arg}"`).join(' ')}`
        : `start "" "${command}"`;
      
      logger.info('Executing Windows Terminal command:', { fullCommand });
      
      exec(fullCommand, { shell: true }, (error: any, stdout: any, stderr: any) => {
        if (error) {
          logger.warn('Command execution warning:', { error: error.message, stdout, stderr });
        } else {
          logger.info('Command executed successfully');
        }
      });
    } else {
      // For other commands, use spawn
      const child = spawn(command, args, {
        shell: true,
        detached: true,
        stdio: 'ignore',
        windowsHide: false
      });
      
      child.unref();
    }
    
    res.json({
      data: { 
        executed: true,
        command,
        args 
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /system/platform - Get platform info
systemRouter.get('/platform', (_req: Request, res: Response) => {
  res.json({
    data: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      isDocker: process.env.DOCKER === 'true' || !!process.env.DOCKER_CONTAINER
    },
    error: null,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
});

// ========== ARCHON API ENDPOINTS ==========

const archonConfigSchema = z.object({
  supabaseUrl: z.string().url().optional(),
  supabaseKey: z.string().min(10).optional(),
  openaiKey: z.string().startsWith('sk-').optional(),
  geminiKey: z.string().optional()
});

// GET /system/archon/status - Get global Archon status
systemRouter.get('/archon/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Getting global Archon status');
    
    const status = await archonService.getGlobalStatus();
    const health = await archonService.getHealthStatus();
    const isRunning = await archonService.isGlobalArchonRunning();
    
    res.json({
      data: {
        service: status,
        health,
        isRunning
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /system/archon/init - Initialize global Archon with configuration
systemRouter.post('/archon/init', validateBody(archonConfigSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Initializing global Archon');
    
    const config = req.body as ArchonConfig;
    
    // Validate configuration
    const validation = archonService.validateConfig(config);
    if (!validation.valid) {
      throw new HttpError(400, 'ValidationError', 'Invalid Archon configuration', { errors: validation.errors });
    }
    
    const service = await archonService.initializeGlobalArchon(config);
    
    res.json({
      data: service,
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /system/archon/start - Start global Archon services
systemRouter.post('/archon/start', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Starting global Archon services');
    
    const currentStatus = await archonService.getGlobalStatus();
    if (!currentStatus) {
      throw new HttpError(400, 'ConfigurationError', 'Global Archon not initialized. Please configure first.');
    }
    
    if (currentStatus.status === 'running') {
      throw new HttpError(400, 'ServiceError', 'Global Archon is already running');
    }
    
    await archonService.startGlobalArchon();
    
    res.json({
      data: {
        message: 'Global Archon services started successfully',
        status: 'running'
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /system/archon/stop - Stop global Archon services
systemRouter.post('/archon/stop', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Stopping global Archon services');
    
    const currentStatus = await archonService.getGlobalStatus();
    if (!currentStatus) {
      throw new HttpError(404, 'NotFound', 'Global Archon not found');
    }
    
    if (currentStatus.status === 'stopped') {
      throw new HttpError(400, 'ServiceError', 'Global Archon is already stopped');
    }
    
    await archonService.stopGlobalArchon();
    
    res.json({
      data: {
        message: 'Global Archon services stopped successfully',
        status: 'stopped'
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /system/archon/config - Update global Archon configuration
systemRouter.post('/archon/config', validateBody(archonConfigSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Updating global Archon configuration');
    
    const config = req.body as Partial<ArchonConfig>;
    
    // Validate configuration
    const validation = archonService.validateConfig(config);
    if (!validation.valid) {
      throw new HttpError(400, 'ValidationError', 'Invalid Archon configuration', { errors: validation.errors });
    }
    
    await archonService.updateGlobalConfig(config);
    
    const updatedStatus = await archonService.getGlobalStatus();
    
    res.json({
      data: {
        message: 'Global Archon configuration updated successfully',
        service: updatedStatus
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /system/archon/logs - Get global Archon logs
systemRouter.get('/archon/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lines = parseInt(req.query.lines as string) || 100;
    
    logger.info(`Getting global Archon logs (${lines} lines)`);
    
    const logs = await archonService.getLogs(lines);
    
    res.json({
      data: {
        logs,
        lines: logs.length
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /system/archon/health - Get detailed Archon health status
systemRouter.get('/archon/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Getting global Archon health status');
    
    const health = await archonService.getHealthStatus();
    const status = await archonService.getGlobalStatus();
    
    res.json({
      data: {
        health,
        service: status,
        timestamp: new Date().toISOString()
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /system/archon/reset - Reset Archon status to stopped (for debugging)
systemRouter.post('/archon/reset', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Resetting global Archon status to stopped');
    
    await prisma.systemService.update({
      where: { name: 'archon-global' },
      data: {
        status: 'stopped',
        lastError: null,
        updatedAt: new Date()
      }
    });
    
    const status = await archonService.getGlobalStatus();
    
    res.json({
      data: {
        message: 'Global Archon status reset to stopped',
        service: status
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});