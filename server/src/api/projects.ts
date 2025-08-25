import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { createLogger, auditLogger } from '../utils/logger';
import mcpRouter from './mcp';
import { HttpError } from '../middleware/error-handler';
import { 
  createProjectDtoSchema, 
  updateProjectDtoSchema, 
  projectQuerySchema,
  slugSchema 
} from '../domain/validation';
import { 
  ApiResponse,
  ProjectData,
  ProjectType,
  ProjectLocation,
  ProjectStatus,
  ProjectStatusValues,
  ProjectTypeValues
} from '../domain/types';
import { PortAllocatorService } from '../services/port-allocator';
import { DockerService } from '../services/docker-service';
import { TemplateEngine, TemplateRenderContext } from '../services/template-engine';
import path from 'path';
import fs from 'fs/promises';

const logger = createLogger('projects-api');
const prisma = new PrismaClient();
const portAllocator = new PortAllocatorService(prisma);
const dockerService = new DockerService();

// Initialize template engine
const templatesRoot = process.env.TEMPLATES_ROOT || path.join(__dirname, '..', '..', '..', 'templates');
const templateEngine = new TemplateEngine(templatesRoot, portAllocator);

export const projectRouter = Router();

// Mount MCP router for all MCP-related endpoints
projectRouter.use('/:slug/mcp', mcpRouter);

// GET /projects - List all projects
projectRouter.get('/', validateQuery(projectQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, location, status, limit = 50, offset = 0, search } = req.query as any;
    
    const where: any = {};
    if (type) where.type = type;
    if (location) where.location = location;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { updatedAt: 'desc' },
        include: {
          tasks: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          ports_reserved: true
        }
      }),
      prisma.project.count({ where })
    ]);

    const projectsWithParsedData = projects.map((project: any) => ({
      ...project,
      type: project.type as ProjectType,
      location: project.location as ProjectLocation,
      status: project.status as ProjectStatus,
      paths: JSON.parse(project.paths),
      ports: JSON.parse(project.ports),
      claudeCli: JSON.parse(project.claudeCli),
      geminiCli: JSON.parse(project.geminiCli),
      qwenCli: JSON.parse(project.qwenCli),
      urlResolver: project.urlResolver ? JSON.parse(project.urlResolver) : null
    }));

    const response: ApiResponse<{ projects: any[], total: number, limit: number, offset: number }> = {
      data: {
        projects: projectsWithParsedData,
        total,
        limit,
        offset
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /projects/:slug - Get single project
projectRouter.get('/:slug', validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        ports_reserved: true
      }
    });

    if (!project) {
      throw new HttpError(404, 'NotFoundError', `Project with slug '${slug}' not found`);
    }

    const projectWithParsedData = {
      ...project,
      type: project.type as ProjectType,
      location: project.location as ProjectLocation,
      status: project.status as ProjectStatus,
      paths: JSON.parse(project.paths),
      ports: JSON.parse(project.ports),
      claudeCli: JSON.parse(project.claudeCli),
      geminiCli: JSON.parse(project.geminiCli),
      qwenCli: JSON.parse(project.qwenCli),
      urlResolver: project.urlResolver ? JSON.parse(project.urlResolver) : null
    };

    const response: ApiResponse<ProjectData> = {
      data: projectWithParsedData,
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /projects - Create new project
projectRouter.post('/', validateBody(createProjectDtoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      name, 
      slug: providedSlug, 
      type, 
      location, 
      paths,
      templateVariables = {},
      autoStart = false,
      setupClaude = false,
      setupGemini = false
    } = req.body;

    // Generate slug if not provided
    const slug = providedSlug || name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Validate slug with the proper regex from PRD
    const slugRegex = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;
    if (!slugRegex.test(slug)) {
      throw new HttpError(400, 'ValidationError', 'Invalid slug format. Must be 3-40 characters, lowercase letters, numbers, and hyphens, cannot start or end with hyphen.');
    }

    // Validate slug uniqueness
    const existingProject = await prisma.project.findUnique({
      where: { slug }
    });

    if (existingProject) {
      throw new HttpError(409, 'ConflictError', `Project with slug '${slug}' already exists`);
    }

    // Validate template exists
    try {
      await templateEngine.loadManifest(type);
    } catch (error) {
      throw new HttpError(400, 'ValidationError', `Template '${type}' not found or invalid`);
    }

    // Create docker project name
    const dockerProject = `devlauncher-${slug}`;

    // Ensure target directory exists
    if (location === 'wsl') {
      // For WSL projects, create directory in WSL filesystem
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const wslPath = paths.wsl || paths.host;
      logger.info(`Creating WSL directory: ${wslPath}`);
      logger.info(`Received paths object:`, paths);
      
      try {
        // First create parent directory if it doesn't exist
        const parentDir = '/home/jfranjic/dev-projects';
        await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "mkdir -p ${parentDir}"`);
        
        // Then create project directory
        const createDirCommand = `wsl.exe -d Ubuntu -u jfranjic bash -c "mkdir -p '${wslPath}'"`;
        logger.info(`Executing: ${createDirCommand}`);
        const { stdout, stderr } = await execAsync(createDirCommand);
        
        if (stderr) {
          logger.warn(`WSL mkdir stderr: ${stderr}`);
        }
        
        logger.info(`WSL directory created: ${wslPath}`);
      } catch (error) {
        logger.error('Failed to create WSL directory:', error);
        logger.error('Error details:', JSON.stringify(error));
        throw new HttpError(500, 'SystemError', `Failed to create project directory in WSL: ${wslPath}`);
      }
    } else {
      // For Windows projects, create directory normally
      await fs.mkdir(paths.host, { recursive: true });
    }

    // Allocate ports for the template
    const allocatedPorts = await templateEngine.allocatePorts(type, slug);

    // Store ports as simple values for easier usage
    const formattedPorts = allocatedPorts;

    // Get default variables from template manifest and merge with provided variables
    const defaultVariables = await templateEngine.getDefaultVariables(type);
    const mergedVariables = { ...defaultVariables, ...templateVariables };

    // Execute pre-create hooks
    const templateContext: TemplateRenderContext = {
      slug,
      name,
      type: type as ProjectType,
      location: location as ProjectLocation,
      ports: allocatedPorts,
      paths,
      variables: mergedVariables,
      wslDistro: 'Ubuntu', // Default, could be configurable
      wslUser: process.env.WSL_USER || 'jfranjic',
      windowsUser: process.env.USERNAME || 'user'
    };

    await templateEngine.executeHooks(type, 'preCreate', templateContext);

    // Render template to target directory
    // For WSL projects, use the Windows-accessible UNC path
    let templateTargetPath: string;
    if (location === 'wsl') {
      const wslPath = paths.wsl || paths.host;
      // Convert WSL path to Windows UNC path
      templateTargetPath = paths.unc || paths.windows || `\\\\wsl$\\Ubuntu${wslPath}`;
      logger.info(`Rendering template to WSL UNC path: ${templateTargetPath}`);
    } else {
      templateTargetPath = paths.host;
    }
    
    try {
      await templateEngine.renderTemplate(type, templateTargetPath, templateContext);
      logger.info(`Template rendered successfully to: ${templateTargetPath}`);
    } catch (error) {
      logger.error('Failed to render template:', error);
      throw new HttpError(500, 'SystemError', `Failed to render template to: ${templateTargetPath}`);
    }

    // Create project in database
    const project = await prisma.project.create({
      data: {
        name,
        slug,
        type,
        location,
        paths: JSON.stringify(paths),
        ports: JSON.stringify(formattedPorts),
        dockerProject,
        status: ProjectStatusValues.STOPPED,
        claudeCli: JSON.stringify({ installed: false }),
        geminiCli: JSON.stringify({ installed: false }),
        qwenCli: JSON.stringify({ installed: false })
      }
    });

    // Execute post-create hooks
    await templateEngine.executeHooks(type, 'postCreate', templateContext);

    // Auto-start if requested
    if (autoStart) {
      try {
        await dockerService.composeUp({
          projectPath: paths.host,
          projectName: dockerProject,
          location: location as ProjectLocation
        });

        // Update project status
        await prisma.project.update({
          where: { slug },
          data: { status: ProjectStatusValues.RUNNING }
        });

        // Execute post-up hooks
        await templateEngine.executeHooks(type, 'postUp', templateContext);

        logger.info(`Project ${slug} auto-started successfully`);
      } catch (error) {
        logger.error(`Failed to auto-start project ${slug}:`, error);
        // Don't fail the entire creation, just log the error
      }
    }

    // Audit log
    auditLogger.info('Project created', {
      actor: 'system',
      action: 'project.create',
      params: { slug, name, type, location, autoStart, setupClaude, setupGemini },
      result: { id: project.id, allocatedPorts }
    });

    const projectWithParsedData = {
      ...project,
      type: project.type as ProjectType,
      location: project.location as ProjectLocation,
      status: project.status as ProjectStatus,
      paths: JSON.parse(project.paths),
      ports: JSON.parse(project.ports),
      claudeCli: JSON.parse(project.claudeCli),
      geminiCli: JSON.parse(project.geminiCli),
      qwenCli: JSON.parse(project.qwenCli),
      urlResolver: project.urlResolver ? JSON.parse(project.urlResolver) : null
    };

    const response: ApiResponse<ProjectData & { allocatedPorts: typeof allocatedPorts }> = {
      data: {
        ...projectWithParsedData,
        allocatedPorts
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create project:', error);
    next(error);
  }
});

// PUT /projects/:slug - Update project
projectRouter.put('/:slug', 
  validateParams(z.object({ slug: slugSchema })),
  validateBody(updateProjectDtoSchema), 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const updateData = req.body;

      // Check if project exists
      const existingProject = await prisma.project.findUnique({
        where: { slug }
      });

      if (!existingProject) {
        throw new HttpError(404, 'NotFoundError', `Project with slug '${slug}' not found`);
      }

      // Prepare update data with JSON serialization
      const updatePayload: any = {};
      
      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.type) updatePayload.type = updateData.type;
      if (updateData.location) updatePayload.location = updateData.location;
      if (updateData.status) updatePayload.status = updateData.status;
      if (updateData.paths) updatePayload.paths = JSON.stringify(updateData.paths);
      if (updateData.ports) updatePayload.ports = JSON.stringify(updateData.ports);
      if (updateData.claudeCli) updatePayload.claudeCli = JSON.stringify(updateData.claudeCli);
      if (updateData.geminiCli) updatePayload.geminiCli = JSON.stringify(updateData.geminiCli);
      if (updateData.qwenCli) updatePayload.qwenCli = JSON.stringify(updateData.qwenCli);
      if (updateData.urlResolver) updatePayload.urlResolver = JSON.stringify(updateData.urlResolver);

      const project = await prisma.project.update({
        where: { slug },
        data: updatePayload
      });

      // Audit log
      auditLogger.info('Project updated', {
        actor: 'system',
        action: 'project.update',
        params: { slug, updates: Object.keys(updateData) },
        result: { id: project.id }
      });

      const projectWithParsedData = {
        ...project,
        type: project.type as ProjectType,
        location: project.location as ProjectLocation,
        status: project.status as ProjectStatus,
        paths: JSON.parse(project.paths),
        ports: JSON.parse(project.ports),
        claudeCli: JSON.parse(project.claudeCli),
        geminiCli: JSON.parse(project.geminiCli),
        urlResolver: project.urlResolver ? JSON.parse(project.urlResolver) : null
      };

      const response: ApiResponse<ProjectData> = {
        data: projectWithParsedData,
        error: null,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /projects/:slug - Delete project
projectRouter.delete('/:slug', validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    logger.info(`Starting DELETE operation for project: ${slug}`);

    const existingProject = await prisma.project.findUnique({
      where: { slug }
    });

    if (!existingProject) {
      throw new HttpError(404, 'NotFoundError', `Project with slug '${slug}' not found`);
    }

    // Stop containers if running
    if (existingProject.status === ProjectStatusValues.RUNNING) {
      try {
        await dockerService.composeDown({
          projectPath: JSON.parse(existingProject.paths).host,
          projectName: existingProject.dockerProject,
          location: existingProject.location as ProjectLocation
        });
      } catch (error) {
        logger.warn('Failed to stop containers during project deletion:', error);
      }
    }

    // Deallocate ports
    await portAllocator.deallocateProjectPorts(slug);
    
    // CRITICAL: Don't delete files for external-import projects
    if (existingProject.type !== ProjectTypeValues.EXTERNAL_IMPORT) {
      // Delete project folder only for non-external projects
      let paths;
      try {
        paths = JSON.parse(existingProject.paths);
      } catch (pathsError) {
        logger.error('Failed to parse project paths JSON:', pathsError);
        throw new HttpError(500, 'InternalServerError', 'Invalid project paths configuration');
      }
      
      try {
        if (existingProject.location === 'wsl') {
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);
          const wslPath = paths.wsl || paths.host;
          
          if (wslPath) {
            logger.info(`Deleting WSL project folder: ${wslPath}`);
            try {
              const deleteCommand = `wsl.exe -d Ubuntu -u jfranjic bash -c "rm -rf '${wslPath}'"`;
              await execAsync(deleteCommand, { timeout: 10000 });
            } catch (error) {
              logger.info('Regular rm failed, trying with Docker container for root files...');
              try {
                // Use Docker container to handle root-owned files
                const dockerCleanCommand = `wsl.exe -d Ubuntu -u jfranjic bash -c "docker run --rm -v '${wslPath}:/data' ubuntu bash -c 'rm -rf /data/*' && rmdir '${wslPath}'"`;
                await execAsync(dockerCleanCommand, { timeout: 30000 });
                logger.info('Docker container successfully cleaned root files');
              } catch (dockerError) {
                logger.warn('Docker cleanup also failed, but continuing with database deletion');
              }
            }
            logger.info(`WSL project folder deleted: ${wslPath}`);
          }
        } else {
          // Windows deletion logic here if needed
          logger.info('Windows project deletion not implemented');
        }
      } catch (folderError) {
        logger.warn('Failed to delete project folder, but continuing with database deletion:', folderError);
        // Continue to database deletion even if folder deletion fails
      }
    } else {
      logger.info(`Skipping file deletion for external-import project: ${slug}`);
    }

    // Delete project (cascades to tasks and port reservations)
    try {
      logger.info(`Attempting to delete project from database: ${slug}`);
      await prisma.project.delete({
        where: { slug }
      });
      logger.info(`Successfully deleted project from database: ${slug}`);
    } catch (dbError) {
      logger.error('Failed to delete project from database:', dbError);
      throw new HttpError(500, 'DatabaseError', `Failed to delete project: ${dbError.message}`);
    }

    // Audit log
    auditLogger.info('Project deleted', {
      actor: 'system',
      action: 'project.delete',
      params: { slug },
      result: { deleted: true }
    });

    const response: ApiResponse<{ deleted: boolean }> = {
      data: { deleted: true },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    logger.info(`Successfully completed DELETE operation for project: ${req.params.slug}`);
    res.json(response);
  } catch (error) {
    logger.error(`DELETE operation failed for project: ${req.params.slug}`, error);
    console.error('DELETE ERROR DETAILS:', error);
    next(error);
  }
});

// POST /projects/:slug/start - Start project containers
projectRouter.post('/:slug/start', validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, 'NotFoundError', `Project with slug '${slug}' not found`);
    }

    const paths = JSON.parse(project.paths);
    const ports = JSON.parse(project.ports);

    // Create template context for hooks
    const templateContext: TemplateRenderContext = {
      slug: project.slug,
      name: project.name,
      type: project.type as ProjectType,
      location: project.location as ProjectLocation,
      ports: ports, // ports are already in the correct format
      paths,
      variables: {},
      wslDistro: 'Ubuntu',
      wslUser: process.env.WSL_USER || 'jfranjic',
      windowsUser: process.env.USERNAME || 'user'
    };

    // Execute pre-up hooks
    try {
      await templateEngine.executeHooks(project.type, 'preUp', templateContext);
    } catch (error) {
      logger.warn(`Pre-up hooks failed for project ${slug}:`, error);
    }
    
    await dockerService.composeUp({
      projectPath: paths.host,
      projectName: project.dockerProject,
      location: project.location as ProjectLocation
    });

    // Update project status
    await prisma.project.update({
      where: { slug },
      data: { status: ProjectStatusValues.RUNNING }
    });

    // Execute post-up hooks
    try {
      await templateEngine.executeHooks(project.type, 'postUp', templateContext);
    } catch (error) {
      logger.warn(`Post-up hooks failed for project ${slug}:`, error);
    }

    // Audit log
    auditLogger.info('Project started', {
      actor: 'system',
      action: 'project.start',
      params: { slug },
      result: { status: ProjectStatusValues.RUNNING }
    });

    const response: ApiResponse<{ status: string }> = {
      data: { status: ProjectStatusValues.RUNNING },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /projects/:slug/stop - Stop project containers
projectRouter.post('/:slug/stop', validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, 'NotFoundError', `Project with slug '${slug}' not found`);
    }

    const paths = JSON.parse(project.paths);
    
    await dockerService.composeDown({
      projectPath: paths.host,
      projectName: project.dockerProject,
      location: project.location as ProjectLocation
    });

    // Update project status
    await prisma.project.update({
      where: { slug },
      data: { status: ProjectStatusValues.STOPPED }
    });

    // Audit log
    auditLogger.info('Project stopped', {
      actor: 'system',
      action: 'project.stop',
      params: { slug },
      result: { status: ProjectStatusValues.STOPPED }
    });

    const response: ApiResponse<{ status: string }> = {
      data: { status: ProjectStatusValues.STOPPED },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /projects/:slug/status - Get project Docker status
projectRouter.get('/:slug/status', validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, 'NotFoundError', `Project with slug '${slug}' not found`);
    }

    const paths = JSON.parse(project.paths);
    
    const dockerStatus = await dockerService.getProjectStatus({
      projectPath: paths.host,
      projectName: project.dockerProject,
      location: project.location as ProjectLocation
    });

    // Update database status if different
    const actualStatus = dockerStatus.isRunning ? ProjectStatusValues.RUNNING : ProjectStatusValues.STOPPED;
    if (project.status !== actualStatus) {
      await prisma.project.update({
        where: { slug },
        data: { status: actualStatus }
      });
    }

    const response: ApiResponse<typeof dockerStatus> = {
      data: dockerStatus,
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /projects/:slug/logs - Get project logs
projectRouter.get('/:slug/logs', validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { service, tail = 100 } = req.query as any;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, 'NotFoundError', `Project with slug '${slug}' not found`);
    }

    const paths = JSON.parse(project.paths);
    
    const logs = await dockerService.getLogs({
      projectPath: paths.host,
      projectName: project.dockerProject,
      location: project.location as ProjectLocation
    }, service, parseInt(tail));

    const response: ApiResponse<{ logs: string }> = {
      data: { logs },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /projects/:slug/open/terminal - Open terminal for project
projectRouter.post('/:slug/open/terminal', validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { command } = req.body;
    const { service } = req.body;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, 'NotFoundError', `Project with slug '${slug}' not found`);
    }

    const paths = JSON.parse(project.paths);
    const { exec } = require('child_process');
    
    // Open Windows Terminal with the project directory
    let wtCommand: string;
    if (project.location === 'wsl') {
      // For WSL, we need to:
      // 1. Open as user jfranjic (not root)
      // 2. Navigate to project directory
      let wslPath = paths.wsl || paths.host;
      
      // Fix legacy paths that have /home/user instead of /home/jfranjic
      if (wslPath.startsWith('/home/user/')) {
        wslPath = wslPath.replace('/home/user/', '/home/jfranjic/');
        logger.info(`Fixed legacy WSL path from /home/user to /home/jfranjic`);
      }
      
      // WSL 2.0+ podržava --cd flag za postavljanje radnog direktorija
      // Ovo je najčišći način da se otvori terminal u pravom direktoriju
      if (command) {
        // If command is provided, execute it in the project directory
        // For interactive CLI tools (claude, gemini), they keep terminal open themselves
        // For other commands, we keep terminal open with bash
        const isInteractiveCLI = (command.startsWith('claude') || command.startsWith('gemini')) && 
                                 !command.includes('mcp') && 
                                 !command.includes('--version') && 
                                 !command.includes('--help');
        
        if (isInteractiveCLI) {
          // Interactive CLI tools - ensure we're in the correct directory with explicit cd
          // This is critical for project isolation - Claude CLI must run in specific project folder
          // Use --mcp-config to force reading local project MCP configuration
          let enhancedCommand = command;
          if (command.startsWith('claude') && !command.includes('--mcp-config')) {
            enhancedCommand = `claude --mcp-config "${wslPath}/.mcp.json" ${command.substring(6)}`.trim();
          }
          wtCommand = `wt.exe -p Ubuntu -- wsl.exe -d Ubuntu -u jfranjic --cd "${wslPath}" bash -lic "cd '${wslPath}' && echo 'Running ${enhancedCommand} in: $(pwd)' && ${enhancedCommand}"`;
        } else {
          // Non-interactive commands - execute and show output
          // For MCP commands and other quick commands, we need to see the output
          if (command.includes('mcp') || command.includes('--version') || command.includes('--help')) {
            // Run command and then start a new bash session to keep terminal open
            // Using && bash to start new shell after command completes
            wtCommand = `wt.exe -p Ubuntu -- wsl.exe -d Ubuntu -u jfranjic --cd "${wslPath}" bash -lic "${command} && bash"`;
          } else {
            // For other commands, use same approach
            wtCommand = `wt.exe -p Ubuntu -- wsl.exe -d Ubuntu -u jfranjic --cd "${wslPath}" bash -lic "${command} && bash"`;
          }
        }
        logger.info(`Opening WSL terminal with command: ${command}`);
      } else {
        // Just open terminal in project directory - TESTED AND WORKING
        wtCommand = `wt.exe -p Ubuntu -- wsl.exe -d Ubuntu -u jfranjic --cd "${wslPath}"`;
        logger.info(`Opening WSL terminal with --cd flag (WSL 2.0+ feature)`);
      }
      logger.info(`Target directory: ${wslPath}`);
      logger.info(`Full WT command: ${wtCommand}`);
    } else {
      if (command) {
        // For Windows projects, execute command in PowerShell
        // Add ; pause to keep terminal open after command completes
        wtCommand = `wt.exe -p "PowerShell 7" -d "${paths.host}" powershell.exe -NoExit -Command "${command}"`;
      } else {
        wtCommand = `wt.exe -p "PowerShell 7" -d "${paths.host}"`;
      }
    }
    
    // Execute the command directly without start
    // wt.exe will open in foreground by default
    logger.info(`Executing terminal command: ${wtCommand}`);
    
    exec(wtCommand, { shell: true }, (error: any) => {
      if (error) {
        // Windows Terminal often returns error even when successful
        logger.info('Terminal command completed (may have opened successfully despite error):', error?.message);
      } else {
        logger.info('Terminal command executed successfully');
      }
    });

    // Audit log
    auditLogger.info('Terminal opened', {
      actor: 'system',
      action: 'project.terminal.open',
      params: { slug, service },
      result: { opened: true }
    });

    const response: ApiResponse<{ opened: boolean }> = {
      data: { opened: true },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /projects/:slug/open/folder - Open folder for project
projectRouter.post('/:slug/open/folder', validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, 'NotFoundError', `Project with slug '${slug}' not found`);
    }

    const paths = JSON.parse(project.paths);
    const { exec } = require('child_process');
    
    // Open Windows Explorer with the project directory
    // For WSL projects, use the UNC path or Windows path
    let folderPath: string;
    if (project.location === 'wsl') {
      let wslPath = paths.wsl || paths.host;
      // Fix legacy paths
      if (wslPath.startsWith('/home/user/')) {
        wslPath = wslPath.replace('/home/user/', '/home/jfranjic/');
      }
      folderPath = paths.unc || paths.windows || `\\\\wsl$\\Ubuntu${wslPath}`;
      logger.info(`Opening WSL folder with UNC path: ${folderPath}`);
    } else {
      folderPath = paths.host;
    }
    const folderCommand = `start "" "explorer.exe" "${folderPath}"`;
    
    exec(folderCommand, { shell: true }, (error: any) => {
      if (error) {
        logger.warn('Folder open warning:', error);
      }
    });

    // Audit log
    auditLogger.info('Folder opened', {
      actor: 'system',
      action: 'project.folder.open',
      params: { slug },
      result: { opened: true }
    });

    const response: ApiResponse<{ opened: boolean }> = {
      data: { opened: true },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /projects/:slug/open/editor - Open editor for project
projectRouter.post('/:slug/open/editor', validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { editor = 'code' } = req.body;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, 'NotFoundError', `Project with slug '${slug}' not found`);
    }

    const paths = JSON.parse(project.paths);
    const { spawn, exec } = require('child_process');
    
    // Get default editor from settings or use provided one
    const settings = await prisma.settings.findFirst();
    const defaultEditor = settings?.editorMode || 'code';
    const editorToUse = editor || defaultEditor;
    
    if (project.location === 'wsl') {
      // For WSL projects, use the preferred editor (both VS Code and Cursor support WSL remote)
      const editorCommand = editorToUse === 'cursor' ? 'cursor' : 'code';
      
      // For WSL projects, use the WSL remote path format
      let wslPath = paths.wsl || paths.host;
      // Fix legacy paths
      if (wslPath.startsWith('/home/user/')) {
        wslPath = wslPath.replace('/home/user/', '/home/jfranjic/');
      }
      
      // Ensure we're opening the specific project folder, not parent
      if (!wslPath.includes(project.slug)) {
        wslPath = `/home/jfranjic/dev-projects/${project.slug}`;
      }
      
      logger.info(`Opening ${editorCommand} in WSL remote mode for: ${wslPath}`);
      
      // Use exec with proper command format for WSL remote
      const command = `${editorCommand} --remote wsl+Ubuntu "${wslPath}"`;
      exec(command, (error: any) => {
        if (error) {
          logger.warn('Editor open warning:', error);
        }
      });
    } else {
      // For Windows projects, use the preferred editor
      const editorCommand = editorToUse === 'cursor' ? 'cursor' : 'code';
      logger.info(`Opening ${editorCommand} for Windows project: ${paths.host}`);
      
      const child = spawn(editorCommand, [paths.host], {
        shell: true,
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
    }

    // Audit log
    auditLogger.info('Editor opened', {
      actor: 'system',
      action: 'project.editor.open',
      params: { slug, editor },
      result: { opened: true }
    });

    const response: ApiResponse<{ opened: boolean }> = {
      data: { opened: true },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});
// POST /projects/:slug/install/claude - Install Claude CLI for project
projectRouter.post("/:slug/install/claude", validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { reinstall = false } = req.body;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, "NotFoundError", `Project with slug "${slug}" not found`);
    }

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Install or reinstall Claude CLI based on project location
    let installSkipped = false;
    
    if (project.location === 'wsl') {
      // For WSL projects, install Claude CLI in WSL
      // First check if already installed
      try {
        const { stdout: checkInstall } = await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "which claude 2>/dev/null"`);
        if (checkInstall && checkInstall.trim().length > 0) {
          logger.info('Claude CLI already installed in WSL at: ' + checkInstall.trim());
          
          // If reinstall flag is set, try to update
          if (reinstall) {
            logger.info('Attempting to update Claude CLI in WSL...');
            try {
              await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "claude update"`, { timeout: 30000 });
              logger.info('Claude CLI updated successfully');
            } catch (updateError) {
              logger.warn('Could not update Claude CLI, may already be latest version');
            }
          } else {
            // Already installed, skip installation
            installSkipped = true;
            logger.info('Claude CLI already installed, skipping installation');
          }
        } else {
          // Not installed, need to install
          logger.info('Claude CLI not found in WSL, installing...');
          throw new Error('Claude CLI not installed');
        }
      } catch (e) {
        // Not installed, need to install
        logger.info('Installing Claude CLI in WSL...');
        try {
          // Create .npm-global directory if it doesn't exist
          await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "mkdir -p ~/.npm-global"`);
          
          // Set npm prefix to user directory
          await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "npm config set prefix '~/.npm-global'"`);
          
          // Install Claude CLI globally for the user
          await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "npm install -g @anthropic/claude-cli"`, { timeout: 120000 });
          
          // Add to PATH in .bashrc if not already there
          await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "grep -q '.npm-global/bin' ~/.bashrc || echo 'export PATH=~/.npm-global/bin:\$PATH' >> ~/.bashrc"`);
          
          logger.info('Claude CLI installed successfully in WSL');
        } catch (installError) {
          logger.error('Failed to install Claude CLI in WSL:', installError);
          throw new HttpError(500, 'InstallationError', 'Failed to install Claude CLI in WSL');
        }
      }
    } else {
      // For Windows projects, use PowerShell to install Claude CLI
      try {
        const installCommand = `powershell -Command "irm https://storage.googleapis.com/code.ainavi.co/install.ps1 | iex"`;
        await execAsync(installCommand, { timeout: 60000 });
        logger.info('Claude CLI installed in Windows environment');
      } catch (installError) {
        logger.error('Failed to install Claude CLI in Windows:', installError);
      }
    }

    // Try to get Claude CLI version based on project location
    let version = 'unknown';
    try {
      const versionCommand = project.location === 'wsl' 
        ? `wsl.exe -d Ubuntu -u jfranjic bash -c "claude --version"`
        : 'claude --version';
        
      const { stdout } = await execAsync(versionCommand);
      // Parse version from output (format: "Claude CLI version X.X.X")
      const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        version = versionMatch[1];
      }
    } catch (error) {
      logger.warn('Could not determine Claude CLI version:', error);
    }

    // Update project to mark Claude CLI as installed with actual version
    await prisma.project.update({
      where: { slug },
      data: { 
        claudeCli: JSON.stringify({ 
          installed: true,
          version,
          installedAt: new Date().toISOString()
        })
      }
    });

    // Audit log
    auditLogger.info(reinstall ? "Claude CLI reinstalled" : "Claude CLI installed", {
      actor: "system",
      action: reinstall ? "project.claude.reinstall" : "project.claude.install",
      params: { slug, reinstall },
      result: { installed: true, version }
    });

    const response: ApiResponse<{ installed: boolean; version: string }> = {
      data: { installed: true, version },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /projects/:slug/install/gemini - Install Gemini CLI for project  
projectRouter.post("/:slug/install/gemini", validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { reinstall = false } = req.body;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, "NotFoundError", `Project with slug "${slug}" not found`);
    }

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Install or reinstall Gemini CLI via npm based on project location
    try {
      let installCommand: string;
      let uninstallCommand: string;
      
      if (project.location === 'wsl') {
        // For WSL projects, install Gemini CLI in WSL with user npm prefix
        // Ensure npm is configured to use user directory
        const setupNpm = `wsl.exe -d Ubuntu -u jfranjic bash -c "mkdir -p ~/.npm-global && npm config set prefix '~/.npm-global' && echo 'export PATH=~/.npm-global/bin:\\\$PATH' >> ~/.bashrc"`;
        try {
          await execAsync(setupNpm);
        } catch (e) {
          logger.debug('NPM setup warning:', e);
        }
        
        if (reinstall) {
          logger.info('Reinstalling Gemini CLI in WSL...');
          uninstallCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "npm uninstall -g @google/gemini-cli"`;
          try {
            await execAsync(uninstallCommand);
          } catch (e) {
            // Ignore uninstall errors
          }
        }
        installCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "npm install -g @google/gemini-cli"`;
        logger.info('Installing Gemini CLI in WSL environment with user npm prefix');
      } else {
        // For Windows projects, install normally
        if (reinstall) {
          logger.info('Reinstalling Gemini CLI in Windows...');
          try {
            await execAsync('npm uninstall -g @google/gemini-cli');
          } catch (e) {
            // Ignore uninstall errors
          }
        }
        installCommand = 'npm install -g @google/gemini-cli';
        logger.info('Installing Gemini CLI in Windows environment');
      }
      
      await execAsync(installCommand, { timeout: 60000 });
      logger.info('Gemini CLI installed successfully');
    } catch (installError) {
      logger.error('Failed to install Gemini CLI:', installError);
      throw new HttpError(500, "InstallError", "Failed to install Gemini CLI");
    }

    // Try to get Gemini CLI version based on project location
    let version = 'unknown';
    try {
      const versionCommand = project.location === 'wsl'
        ? `wsl.exe -d Ubuntu -u jfranjic bash -l -c "gemini --version"`
        : 'gemini --version';
        
      const { stdout } = await execAsync(versionCommand);
      // Parse version from output
      const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        version = versionMatch[1];
      }
    } catch (error) {
      logger.warn('Could not determine Gemini CLI version:', error);
    }

    // Update project to mark Gemini CLI as installed with actual version
    await prisma.project.update({
      where: { slug },
      data: { 
        geminiCli: JSON.stringify({ 
          installed: true,
          version,
          installedAt: new Date().toISOString()
        })
      }
    });

    // Audit log
    auditLogger.info(reinstall ? "Gemini CLI reinstalled" : "Gemini CLI installed", {
      actor: "system",
      action: reinstall ? "project.gemini.reinstall" : "project.gemini.install",
      params: { slug, reinstall },
      result: { installed: true, version }
    });

    const response: ApiResponse<{ installed: boolean; version: string }> = {
      data: { installed: true, version },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /projects/:slug/update/claude - Update Claude CLI for project
projectRouter.post("/:slug/update/claude", validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, "NotFoundError", `Project with slug "${slug}" not found`);
    }

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Run Claude update command based on project location
    try {
      const updateCommand = project.location === 'wsl'
        ? `wsl.exe -d Ubuntu -u jfranjic bash -c "claude update"`
        : 'claude update';
        
      await execAsync(updateCommand);
      
      // Get new version after update
      let newVersion = 'unknown';
      try {
        const versionCommand = project.location === 'wsl'
          ? `wsl.exe -d Ubuntu -u jfranjic bash -c "claude --version"`
          : 'claude --version';
          
        const { stdout } = await execAsync(versionCommand);
        const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          newVersion = versionMatch[1];
        }
      } catch (error) {
        logger.warn('Could not get Claude CLI version after update:', error);
      }

      // Update project with new version
      await prisma.project.update({
        where: { slug },
        data: { 
          claudeCli: JSON.stringify({ 
            installed: true,
            version: newVersion,
            lastUpdated: new Date().toISOString()
          })
        }
      });

      // Audit log
      auditLogger.info("Claude CLI updated", {
        actor: "system",
        action: "project.claude.update",
        params: { slug },
        result: { updated: true, version: newVersion }
      });

      const response: ApiResponse<{ updated: boolean; version: string }> = {
        data: { updated: true, version: newVersion },
        error: null,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update Claude CLI:', error);
      throw new HttpError(500, "UpdateError", "Failed to update Claude CLI");
    }
  } catch (error) {
    next(error);
  }
});

// POST /projects/:slug/update/gemini - Update Gemini CLI for project
projectRouter.post("/:slug/update/gemini", validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, "NotFoundError", `Project with slug "${slug}" not found`);
    }

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Update Gemini CLI via npm based on project location
    try {
      const updateCommand = project.location === 'wsl'
        ? `wsl.exe -d Ubuntu -u jfranjic bash -l -c "npm update -g @google/gemini-cli"`
        : 'npm update -g @google/gemini-cli';
        
      await execAsync(updateCommand);
      logger.info('Gemini CLI updated successfully');
      
      // Get new version after update
      let newVersion = 'unknown';
      try {
        const versionCommand = project.location === 'wsl'
          ? `wsl.exe -d Ubuntu -u jfranjic bash -l -c "gemini --version"`
          : 'gemini --version';
          
        const { stdout } = await execAsync(versionCommand);
        const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          newVersion = versionMatch[1];
        }
      } catch (error) {
        logger.warn('Could not get Gemini CLI version after update:', error);
      }

      // Update project with new version
      await prisma.project.update({
        where: { slug },
        data: { 
          geminiCli: JSON.stringify({ 
            installed: true,
            version: newVersion,
            lastUpdated: new Date().toISOString()
          })
        }
      });

      // Audit log
      auditLogger.info("Gemini CLI updated", {
        actor: "system",
        action: "project.gemini.update",
        params: { slug },
        result: { updated: true, version: newVersion }
      });

      const response: ApiResponse<{ updated: boolean; version: string }> = {
        data: { updated: true, version: newVersion },
        error: null,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update Gemini CLI:', error);
      throw new HttpError(500, "UpdateError", "Failed to update Gemini CLI");
    }
  } catch (error) {
    next(error);
  }
});

// GET /projects/:slug/check-cli-versions - Check and update CLI versions for project
projectRouter.get("/:slug/check-cli-versions", validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, "NotFoundError", `Project with slug "${slug}" not found`);
    }

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const claudeCli = JSON.parse(project.claudeCli);
    const geminiCli = JSON.parse(project.geminiCli);
    const qwenCli = JSON.parse(project.qwenCli);
    
    let claudeVersion = claudeCli.version || 'unknown';
    let claudeLatest: string | false = false;
    let geminiVersion = geminiCli.version || 'unknown';
    let geminiLatest: string | false = false;
    let qwenVersion = qwenCli.version || 'unknown';
    let qwenLatest: string | false = false;

    // Check Claude CLI version if installed based on project location
    if (claudeCli.installed) {
      try {
        const versionCommand = project.location === 'wsl'
          ? `wsl.exe -d Ubuntu -u jfranjic bash -c "claude --version"`
          : 'claude --version';
          
        const { stdout } = await execAsync(versionCommand);
        const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          claudeVersion = versionMatch[1];
        }
        
        // Try to check for updates using claude update in dry-run mode
        try {
          const updateCheckCommand = project.location === 'wsl'
            ? `wsl.exe -d Ubuntu -u jfranjic bash -c "claude update --check 2>&1"`
            : 'claude update --check 2>&1';
            
          const { stdout: updateCheck } = await execAsync(updateCheckCommand, { timeout: 5000 });
          
          // Look for update available patterns in the output
          if (updateCheck.includes('new version') || updateCheck.includes('update available')) {
            // Extract version number if possible
            const latestVersionMatch = updateCheck.match(/version (\d+\.\d+\.\d+)/i);
            if (latestVersionMatch && latestVersionMatch[1] !== claudeVersion) {
              claudeLatest = latestVersionMatch[1];
            } else {
              claudeLatest = 'available'; // Update available but version unknown
            }
          }
        } catch (updateError) {
          // Ignore update check errors
          logger.debug('Could not check for Claude CLI updates:', updateError);
        }
      } catch (error) {
        logger.warn('Could not check Claude CLI version:', error);
      }
    }

    // Check Gemini CLI version if installed based on project location
    if (geminiCli.installed) {
      try {
        const versionCommand = project.location === 'wsl'
          ? `wsl.exe -d Ubuntu -u jfranjic bash -l -c "gemini --version"`
          : 'gemini --version';
          
        const { stdout } = await execAsync(versionCommand);
        const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          geminiVersion = versionMatch[1];
        }
        
        // Check for updates using npm since Gemini CLI is installed via npm
        try {
          const npmCommand = project.location === 'wsl'
            ? `wsl.exe -d Ubuntu -u jfranjic bash -l -c "npm view @google/gemini-cli version"`
            : 'npm view @google/gemini-cli version';
            
          const { stdout: npmOut } = await execAsync(npmCommand);
          const latestMatch = npmOut.match(/(\d+\.\d+\.\d+)/);
          if (latestMatch && latestMatch[1] !== geminiVersion) {
            geminiLatest = latestMatch[1];
          }
        } catch (updateError) {
          logger.debug('Could not check for Gemini CLI updates:', updateError);
        }
      } catch (error) {
        logger.warn('Could not check Gemini CLI version:', error);
      }
    }

    // Check Qwen CLI version if installed based on project location
    if (qwenCli.installed) {
      try {
        const versionCommand = project.location === 'wsl'
          ? `wsl.exe -d Ubuntu -u jfranjic bash -l -c "qwen --version"`
          : 'qwen --version';
          
        const { stdout } = await execAsync(versionCommand);
        const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          qwenVersion = versionMatch[1];
        }
        
        // Check for updates using npm since Qwen CLI is installed via npm
        try {
          const npmCommand = project.location === 'wsl'
            ? `wsl.exe -d Ubuntu -u jfranjic bash -l -c "npm view @qwen-code/qwen-code version"`
            : 'npm view @qwen-code/qwen-code version';
            
          const { stdout: npmOut } = await execAsync(npmCommand);
          const latestMatch = npmOut.match(/(\d+\.\d+\.\d+)/);
          if (latestMatch && latestMatch[1] !== qwenVersion) {
            qwenLatest = latestMatch[1];
          }
        } catch (updateError) {
          logger.debug('Could not check for Qwen CLI updates:', updateError);
        }
      } catch (error) {
        logger.warn('Could not check Qwen CLI version:', error);
      }
    }

    // Update database with new versions if changed
    const updateData: any = {};
    
    if (claudeCli.installed && claudeVersion !== claudeCli.version) {
      updateData.claudeCli = JSON.stringify({
        ...claudeCli,
        version: claudeVersion,
        latestVersion: claudeLatest || claudeVersion,
        lastChecked: new Date().toISOString()
      });
    }
    
    if (geminiCli.installed && geminiVersion !== geminiCli.version) {
      updateData.geminiCli = JSON.stringify({
        ...geminiCli,
        version: geminiVersion,
        latestVersion: geminiLatest || geminiVersion,
        lastChecked: new Date().toISOString()
      });
    }
    
    if (qwenCli.installed && qwenVersion !== qwenCli.version) {
      updateData.qwenCli = JSON.stringify({
        ...qwenCli,
        version: qwenVersion,
        latestVersion: qwenLatest || qwenVersion,
        lastChecked: new Date().toISOString()
      });
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.project.update({
        where: { slug },
        data: updateData
      });
    }

    const response: ApiResponse<{ 
      claude: { version: string; latest: string | false; installed: boolean };
      gemini: { version: string; latest: string | false; installed: boolean };
      qwen: { version: string; latest: string | false; installed: boolean };
    }> = {
      data: {
        claude: {
          installed: claudeCli.installed,
          version: claudeVersion,
          latest: claudeLatest
        },
        gemini: {
          installed: geminiCli.installed,
          version: geminiVersion,
          latest: geminiLatest
        },
        qwen: {
          installed: qwenCli.installed,
          version: qwenVersion,
          latest: qwenLatest
        }
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});
// POST /projects/:slug/install/qwen - Install Qwen CLI for project
projectRouter.post("/:slug/install/qwen", validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { reinstall = false } = req.body;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, "NotFoundError", `Project with slug "${slug}" not found`);
    }

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Install or reinstall Qwen CLI via npm based on project location
    try {
      let installCommand: string;
      let uninstallCommand: string;
      
      if (project.location === 'wsl') {
        // For WSL projects, install Qwen CLI in WSL with user npm prefix
        // Ensure npm is configured to use user directory
        const setupNpm = `wsl.exe -d Ubuntu -u jfranjic bash -c "mkdir -p ~/.npm-global && npm config set prefix '~/.npm-global' && echo 'export PATH=~/.npm-global/bin:\\$PATH' >> ~/.bashrc"`;
        try {
          await execAsync(setupNpm);
        } catch (e) {
          logger.debug('NPM setup warning:', e);
        }
        
        if (reinstall) {
          logger.info('Reinstalling Qwen CLI in WSL...');
          uninstallCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "npm uninstall -g @qwen-code/qwen-code"`;
          try {
            await execAsync(uninstallCommand);
          } catch (e) {
            // Ignore uninstall errors
          }
        }
        installCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "npm install -g @qwen-code/qwen-code"`;
        logger.info('Installing Qwen CLI in WSL environment with user npm prefix');
      } else {
        // For Windows projects, install normally
        if (reinstall) {
          logger.info('Reinstalling Qwen CLI in Windows...');
          try {
            await execAsync('npm uninstall -g @qwen-code/qwen-code');
          } catch (e) {
            // Ignore uninstall errors
          }
        }
        installCommand = 'npm install -g @qwen-code/qwen-code';
        logger.info('Installing Qwen CLI in Windows environment');
      }
      
      await execAsync(installCommand, { timeout: 60000 });
      logger.info('Qwen CLI installed successfully');
    } catch (installError) {
      logger.error('Failed to install Qwen CLI:', installError);
      throw new HttpError(500, "InstallError", "Failed to install Qwen CLI");
    }

    // Try to get Qwen CLI version based on project location
    let version = 'unknown';
    try {
      const versionCommand = project.location === 'wsl'
        ? `wsl.exe -d Ubuntu -u jfranjic bash -l -c "qwen --version"`
        : 'qwen --version';
        
      const { stdout } = await execAsync(versionCommand);
      // Parse version from output
      const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        version = versionMatch[1];
      }
    } catch (error) {
      logger.warn('Could not determine Qwen CLI version:', error);
    }

    // Update project to mark Qwen CLI as installed with actual version
    await prisma.project.update({
      where: { slug },
      data: { 
        qwenCli: JSON.stringify({ 
          installed: true,
          version,
          installedAt: new Date().toISOString()
        })
      }
    });

    // Audit log
    auditLogger.info(reinstall ? "Qwen CLI reinstalled" : "Qwen CLI installed", {
      actor: "system",
      action: reinstall ? "project.qwen.reinstall" : "project.qwen.install",
      params: { slug, reinstall },
      result: { installed: true, version }
    });

    const response: ApiResponse<{ installed: boolean; version: string }> = {
      data: { installed: true, version },
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /projects/:slug/update/qwen - Update Qwen CLI for project
projectRouter.post("/:slug/update/qwen", validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, "NotFoundError", `Project with slug "${slug}" not found`);
    }

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Update Qwen CLI via npm based on project location
    try {
      const updateCommand = project.location === 'wsl'
        ? `wsl.exe -d Ubuntu -u jfranjic bash -l -c "npm update -g @qwen-code/qwen-code"`
        : 'npm update -g @qwen-code/qwen-code';
        
      await execAsync(updateCommand);
      logger.info('Qwen CLI updated successfully');
      
      // Get new version after update
      let newVersion = 'unknown';
      try {
        const versionCommand = project.location === 'wsl'
          ? `wsl.exe -d Ubuntu -u jfranjic bash -l -c "qwen --version"`
          : 'qwen --version';
          
        const { stdout } = await execAsync(versionCommand);
        const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          newVersion = versionMatch[1];
        }
      } catch (error) {
        logger.warn('Could not get Qwen CLI version after update:', error);
      }

      // Update project with new version
      await prisma.project.update({
        where: { slug },
        data: { 
          qwenCli: JSON.stringify({ 
            installed: true,
            version: newVersion,
            lastUpdated: new Date().toISOString()
          })
        }
      });

      // Audit log
      auditLogger.info("Qwen CLI updated", {
        actor: "system",
        action: "project.qwen.update",
        params: { slug },
        result: { updated: true, version: newVersion }
      });

      const response: ApiResponse<{ updated: boolean; version: string }> = {
        data: { updated: true, version: newVersion },
        error: null,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update Qwen CLI:', error);
      throw new HttpError(500, "UpdateError", "Failed to update Qwen CLI");
    }
  } catch (error) {
    next(error);
  }
});