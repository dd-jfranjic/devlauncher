import { Request, Response, NextFunction, Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { HttpError } from '../middleware/error-handler';
import { validateParams } from '../middleware/validation';
import { slugSchema } from '../domain/validation';
import { ProjectLocation } from '../domain/types';
import { createLogger } from '../utils/logger';
import { DockerService } from '../services/docker-service';

const logger = createLogger('api:docker');
const prisma = new PrismaClient();
const dockerService = new DockerService();

export const dockerRouter = Router();

// GET /projects/:slug/docker/services - Get Docker services for project
dockerRouter.get('/projects/:slug/docker/services', validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
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
    
    let services: any[] = [];
    let volumes: any[] = [];

    // For external-import projects, parse docker-compose.yml to get real services
    if (project.type === 'external-import') {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      try {
        // Read docker-compose.yml
        const { stdout } = await execAsync(`wsl.exe -d Ubuntu -u jfranjic cat "${paths.host}/docker-compose.yml"`);
        
        // Get container statuses
        const statusResult = await dockerService.getProjectStatus({
          projectPath: paths.host,
          projectName: project.dockerProject,
          location: project.location as ProjectLocation
        });
        
        // Parse docker-compose.yml for services and images
        const lines = stdout.split('\n');
        let currentService = '';
        let inServicesSection = false;
        let serviceData: any = {};
        
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
            // Save previous service if exists
            if (currentService && serviceData.image) {
              const hostPort = ports[currentService] || null;
              services.push({
                name: currentService,
                status: statusResult.isRunning ? 'running' : 'stopped',
                image: serviceData.image,
                ports: hostPort ? [`${hostPort}:${serviceData.containerPort || 'unknown'}`] : [],
                health: statusResult.isRunning ? 'healthy' : undefined
              });
            }
            
            currentService = trimmedLine.replace(':', '');
            serviceData = {};
            continue;
          }
          
          // Parse image (4 space indent)
          if (currentService && indentLevel === 4 && trimmedLine.startsWith('image:')) {
            serviceData.image = trimmedLine.replace('image:', '').trim();
          }
          
          // Parse container port from ports section
          if (currentService && trimmedLine.startsWith('- "') && trimmedLine.includes(':')) {
            const portMatch = trimmedLine.match(/(\d+):(\d+)/);
            if (portMatch) {
              serviceData.containerPort = portMatch[2];
            }
          }
          
          // Parse volumes section for volume names
          if (trimmedLine === 'volumes:' && indentLevel === 0) {
            // We've hit the volumes section at the end
            for (let j = i + 1; j < lines.length; j++) {
              const volumeLine = lines[j];
              const volumeTrimmed = volumeLine.trim();
              const volumeIndent = volumeLine.length - volumeLine.trimStart().length;
              
              if (volumeIndent === 2 && volumeTrimmed.endsWith(':')) {
                const volumeName = volumeTrimmed.replace(':', '');
                volumes.push({
                  name: volumeName,
                  description: 'Docker volume'
                });
              } else if (volumeIndent === 0 && volumeTrimmed !== '') {
                break; // End of volumes section
              }
            }
            break;
          }
          
          // Exit services section if we hit top-level key
          if (inServicesSection && indentLevel === 0 && trimmedLine !== 'services:' && trimmedLine !== '') {
            inServicesSection = false;
            break;
          }
        }
        
        // Save last service
        if (currentService && serviceData.image) {
          const hostPort = ports[currentService] || null;
          services.push({
            name: currentService,
            status: statusResult.isRunning ? 'running' : 'stopped',
            image: serviceData.image,
            ports: hostPort ? [`${hostPort}:${serviceData.containerPort || 'unknown'}`] : [],
            health: statusResult.isRunning ? 'healthy' : undefined
          });
        }
        
        logger.info(`Parsed ${services.length} services and ${volumes.length} volumes for ${slug}`);
        
      } catch (error) {
        logger.error('Failed to parse docker-compose.yml for services:', error);
        // Return empty arrays on error
      }
    }

    const response = {
      data: { services, volumes },
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