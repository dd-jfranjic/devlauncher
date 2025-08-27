import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { spawn } from 'child_process';
import { validateBody } from '../middleware/validation';
import { createLogger } from '../utils/logger';
import { HttpError } from '../middleware/error-handler';
import { PrismaClient } from '@prisma/client';

const logger = createLogger('system-api');
const prisma = new PrismaClient();

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

// POST /system/jina/token - Update Jina MCP token
const jinaTokenSchema = z.object({
  token: z.string().startsWith('jina_').min(20)
});

systemRouter.post('/jina/token', validateBody(jinaTokenSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    
    logger.info('Updating Jina MCP token');
    
    // Use spawn to execute Windows command for Jina MCP token update
    const { spawn } = require('child_process');
    
    const updateCommand = `claude mcp remove jina && claude mcp add jina --env JINA_API_KEY="${token}" -- npx jina-mcp-tools`;
    
    const child = spawn('cmd.exe', [
      '/c',
      updateCommand
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        logger.info('Jina MCP token updated successfully');
        res.json({
          data: {
            message: 'Jina MCP token updated successfully',
            success: true
          },
          error: null,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } else {
        logger.error('Jina MCP token update failed', { code, stdout, stderr });
        res.status(500).json({
          data: null,
          error: 'Failed to update Jina MCP token',
          meta: {
            timestamp: new Date().toISOString(),
            details: { code, stdout, stderr }
          }
        });
      }
    });
    
  } catch (error) {
    next(error);
  }
});