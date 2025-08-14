import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { auditLogger } from '../utils/logger';
import { HttpError } from '../middleware/error-handler';
import { 
  createTaskDtoSchema, 
  updateTaskDtoSchema, 
  taskQuerySchema,
} from '../domain/validation';
import { 
  ApiResponse,
  TaskData,
  TaskType,
  TaskStatus
} from '../domain/types';

const prisma = new PrismaClient();

export const taskRouter = Router();

// GET /tasks - List tasks
taskRouter.get('/', validateQuery(taskQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectSlug, type, status, limit = 50, offset = 0 } = req.query as any;
    
    const where: any = {};
    if (projectSlug) where.projectSlug = projectSlug;
    if (type) where.type = type;
    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: { name: true, slug: true, type: true }
          }
        }
      }),
      prisma.task.count({ where })
    ]);

    const tasksWithParsedData = tasks.map((task: any) => ({
      ...task,
      type: task.type as TaskType,
      status: task.status as TaskStatus,
      result: task.result ? JSON.parse(task.result) : null
    }));

    const response: ApiResponse<{ tasks: any[], total: number, limit: number, offset: number }> = {
      data: {
        tasks: tasksWithParsedData,
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

// GET /tasks/:id - Get single task
taskRouter.get('/:id', validateParams(z.object({ id: z.string().uuid() })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { name: true, slug: true, type: true }
        }
      }
    });

    if (!task) {
      throw new HttpError(404, 'NotFoundError', `Task with id '${id}' not found`);
    }

    const taskWithParsedData = {
      ...task,
      type: task.type as TaskType,
      status: task.status as TaskStatus,
      result: task.result ? JSON.parse(task.result) : null
    };

    const response: ApiResponse<TaskData> = {
      data: taskWithParsedData,
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

// POST /tasks - Create new task
taskRouter.post('/', validateBody(createTaskDtoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectSlug, type, logPath } = req.body;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug }
    });

    if (!project) {
      throw new HttpError(404, 'NotFoundError', `Project with slug '${projectSlug}' not found`);
    }

    const task = await prisma.task.create({
      data: {
        projectSlug,
        type,
        logPath,
        status: 'queued'
      }
    });

    // Audit log
    auditLogger.info('Task created', {
      actor: 'system',
      action: 'task.create',
      params: { projectSlug, type, logPath },
      result: { id: task.id }
    });

    const taskWithType = {
      ...task,
      type: task.type as TaskType,
      status: task.status as TaskStatus,
      result: task.result ? JSON.parse(task.result) : null
    };

    const response: ApiResponse<TaskData> = {
      data: taskWithType,
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

// PUT /tasks/:id - Update task
taskRouter.put('/:id', 
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateTaskDtoSchema), 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingTask = await prisma.task.findUnique({
        where: { id }
      });

      if (!existingTask) {
        throw new HttpError(404, 'NotFoundError', `Task with id '${id}' not found`);
      }

      // Prepare update data
      const updatePayload: any = {};
      if (updateData.status) updatePayload.status = updateData.status;
      if (updateData.result) updatePayload.result = JSON.stringify(updateData.result);

      const task = await prisma.task.update({
        where: { id },
        data: updatePayload
      });

      // Audit log
      auditLogger.info('Task updated', {
        actor: 'system',
        action: 'task.update',
        params: { id, updates: Object.keys(updateData) },
        result: { status: task.status }
      });

      const taskWithParsedData = {
        ...task,
        type: task.type as TaskType,
        status: task.status as TaskStatus,
        result: task.result ? JSON.parse(task.result) : null
      };

      const response: ApiResponse<TaskData> = {
        data: taskWithParsedData,
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

// DELETE /tasks/:id - Delete task
taskRouter.delete('/:id', validateParams(z.object({ id: z.string().uuid() })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      throw new HttpError(404, 'NotFoundError', `Task with id '${id}' not found`);
    }

    await prisma.task.delete({
      where: { id }
    });

    // Audit log
    auditLogger.info('Task deleted', {
      actor: 'system',
      action: 'task.delete',
      params: { id },
      result: { deleted: true }
    });

    const response: ApiResponse<{ deleted: boolean }> = {
      data: { deleted: true },
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