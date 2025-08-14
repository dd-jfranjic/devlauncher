import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateBody, validateQuery } from '../middleware/validation';
import { createAuditLogDtoSchema } from '../domain/validation';
import { ApiResponse, AuditLogData } from '../domain/types';

const prisma = new PrismaClient();

export const auditRouter = Router();

const auditQuerySchema = z.object({
  actor: z.string().optional(),
  action: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// GET /audit - List audit logs
auditRouter.get('/', validateQuery(auditQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actor, action, limit, offset, startDate, endDate } = req.query as any;
    
    const where: any = {};
    if (actor) where.actor = { contains: actor };
    if (action) where.action = { contains: action };
    if (startDate || endDate) {
      where.ts = {};
      if (startDate) where.ts.gte = new Date(startDate);
      if (endDate) where.ts.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { ts: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    const logsWithParsedData = logs.map((log: any) => ({
      ...log,
      params: log.params ? JSON.parse(log.params) : null,
      result: log.result ? JSON.parse(log.result) : null
    }));

    const response: ApiResponse<{ logs: AuditLogData[], total: number, limit: number, offset: number }> = {
      data: {
        logs: logsWithParsedData,
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

// GET /audit/:id - Get single audit log
auditRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id }
    });

    if (!log) {
      res.status(404).json({
        error: 'NotFoundError',
        message: `Audit log with id '${id}' not found`,
        code: 404
      });
      return;
    }

    const logWithParsedData = {
      ...log,
      params: log.params ? JSON.parse(log.params) : null,
      result: log.result ? JSON.parse(log.result) : null
    };

    const response: ApiResponse<AuditLogData> = {
      data: logWithParsedData,
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

// POST /audit - Create audit log entry (internal use)
auditRouter.post('/', validateBody(createAuditLogDtoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actor, action, params, result } = req.body;

    const log = await prisma.auditLog.create({
      data: {
        actor,
        action,
        params: params ? JSON.stringify(params) : null,
        result: result ? JSON.stringify(result) : null
      }
    });

    const logWithParsedData = {
      ...log,
      params: log.params ? JSON.parse(log.params) : null,
      result: log.result ? JSON.parse(log.result) : null
    };

    const response: ApiResponse<AuditLogData> = {
      data: logWithParsedData,
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

// GET /audit/actions - Get list of available actions
auditRouter.get('/meta/actions', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const actions = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' }
    });

    const actionList = actions.map((a: any) => a.action);

    const response: ApiResponse<{ actions: string[] }> = {
      data: { actions: actionList },
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

// GET /audit/actors - Get list of actors
auditRouter.get('/meta/actors', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const actors = await prisma.auditLog.findMany({
      select: { actor: true },
      distinct: ['actor'],
      orderBy: { actor: 'asc' }
    });

    const actorList = actors.map((a: any) => a.actor);

    const response: ApiResponse<{ actors: string[] }> = {
      data: { actors: actorList },
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