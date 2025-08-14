import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation';
import { auditLogger } from '../utils/logger';
import { HttpError } from '../middleware/error-handler';
import { createSettingDtoSchema, updateSettingDtoSchema } from '../domain/validation';
import { ApiResponse, SettingsData } from '../domain/types';

const prisma = new PrismaClient();

export const settingsRouter = Router();

// GET /settings - List all settings
settingsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.settings.findMany({
      orderBy: { key: 'asc' }
    });

    const settingsWithParsedData = settings.map((setting: any) => ({
      ...setting,
      value: JSON.parse(setting.value)
    }));

    const response: ApiResponse<{ settings: SettingsData[] }> = {
      data: { settings: settingsWithParsedData },
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

// GET /settings/:key - Get single setting
settingsRouter.get('/:key', validateParams(z.object({ key: z.string().min(1) })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;

    const setting = await prisma.settings.findUnique({
      where: { key }
    });

    if (!setting) {
      throw new HttpError(404, 'NotFoundError', `Setting with key '${key}' not found`);
    }

    const settingWithParsedData = {
      ...setting,
      value: JSON.parse(setting.value)
    };

    const response: ApiResponse<SettingsData> = {
      data: settingWithParsedData,
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

// POST /settings - Create new setting
settingsRouter.post('/', validateBody(createSettingDtoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, value } = req.body;

    // Check if setting already exists
    const existingSetting = await prisma.settings.findUnique({
      where: { key }
    });

    if (existingSetting) {
      throw new HttpError(409, 'ConflictError', `Setting with key '${key}' already exists`);
    }

    const setting = await prisma.settings.create({
      data: {
        key,
        value: JSON.stringify(value)
      }
    });

    // Audit log
    auditLogger.info('Setting created', {
      actor: 'system',
      action: 'setting.create',
      params: { key },
      result: { id: setting.id }
    });

    const settingWithParsedData = {
      ...setting,
      value: JSON.parse(setting.value)
    };

    const response: ApiResponse<SettingsData> = {
      data: settingWithParsedData,
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

// PUT /settings/:key - Update setting
settingsRouter.put('/:key', 
  validateParams(z.object({ key: z.string().min(1) })),
  validateBody(updateSettingDtoSchema), 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      const existingSetting = await prisma.settings.findUnique({
        where: { key }
      });

      if (!existingSetting) {
        throw new HttpError(404, 'NotFoundError', `Setting with key '${key}' not found`);
      }

      const setting = await prisma.settings.update({
        where: { key },
        data: {
          value: JSON.stringify(value)
        }
      });

      // Audit log
      auditLogger.info('Setting updated', {
        actor: 'system',
        action: 'setting.update',
        params: { key },
        result: { updated: true }
      });

      const settingWithParsedData = {
        ...setting,
        value: JSON.parse(setting.value)
      };

      const response: ApiResponse<SettingsData> = {
        data: settingWithParsedData,
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

// DELETE /settings/:key - Delete setting
settingsRouter.delete('/:key', validateParams(z.object({ key: z.string().min(1) })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;

    const existingSetting = await prisma.settings.findUnique({
      where: { key }
    });

    if (!existingSetting) {
      throw new HttpError(404, 'NotFoundError', `Setting with key '${key}' not found`);
    }

    await prisma.settings.delete({
      where: { key }
    });

    // Audit log
    auditLogger.info('Setting deleted', {
      actor: 'system',
      action: 'setting.delete',
      params: { key },
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