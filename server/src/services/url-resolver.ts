import { logger } from '../utils/logger';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import net from 'net';
import os from 'os';

const log = logger.child({ component: 'UrlResolver' });

interface UrlTestResult {
  url: string;
  ok: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
}

interface ResolverResult {
  matrix: UrlTestResult[];
  baseUrl: string | null;
  tested: Date;
}

export class UrlResolverService {
  private readonly timeout = 2000; // 2 seconds timeout per URL
  
  async resolveProjectUrls(
    projectSlug: string,
    port: number,
    template: string
  ): Promise<ResolverResult> {
    log.info({ projectSlug, port, template }, 'Resolving URLs for project');
    
    const candidates = this.generateCandidates(port);
    const healthEndpoint = this.getHealthEndpoint(template);
    const matrix: UrlTestResult[] = [];
    let baseUrl: string | null = null;
    
    // Test each candidate URL
    for (const candidate of candidates) {
      const testUrl = `${candidate}${healthEndpoint}`;
      const result = await this.testUrl(testUrl);
      
      matrix.push({
        url: candidate,
        ...result
      });
      
      // Use first successful URL as base
      if (result.ok && !baseUrl) {
        baseUrl = candidate;
      }
    }
    
    return {
      matrix,
      baseUrl,
      tested: new Date()
    };
  }
  
  private generateCandidates(port: number): string[] {
    const candidates = [
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`,
      `http://host.docker.internal:${port}`
    ];
    
    // Add WSL IP if available
    const wslIp = this.getWslIp();
    if (wslIp) {
      candidates.push(`http://${wslIp}:${port}`);
    }
    
    return candidates;
  }
  
  private getHealthEndpoint(template: string): string {
    switch (template) {
      case 'wordpress':
        return '/wp-json';
      case 'nextjs':
        return '/api/health';
      default:
        return '/';
    }
  }
  
  private async testUrl(url: string): Promise<Omit<UrlTestResult, 'url'>> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: 'GET',
        timeout: this.timeout,
        headers: {
          'User-Agent': 'DevLauncher/1.0'
        }
      };
      
      const req = client.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        
        // Consider 2xx and 3xx as success
        const ok = res.statusCode !== undefined && 
                  res.statusCode >= 200 && 
                  res.statusCode < 400;
        
        resolve({
          ok,
          statusCode: res.statusCode,
          responseTime
        });
        
        // Consume response data to free up memory
        res.resume();
      });
      
      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          ok: false,
          responseTime,
          error: error.message
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          ok: false,
          responseTime: this.timeout,
          error: 'Timeout'
        });
      });
      
      req.end();
    });
  }
  
  private getWslIp(): string | null {
    try {
      const interfaces = os.networkInterfaces();
      
      // Look for WSL adapter (usually named 'vEthernet (WSL)')
      for (const [name, addresses] of Object.entries(interfaces)) {
        if (name.toLowerCase().includes('wsl') && addresses) {
          for (const addr of addresses) {
            if (addr.family === 'IPv4' && !addr.internal) {
              return addr.address;
            }
          }
        }
      }
      
      // Fallback: look for 172.x.x.x addresses (common WSL range)
      for (const addresses of Object.values(interfaces)) {
        if (addresses) {
          for (const addr of addresses) {
            if (addr.family === 'IPv4' && 
                !addr.internal && 
                addr.address.startsWith('172.')) {
              return addr.address;
            }
          }
        }
      }
    } catch (error) {
      log.warn({ error }, 'Failed to get WSL IP');
    }
    
    return null;
  }
  
  async checkPortAvailability(port: number, host = '127.0.0.1'): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(true);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port, host);
    });
  }
  
  async findAvailablePort(
    startPort: number,
    maxPort: number = startPort + 100
  ): Promise<number | null> {
    for (let port = startPort; port <= maxPort; port++) {
      if (await this.checkPortAvailability(port)) {
        return port;
      }
    }
    return null;
  }
}

export const urlResolverService = new UrlResolverService();