import { Request, Response, NextFunction, Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { HttpError } from '../middleware/error-handler';
import { validateBody } from '../middleware/validation';
import { slugSchema } from '../domain/validation';
import { ProjectTypeValues, ProjectLocationValues, ProjectStatusValues } from '../domain/types';
import { createLogger, auditLogger } from '../utils/logger';

const logger = createLogger('api:projects-import');
const prisma = new PrismaClient();

export const importRouter = Router();

// POST /projects/import-external - Import external project (like fiskal-ai-wsl)
importRouter.post('/import-external', validateBody(z.object({
  path: z.string(),
  name: z.string(),
  slug: slugSchema,
  dockerProject: z.string().optional(),
  preservePorts: z.boolean().default(true)
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path, name, slug, dockerProject, preservePorts } = req.body;
    
    logger.info(`Importing external project: ${name} from ${path}`);
    
    // Check if project already exists
    const existingProject = await prisma.project.findUnique({
      where: { slug }
    });
    
    if (existingProject) {
      throw new HttpError(409, 'ConflictError', `Project with slug "${slug}" already exists`);
    }
    
    // Check if path exists
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout, stderr } = await execAsync(`wsl.exe -d Ubuntu -u jfranjic bash -c "test -d '${path}' && echo 'EXISTS' || echo 'NOT_EXISTS'"`);
      if (stdout.trim() !== 'EXISTS') {
        throw new HttpError(404, 'NotFoundError', `Path "${path}" does not exist`);
      }
    } catch (error) {
      logger.error('Path validation error:', error);
      throw new HttpError(404, 'NotFoundError', `Path "${path}" does not exist or cannot be accessed`);
    }
    
    // Parse docker-compose.yml to extract ports
    let ports: Record<string, number> = {};
    
    try {
      // Read docker-compose.yml via WSL
      const { stdout } = await execAsync(`wsl.exe -d Ubuntu -u jfranjic cat "${path}/docker-compose.yml"`);
      
      logger.info('Docker compose content preview:', stdout.substring(0, 500));
      
      // Extract service names and ports
      const lines = stdout.split('\n');
      let currentService = '';
      let inPortsSection = false;
      let inServicesSection = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        const indentLevel = line.length - line.trimStart().length;
        
        // Check if we're in services section
        if (trimmedLine === 'services:') {
          inServicesSection = true;
          continue;
        }
        
        // Check for service name (2 space indent under services)
        if (inServicesSection && indentLevel === 2 && trimmedLine.match(/^[a-z][a-z0-9_-]*:$/)) {
          currentService = trimmedLine.replace(':', '');
          inPortsSection = false;
          logger.info(`Found service: ${currentService}`);
          continue;
        }
        
        // Check if we're entering ports section (4 space indent under service)
        if (trimmedLine === 'ports:' && currentService && indentLevel === 4) {
          inPortsSection = true;
          logger.info(`Entering ports section for service: ${currentService}`);
          continue;
        }
        
        // Extract port mapping when in ports section (6 space indent)
        if (inPortsSection && currentService && indentLevel === 6) {
          const portMatch = trimmedLine.match(/^-\s*["']?(\d+):(\d+)["']?/);
          if (portMatch) {
            const hostPort = parseInt(portMatch[1]);
            const containerPort = parseInt(portMatch[2]);
            
            ports[currentService] = hostPort;
            logger.info(`Found port mapping: ${currentService} -> ${hostPort}:${containerPort}`);
          }
        }
        
        // Exit ports section if indentation decreases
        if (inPortsSection && indentLevel <= 4 && trimmedLine !== '') {
          inPortsSection = false;
        }
        
        // Exit services section if we hit top-level key
        if (inServicesSection && indentLevel === 0 && trimmedLine !== 'services:' && trimmedLine !== '') {
          inServicesSection = false;
          currentService = '';
          inPortsSection = false;
        }
      }
      
      logger.info(`Extracted ports:`, ports);
    } catch (error) {
      logger.warn('Could not parse docker-compose.yml, using empty ports', error);
    }
    
    // Prepare project data for database
    const projectData = {
      name,
      slug,
      type: ProjectTypeValues.EXTERNAL_IMPORT,
      location: ProjectLocationValues.WSL,
      paths: JSON.stringify({
        host: path,
        container: '/workspace',
        relative: path.split('/').pop()
      }),
      ports: JSON.stringify(ports),
      dockerProject: dockerProject || 'fiskal-ai-wsl',
      status: ProjectStatusValues.STOPPED,
      claudeCli: JSON.stringify({ installed: false }),
      geminiCli: JSON.stringify({ installed: false })
    };
    
    // Create project in database
    const project = await prisma.project.create({
      data: projectData
    });
    
    // Check if containers are already running
    try {
      const checkCommand = `wsl.exe -d Ubuntu -u jfranjic bash -c "docker ps --filter label=com.docker.compose.project=${dockerProject || 'fiskal-ai-wsl'} --format '{{.Names}}' | wc -l"`;
      const { stdout } = await execAsync(checkCommand);
      const runningContainers = parseInt(stdout.trim());
      
      if (runningContainers > 0) {
        await prisma.project.update({
          where: { slug },
          data: { status: ProjectStatusValues.RUNNING }
        });
        
        logger.info(`Found ${runningContainers} running containers for project ${slug}`);
      }
    } catch (error) {
      logger.warn('Could not check container status', error);
    }
    
    // Audit log
    auditLogger.info('External project imported', {
      actor: 'system',
      action: 'project.import',
      params: { path, name, slug, dockerProject },
      result: { id: project.id, ports }
    });
    
    const response = {
      data: {
        ...project,
        paths: JSON.parse(project.paths),
        ports: JSON.parse(project.ports),
        claudeCli: JSON.parse(project.claudeCli),
        geminiCli: JSON.parse(project.geminiCli)
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