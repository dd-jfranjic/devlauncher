import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { spawn } from 'child_process';
import { validateBody } from '../middleware/validation';
import { createLogger } from '../utils/logger';
import { HttpError } from '../middleware/error-handler';

const logger = createLogger('system-api');

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
      
      exec(fullCommand, { shell: true }, (error: any) => {
        if (error) {
          logger.warn('Command execution warning:', error);
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