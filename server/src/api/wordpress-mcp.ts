import { Request, Response } from 'express';
import { wordPressMcpInstaller } from '../utils/wordpress-mcp-installer';
import { createLogger } from '../utils/logger';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const logger = createLogger('api:wordpress-mcp');
const prisma = new PrismaClient();

// Validation schemas
const InstallPluginSchema = z.object({
  projectSlug: z.string().min(1)
});

const ConfigureClaudeSchema = z.object({
  projectSlug: z.string().min(1),
  jwtToken: z.string().min(1),
  siteUrl: z.string().url().optional()
});

/**
 * Install WordPress MCP plugin
 */
export async function installWordPressMcpPlugin(req: Request, res: Response) {
  try {
    console.log('WordPress MCP install request:', req.body);
    const { projectSlug } = InstallPluginSchema.parse(req.body);
    
    // Get project details
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug }
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if project is WordPress
    if (project.type !== 'wordpress') {
      return res.status(400).json({ error: 'Project is not a WordPress project' });
    }
    
    // Check if project is running
    if (project.status !== 'running') {
      return res.status(400).json({ error: 'Project must be running to install plugin' });
    }
    
    const isWSL = project.location === 'wsl';
    const paths = typeof project.paths === 'string' ? JSON.parse(project.paths) : project.paths;
    const projectPath = paths?.host || paths?.wsl || paths?.windows;
    
    if (!projectPath) {
      throw new Error('Project path not found');
    }
    
    const result = await wordPressMcpInstaller.installPlugin(projectPath, isWSL);
    
    if (result.success) {
      logger.info(`WordPress MCP plugin installed for ${projectSlug}`);
      res.json({ 
        success: true, 
        message: result.message,
        nextStep: 'Please activate the plugin in WordPress admin and generate a JWT token'
      });
    } else {
      res.status(500).json({ error: result.message });
    }
    
  } catch (error) {
    logger.error('Failed to install WordPress MCP plugin:', error);
    console.error('WordPress MCP installation error:', error); // For debugging
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to install plugin',
        details: error instanceof Error ? error.stack : undefined
      });
    }
  }
}

/**
 * Configure Claude CLI with WordPress MCP
 */
export async function configureWordPressMcp(req: Request, res: Response) {
  try {
    const { projectSlug, jwtToken, siteUrl } = ConfigureClaudeSchema.parse(req.body);
    
    // Get project details
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug }
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Determine site URL if not provided
    const ports = project.ports as any;
    const httpPort = ports?.http || ports?.HTTP || 8080;
    const finalSiteUrl = siteUrl || `http://localhost:${httpPort}/`;
    
    const isWSL = project.location === 'wsl';
    const result = await wordPressMcpInstaller.configureClaude(
      finalSiteUrl,
      jwtToken,
      projectSlug,
      isWSL
    );
    
    if (result.success) {
      logger.info(`Claude CLI configured with WordPress MCP for ${projectSlug}`);
      res.json({ 
        success: true, 
        message: result.message,
        command: result.command,
        note: 'WordPress MCP is now configured. You can use Claude to interact with your WordPress site.'
      });
    } else {
      res.status(500).json({ error: result.message });
    }
    
  } catch (error) {
    logger.error('Failed to configure WordPress MCP:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to configure' 
      });
    }
  }
}

/**
 * Remove WordPress MCP configuration
 */
export async function removeWordPressMcp(req: Request, res: Response) {
  try {
    const { projectSlug } = z.object({ projectSlug: z.string() }).parse(req.params);
    
    // Get project details
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug }
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const isWSL = project.location === 'wsl';
    const result = await wordPressMcpInstaller.removeClaude(projectSlug, isWSL);
    
    if (result.success) {
      logger.info(`WordPress MCP removed for ${projectSlug}`);
      res.json({ 
        success: true, 
        message: result.message
      });
    } else {
      res.status(500).json({ error: result.message });
    }
    
  } catch (error) {
    logger.error('Failed to remove WordPress MCP:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to remove' 
      });
    }
  }
}