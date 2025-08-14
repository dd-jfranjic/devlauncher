import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation';
import { auditLogger } from '../utils/logger';
import { HttpError } from '../middleware/error-handler';
import { createPortReservationDtoSchema, slugSchema } from '../domain/validation';
import { ApiResponse } from '../domain/types';
import { PortAllocatorService } from '../services/port-allocator';

const prisma = new PrismaClient();
const portAllocator = new PortAllocatorService(prisma);

export const portRouter = Router();

// GET /ports - List all port reservations
portRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.query as any;
    
    const reservations = await portAllocator.getPortReservations(slug);

    const response: ApiResponse<{ reservations: any[] }> = {
      data: { reservations },
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

// POST /ports/allocate - Allocate port for project
portRouter.post('/allocate', validateBody(createPortReservationDtoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, template, portName, portNumber } = req.body;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { slug }
    });

    if (!project) {
      throw new HttpError(404, 'NotFoundError', `Project with slug '${slug}' not found`);
    }

    const allocation = await portAllocator.allocatePort({
      slug,
      template,
      portName,
      preferredPort: portNumber
    });

    // Audit log
    auditLogger.info('Port allocated', {
      actor: 'system',
      action: 'port.allocate',
      params: { slug, template, portName, preferredPort: portNumber },
      result: allocation
    });

    const response: ApiResponse<typeof allocation> = {
      data: allocation,
      error: null,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /ports/:slug - Deallocate all ports for project
portRouter.delete('/:slug', validateParams(z.object({ slug: slugSchema })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    await portAllocator.deallocateProjectPorts(slug);

    // Audit log
    auditLogger.info('Project ports deallocated', {
      actor: 'system',
      action: 'port.deallocate',
      params: { slug },
      result: { deallocated: true }
    });

    const response: ApiResponse<{ deallocated: boolean }> = {
      data: { deallocated: true },
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

// GET /ports/check/:port - Check if port is available
portRouter.get('/check/:port', validateParams(z.object({ port: z.coerce.number().int().min(1).max(65535) })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { port } = req.params;

    const isAvailable = await portAllocator.isPortAvailable(Number(port));

    const response: ApiResponse<{ port: number, available: boolean }> = {
      data: { 
        port: Number(port), 
        available: isAvailable 
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