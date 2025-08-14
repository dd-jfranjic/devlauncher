import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { createLogger } from '../utils/logger';
import { HttpError } from '../middleware/error-handler';
import { ApiResponse } from '../domain/types';
import { TemplateEngine, TemplateRenderContext } from '../services/template-engine';
import { PortAllocatorService } from '../services/port-allocator';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const logger = createLogger('templates-api');
const prisma = new PrismaClient();
const portAllocator = new PortAllocatorService(prisma);

// Get templates root from environment or default
const templatesRoot = process.env.TEMPLATES_ROOT || path.join(process.cwd(), '..', 'templates');
const templateEngine = new TemplateEngine(templatesRoot, portAllocator);

export const templateRouter = Router();

// Validation schemas
const renderTemplateSchema = z.object({
  templateName: z.string().min(1),
  targetPath: z.string().min(1),
  context: z.object({
    slug: z.string().regex(/^[a-z][a-z0-9-]{1,38}[a-z0-9]$/),
    name: z.string().min(1),
    type: z.enum(['blank', 'nextjs', 'wordpress']),
    location: z.enum(['wsl', 'windows']),
    paths: z.object({
      host: z.string(),
      container: z.string(),
      relative: z.string(),
    }),
    variables: z.record(z.any()).optional(),
    wslDistro: z.string().optional(),
    wslUser: z.string().optional(),
    windowsUser: z.string().optional(),
  })
});

const allocatePortsSchema = z.object({
  templateName: z.string().min(1),
  slug: z.string().regex(/^[a-z][a-z0-9-]{1,38}[a-z0-9]$/),
  preferredPorts: z.record(z.number().min(1).max(65535)).optional()
});

// GET /templates - List all available templates
templateRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Fetching available templates');
    
    const templates = await templateEngine.getAvailableTemplates();
    
    const response: ApiResponse<typeof templates> = {
      data: templates,
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to fetch templates:', error);
    next(error);
  }
});

// GET /templates/:templateName - Get specific template details
templateRouter.get('/:templateName', validateParams(z.object({ templateName: z.string() })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { templateName } = req.params;
    logger.info(`Fetching template details for: ${templateName}`);
    
    const manifest = await templateEngine.loadManifest(templateName);
    
    const response: ApiResponse<typeof manifest> = {
      data: manifest,
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    logger.error(`Failed to fetch template ${req.params.templateName}:`, error);
    if (error instanceof Error && error.message.includes('Failed to load manifest')) {
      throw new HttpError(404, 'NotFoundError', `Template '${req.params.templateName}' not found`);
    }
    next(error);
  }
});

// POST /templates/:templateName/render - Render template to target directory
templateRouter.post('/:templateName/render', 
  validateParams(z.object({ templateName: z.string() })),
  validateBody(renderTemplateSchema.omit({ templateName: true })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { templateName } = req.params;
      const { targetPath, context } = req.body;

      logger.info(`Rendering template ${templateName} to ${targetPath}`, { context });

      // Validate context against template requirements
      const validationErrors = await templateEngine.validateContext(templateName, context);
      if (validationErrors.length > 0) {
        throw new HttpError(400, 'ValidationError', 'Template context validation failed', {
          errors: validationErrors
        });
      }

      // Allocate ports for the template
      const allocatedPorts = await templateEngine.allocatePorts(
        templateName, 
        context.slug, 
        context.variables?.preferredPorts
      );

      // Add allocated ports to context
      const renderContext: TemplateRenderContext = {
        ...context,
        ports: allocatedPorts
      };

      // Render template
      await templateEngine.renderTemplate(templateName, targetPath, renderContext);

      const response: ApiResponse<{ 
        success: boolean; 
        targetPath: string; 
        allocatedPorts: typeof allocatedPorts;
        context: TemplateRenderContext;
      }> = {
        data: {
          success: true,
          targetPath,
          allocatedPorts,
          context: renderContext
        },
        error: null,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error(`Failed to render template ${req.params.templateName}:`, error);
      next(error);
    }
  }
);

// POST /templates/:templateName/allocate-ports - Allocate ports for template
templateRouter.post('/:templateName/allocate-ports',
  validateParams(z.object({ templateName: z.string() })),
  validateBody(allocatePortsSchema.omit({ templateName: true })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { templateName } = req.params;
      const { slug, preferredPorts } = req.body;

      logger.info(`Allocating ports for template ${templateName}, slug: ${slug}`, { preferredPorts });

      const allocatedPorts = await templateEngine.allocatePorts(templateName, slug, preferredPorts);

      const response: ApiResponse<{ ports: typeof allocatedPorts }> = {
        data: { ports: allocatedPorts },
        error: null,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (error) {
      logger.error(`Failed to allocate ports for template ${req.params.templateName}:`, error);
      next(error);
    }
  }
);

// POST /templates/:templateName/validate-context - Validate template context
templateRouter.post('/:templateName/validate-context',
  validateParams(z.object({ templateName: z.string() })),
  validateBody(z.object({ context: z.record(z.any()) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { templateName } = req.params;
      const { context } = req.body;

      logger.info(`Validating context for template ${templateName}`, { context });

      const errors = await templateEngine.validateContext(templateName, context);
      const isValid = errors.length === 0;

      const response: ApiResponse<{ valid: boolean; errors: string[] }> = {
        data: { valid: isValid, errors },
        error: null,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (error) {
      logger.error(`Failed to validate context for template ${req.params.templateName}:`, error);
      next(error);
    }
  }
);

// POST /templates/:templateName/hooks/:hookType - Execute template hooks
templateRouter.post('/:templateName/hooks/:hookType',
  validateParams(z.object({ 
    templateName: z.string(),
    hookType: z.enum(['preCreate', 'postCreate', 'preUp', 'postUp'])
  })),
  validateBody(z.object({ context: z.any() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { templateName, hookType } = req.params;
      const { context } = req.body;

      logger.info(`Executing ${hookType} hooks for template ${templateName}`, { context });

      await templateEngine.executeHooks(templateName, hookType as any, context);

      const response: ApiResponse<{ success: boolean }> = {
        data: { success: true },
        error: null,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (error) {
      logger.error(`Failed to execute ${req.params.hookType} hooks for template ${req.params.templateName}:`, error);
      next(error);
    }
  }
);

// GET /templates/:templateName/files - List template files
templateRouter.get('/:templateName/files',
  validateParams(z.object({ templateName: z.string() })),
  validateQuery(z.object({ location: z.enum(['wsl', 'windows']).optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { templateName } = req.params;
      const { location } = req.query as { location?: 'wsl' | 'windows' };

      logger.info(`Listing files for template ${templateName}`, { location });

      const manifest = await templateEngine.loadManifest(templateName);
      
      let files: string[] = [];
      
      if (location && manifest.locations[location]) {
        files = manifest.locations[location]!.files || [];
      } else {
        // Return files for all locations
        const allFiles = new Set<string>();
        Object.values(manifest.locations).forEach(locationConfig => {
          locationConfig?.files?.forEach(file => allFiles.add(file));
        });
        files = Array.from(allFiles);
      }

      const response: ApiResponse<{ files: string[]; location?: string }> = {
        data: { files, location },
        error: null,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (error) {
      logger.error(`Failed to list files for template ${req.params.templateName}:`, error);
      if (error instanceof Error && error.message.includes('Failed to load manifest')) {
        throw new HttpError(404, 'NotFoundError', `Template '${req.params.templateName}' not found`);
      }
      next(error);
    }
  }
);