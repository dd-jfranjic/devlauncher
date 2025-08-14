import pino from 'pino';
import path from 'path';

export interface LoggerConfig {
  level: string;
  isDevelopment: boolean;
  logDir?: string;
}

const getLoggerConfig = (): LoggerConfig => ({
  level: process.env.LOG_LEVEL || 'info',
  isDevelopment: process.env.NODE_ENV === 'development',
  logDir: process.env.LOG_DIR || path.join(process.cwd(), '.devlauncher', 'logs')
});

export const createLogger = (name: string) => {
  const config = getLoggerConfig();
  
  const logger = pino({
    name,
    level: config.level,
    ...(config.isDevelopment
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            }
          }
        }
      : {
          formatters: {
            level: (label: string) => ({ level: label }),
            log: (object: any) => ({ ...object })
          },
          timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
        }),
  });

  return logger;
};

export const logger = createLogger('app');
export const auditLogger = createLogger('audit');
export const serverLogger = createLogger('server');
export const dockerLogger = createLogger('docker');
export const portLogger = createLogger('port-allocator');