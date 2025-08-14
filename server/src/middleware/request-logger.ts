import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('http');

export const requestLogger = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    // Log incoming request
    logger.info('Incoming request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      contentLength: req.get('Content-Length'),
      requestId: (req as any).id || Math.random().toString(36).substr(2, 9)
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk: any, encoding?: any, cb?: any): Response {
      const duration = Date.now() - startTime;
      
      logger.info('Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length')
      });

      // Call original end method
      return originalEnd.call(this, chunk, encoding, cb) as Response;
    };

    next();
  };
};