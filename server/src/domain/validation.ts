import { z } from 'zod';
import { 
  ProjectTypeValues, 
  ProjectLocationValues, 
  ProjectStatusValues, 
  TaskTypeValues, 
  TaskStatusValues 
} from './types';

// Base validation schemas
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(50, 'Slug must be less than 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .refine(s => !s.startsWith('-') && !s.endsWith('-'), 'Slug cannot start or end with hyphen');

export const projectNameSchema = z
  .string()
  .min(1, 'Project name is required')
  .max(100, 'Project name must be less than 100 characters')
  .trim();

export const pathsSchema = z.object({
  host: z.string().min(1, 'Host path is required'),
  container: z.string().min(1, 'Container path is required'),
  relative: z.string().min(1, 'Relative path is required')
});

export const portSchema = z.object({
  internal: z.number().int().min(1).max(65535),
  external: z.number().int().min(1).max(65535),
  protocol: z.enum(['tcp', 'udp']).default('tcp')
});

export const portsSchema = z.record(z.string(), portSchema);

export const claudeCliConfigSchema = z.object({
  installed: z.boolean(),
  version: z.string().optional(),
  configPath: z.string().optional(),
  mcpConfig: z.string().optional()
});

export const geminiCliConfigSchema = z.object({
  installed: z.boolean(),
  version: z.string().optional(),
  configPath: z.string().optional()
});

export const urlResolverConfigSchema = z.object({
  candidates: z.array(z.string().url()),
  resolved: z.string().url().optional(),
  lastChecked: z.string().datetime().optional(),
  healthStatus: z.enum(['healthy', 'unhealthy', 'unknown']).optional()
});

// Project DTOs
export const createProjectDtoSchema = z.object({
  name: projectNameSchema,
  slug: slugSchema.optional(),
  type: z.enum(Object.values(ProjectTypeValues) as [string, ...string[]]),
  location: z.enum(Object.values(ProjectLocationValues) as [string, ...string[]]),
  paths: pathsSchema,
  templateVariables: z.record(z.any()).optional(),
  autoStart: z.boolean().optional().default(false),
  setupClaude: z.boolean().optional().default(false),
  setupGemini: z.boolean().optional().default(false)
});

export const updateProjectDtoSchema = z.object({
  name: projectNameSchema.optional(),
  type: z.enum(Object.values(ProjectTypeValues) as [string, ...string[]]).optional(),
  location: z.enum(Object.values(ProjectLocationValues) as [string, ...string[]]).optional(),
  paths: pathsSchema.optional(),
  ports: portsSchema.optional(),
  status: z.enum(Object.values(ProjectStatusValues) as [string, ...string[]]).optional(),
  claudeCli: claudeCliConfigSchema.optional(),
  geminiCli: geminiCliConfigSchema.optional(),
  urlResolver: urlResolverConfigSchema.optional()
});

// Task DTOs
export const createTaskDtoSchema = z.object({
  projectSlug: slugSchema,
  type: z.enum(Object.values(TaskTypeValues) as [string, ...string[]]),
  logPath: z.string().min(1, 'Log path is required')
});

export const updateTaskDtoSchema = z.object({
  status: z.enum(Object.values(TaskStatusValues) as [string, ...string[]]).optional(),
  result: z.any().optional()
});

// Port reservation DTOs
export const createPortReservationDtoSchema = z.object({
  slug: slugSchema,
  template: z.string().min(1, 'Template is required'),
  portName: z.string().min(1, 'Port name is required'),
  portNumber: z.number().int().min(1024).max(65535)
});

// Query parameter schemas
export const projectQuerySchema = z.object({
  type: z.enum(Object.values(ProjectTypeValues) as [string, ...string[]]).optional(),
  location: z.enum(Object.values(ProjectLocationValues) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(ProjectStatusValues) as [string, ...string[]]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  search: z.string().optional()
});

export const taskQuerySchema = z.object({
  projectSlug: slugSchema.optional(),
  type: z.enum(Object.values(TaskTypeValues) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(TaskStatusValues) as [string, ...string[]]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

// Settings DTOs
export const createSettingDtoSchema = z.object({
  key: z.string().min(1, 'Setting key is required').max(100),
  value: z.any()
});

export const updateSettingDtoSchema = z.object({
  value: z.any()
});

// Audit log DTOs
export const createAuditLogDtoSchema = z.object({
  actor: z.string().min(1, 'Actor is required'),
  action: z.string().min(1, 'Action is required'),
  params: z.any().optional(),
  result: z.any().optional()
});

// Export type inference
export type CreateProjectDto = z.infer<typeof createProjectDtoSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectDtoSchema>;
export type CreateTaskDto = z.infer<typeof createTaskDtoSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskDtoSchema>;
export type CreatePortReservationDto = z.infer<typeof createPortReservationDtoSchema>;
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type CreateSettingDto = z.infer<typeof createSettingDtoSchema>;
export type UpdateSettingDto = z.infer<typeof updateSettingDtoSchema>;
export type CreateAuditLogDto = z.infer<typeof createAuditLogDtoSchema>;