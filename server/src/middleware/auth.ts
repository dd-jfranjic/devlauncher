import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '../utils/logger';

const log = logger.child({ component: 'AuthMiddleware' });

interface AuthConfig {
  token: string;
  createdAt: Date;
  lastUsed: Date;
}

class AuthService {
  private config: AuthConfig | null = null;
  private configPath: string;
  private csrfTokens: Map<string, { token: string; expires: Date }> = new Map();
  
  constructor() {
    // Store config in user's home directory
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.devlauncher');
    this.configPath = path.join(configDir, 'auth.json');
    
    this.initializeAuth();
  }
  
  private initializeAuth() {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Load or create auth config
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(data);
        log.info('Auth config loaded');
      } else {
        this.generateNewToken();
      }
    } catch (error) {
      log.error({ error }, 'Failed to initialize auth');
      this.generateNewToken();
    }
  }
  
  private generateNewToken() {
    const token = crypto.randomBytes(32).toString('hex');
    this.config = {
      token,
      createdAt: new Date(),
      lastUsed: new Date()
    };
    
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      log.info('New auth token generated');
    } catch (error) {
      log.error({ error }, 'Failed to save auth config');
    }
  }
  
  getToken(): string | null {
    return this.config?.token || null;
  }
  
  validateToken(token: string): boolean {
    if (!this.config) return false;
    
    const isValid = token === this.config.token;
    
    if (isValid) {
      // Update last used timestamp
      this.config.lastUsed = new Date();
      this.saveConfig();
    }
    
    return isValid;
  }
  
  generateCsrfToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    this.csrfTokens.set(sessionId, { token, expires });
    
    // Clean up expired tokens
    this.cleanupCsrfTokens();
    
    return token;
  }
  
  validateCsrfToken(sessionId: string, token: string): boolean {
    const stored = this.csrfTokens.get(sessionId);
    
    if (!stored) return false;
    if (stored.expires < new Date()) {
      this.csrfTokens.delete(sessionId);
      return false;
    }
    
    return stored.token === token;
  }
  
  private cleanupCsrfTokens() {
    const now = new Date();
    for (const [sessionId, data] of this.csrfTokens.entries()) {
      if (data.expires < now) {
        this.csrfTokens.delete(sessionId);
      }
    }
  }
  
  private saveConfig() {
    try {
      if (this.config) {
        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      }
    } catch (error) {
      log.error({ error }, 'Failed to save auth config');
    }
  }
  
  rotateToken(): string {
    this.generateNewToken();
    return this.config?.token || '';
  }
}

// Singleton instance
const authService = new AuthService();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      authenticated?: boolean;
    }
  }
}

// Auth middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for health check and CSRF token endpoint
  if (req.path === '/health' || req.path === '/api/v1/auth/csrf') {
    return next();
  }
  
  // Skip auth in development mode for easier testing
  if (process.env.NODE_ENV === 'development') {
    req.authenticated = true;
    return next();
  }
  
  // Check if request is from localhost only
  const remoteAddress = req.socket.remoteAddress;
  if (remoteAddress !== '127.0.0.1' && remoteAddress !== '::1' && remoteAddress !== '::ffff:127.0.0.1') {
    log.warn({ remoteAddress }, 'Request from non-localhost address blocked');
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
  }
  
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing auth token' });
  }
  
  const token = authHeader.substring(7);
  
  if (!authService.validateToken(token)) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid auth token' });
  }
  
  // Generate session ID if not present
  if (!req.sessionId) {
    req.sessionId = crypto.randomBytes(16).toString('hex');
  }
  
  req.authenticated = true;
  next();
};

// CSRF middleware
export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests and auth endpoints
  if (req.method === 'GET' || req.path === '/api/v1/auth/csrf') {
    return next();
  }
  
  const sessionId = req.sessionId || req.headers['x-session-id'] as string;
  const csrfToken = req.headers['x-csrf-token'] as string;
  
  if (!sessionId || !csrfToken) {
    return res.status(403).json({ error: 'Forbidden', message: 'Missing CSRF token' });
  }
  
  if (!authService.validateCsrfToken(sessionId, csrfToken)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Invalid CSRF token' });
  }
  
  next();
};

// Auth endpoints
export const authRoutes = {
  getCsrfToken: (req: Request, res: Response) => {
    const sessionId = req.sessionId || crypto.randomBytes(16).toString('hex');
    const token = authService.generateCsrfToken(sessionId);
    
    res.json({
      token,
      sessionId,
      expiresIn: 86400 // 24 hours in seconds
    });
  },
  
  getAuthInfo: (_req: Request, res: Response) => {
    const token = authService.getToken();
    
    if (!token) {
      res.status(500).json({ error: 'Internal error', message: 'Auth not initialized' });
      return;
    }
    
    res.json({
      message: 'Add this token to your API requests',
      header: 'Authorization',
      format: 'Bearer <token>',
      token: process.env.NODE_ENV === 'development' ? token : '[hidden in production]'
    });
  },
  
  rotateToken: (_req: Request, res: Response) => {
    const newToken = authService.rotateToken();
    
    res.json({
      message: 'Token rotated successfully',
      token: process.env.NODE_ENV === 'development' ? newToken : '[hidden in production]'
    });
  }
};

export { authService };