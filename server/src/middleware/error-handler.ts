import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createLogger } from '../utils/logger';

const logger = createLogger('error-handler');

export interface ApiError {
  error: string;
  message: string;
  code: number;
  details?: any;
}

export class HttpError extends Error {
  constructor(
    public code: number,
    public error: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const createApiError = (
  code: number,
  error: string,
  message: string,
  details?: any
): ApiError => ({
  error,
  message,
  code,
  ...(details && { details })
});

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle different error types
  if (err instanceof HttpError) {
    res.status(err.code).json(createApiError(err.code, err.error, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code
    }));
    
    res.status(400).json(createApiError(
      400,
      'ValidationError',
      'Request validation failed',
      { validationErrors: details }
    ));
    return;
  }

  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json(createApiError(
          409,
          'ConflictError',
          'Resource already exists',
          { constraint: prismaError.meta?.target }
        ));
        return;
      
      case 'P2025':
        res.status(404).json(createApiError(
          404,
          'NotFoundError',
          'Resource not found'
        ));
        return;
      
      default:
        res.status(500).json(createApiError(
          500,
          'DatabaseError',
          'Database operation failed',
          { code: prismaError.code }
        ));
        return;
    }
  }

  // Handle ENOENT file system errors
  if (err.message.includes('ENOENT')) {
    res.status(404).json(createApiError(
      404,
      'FileNotFoundError',
      'File or directory not found'
    ));
    return;
  }

  // Handle EACCES permission errors
  if (err.message.includes('EACCES')) {
    res.status(403).json(createApiError(
      403,
      'PermissionError',
      'Permission denied'
    ));
    return;
  }

  // Default internal server error
  res.status(500).json(createApiError(
    500,
    'InternalServerError',
    'An unexpected error occurred'
  ));
};