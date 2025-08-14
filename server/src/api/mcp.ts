import { Router, Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import { HttpError } from '../middleware/error-handler';
import { PrismaClient } from '@prisma/client';
import { McpInstaller } from '../utils/mcp-installer';

const prisma = new PrismaClient();

const router = Router({ mergeParams: true });
const logger = createLogger('api:mcp');

// GET /projects/:slug/mcp/servers - Get available MCP servers
router.get('/servers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    
    // Get project to check if it has Claude CLI
    const project = await prisma.project.findUnique({
      where: { slug }
    });
    
    if (!project) {
      throw new HttpError('Project not found', 404);
    }
    
    // Load MCP servers configuration
    const fs = require('fs').promises;
    const path = require('path');
    const configPath = path.join(__dirname, '../../src/config/mcp-servers.json');
    
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      // Check which servers are installed if Claude CLI is available
      let installedServers: string[] = [];
      if (project.location === 'wsl') {
        const paths = JSON.parse(project.paths);
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
          // Run claude mcp list to get installed servers
          const listCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd ${paths.wsl || paths.host} && claude mcp list 2>/dev/null"`;
          const { stdout } = await execAsync(listCommand, { timeout: 5000 });
          
          logger.info(`Claude MCP list raw output: "${stdout}"`);
          
          // Parse the output to get server names
          if (stdout) {
            const lines = stdout.toString().trim().split('\n');
            logger.info(`Lines found: ${lines.length}, first line: "${lines[0]}"`);
            
            installedServers = lines
              .filter(line => line && line.includes(':'))
              .map(line => {
                const serverName = line.split(':')[0].trim();
                logger.info(`Processing server: "${serverName}"`);
                // Map back to our server IDs
                if (serverName === 'playwright') return 'playwright-mcp';
                if (serverName === 'semgrep') return 'semgrep-mcp';
                return serverName + '-mcp'; // Add -mcp suffix for others
              });
            
            logger.info(`Detected installed servers: [${installedServers.join(', ')}]`);
          } else {
            logger.info('No stdout from claude mcp list');
          }
        } catch (error) {
          logger.warn('Could not check installed MCP servers:', error);
        }
      }
      
      // Mark installed servers in the response
      const serversWithStatus = config.servers.map((server: any) => ({
        ...server,
        installed: installedServers.includes(server.id)
      }));
      
      res.json({
        servers: serversWithStatus
      });
    } catch (error) {
      // If config file doesn't exist, return empty array
      res.json({
        servers: []
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /projects/:slug/mcp/install - Install MCP server
router.post('/install', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { serverId, apiToken } = req.body;
    
    const project = await prisma.project.findUnique({
      where: { slug }
    });
    
    if (!project) {
      throw new HttpError('Project not found', 404);
    }
    
    // Load MCP servers configuration to get install command
    const fs = require('fs').promises;
    const path = require('path');
    const configPath = path.join(__dirname, '../../src/config/mcp-servers.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    const server = config.servers.find((s: any) => s.id === serverId);
    
    if (!server) {
      throw new HttpError('MCP server not found', 404);
    }
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    logger.info(`Installing MCP server ${serverId} for project ${slug}`);
    
    // Install based on project location
    const paths = JSON.parse(project.paths);
    
    if (project.location === 'wsl') {
      // Use the MCP installer for WSL
      try {
        await McpInstaller.installForWSL(server, paths.wsl || paths.host, apiToken);
        logger.info(`MCP server ${serverId} installed and configured successfully`);
        
        // Test the installation
        const isWorking = await McpInstaller.testMCPServer(serverId, paths.wsl || paths.host);
        
        res.json({
          success: true,
          serverId,
          configured: true,
          tested: isWorking,
          message: `${server.name} installed and configured for Claude CLI`
        });
      } catch (installError: any) {
        logger.error(`Failed to install MCP server ${serverId}:`, installError);
        throw new HttpError(`Failed to install MCP server: ${installError.message}`, 500);
      }
    } else {
      // For Windows projects (not yet implemented)
      throw new HttpError('Windows MCP installation not yet implemented', 501);
    }
  } catch (error) {
    next(error);
  }
});

// POST /projects/:slug/mcp/configure - Configure MCP server for Claude CLI
router.post('/configure', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { serverId, config } = req.body;
    
    const project = await prisma.project.findUnique({
      where: { slug }
    });
    
    if (!project) {
      throw new HttpError('Project not found', 404);
    }
    
    const paths = JSON.parse(project.paths);
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Create Claude config directory if it doesn't exist
    let configPath: string;
    let createConfigCommand: string;
    
    if (project.location === 'wsl') {
      configPath = `${paths.wsl}/.claude/mcp.json`;
      createConfigCommand = `wsl.exe -d Ubuntu -u jfranjic bash -c "mkdir -p ${paths.wsl}/.claude && echo '${JSON.stringify(config)}' > ${configPath}"`;
    } else {
      configPath = `${paths.host}\\.claude\\mcp.json`;
      createConfigCommand = `powershell -Command "New-Item -ItemType Directory -Force -Path '${paths.host}\\.claude'; Set-Content -Path '${configPath}' -Value '${JSON.stringify(config)}'"`;
    }
    
    await execAsync(createConfigCommand);
    logger.info(`MCP server ${serverId} configured for project ${slug}`);
    
    res.json({
      success: true,
      serverId,
      configPath
    });
  } catch (error) {
    next(error);
  }
});

// POST /projects/:slug/mcp/test - Test MCP server connection
router.post('/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { serverId } = req.body;
    
    const project = await prisma.project.findUnique({
      where: { slug }
    });
    
    if (!project) {
      throw new HttpError('Project not found', 404);
    }
    
    const paths = JSON.parse(project.paths);
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Test MCP server using Claude CLI
    let testCommand: string;
    if (project.location === 'wsl') {
      testCommand = `wsl.exe -d Ubuntu -u jfranjic --cd "${paths.wsl}" bash -l -c "claude mcp test ${serverId}"`;
    } else {
      testCommand = `cd "${paths.host}" && claude mcp test ${serverId}`;
    }
    
    try {
      const { stdout, stderr } = await execAsync(testCommand, { timeout: 10000 }); // 10 second timeout
      
      res.json({
        success: true,
        serverId,
        output: stdout,
        status: 'active'
      });
    } catch (testError: any) {
      res.json({
        success: false,
        serverId,
        output: testError.message,
        status: 'error'
      });
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /projects/:slug/mcp/remove - Remove MCP server
router.delete('/remove/:serverId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, serverId } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { slug }
    });
    
    if (!project) {
      throw new HttpError('Project not found', 404);
    }
    
    if (project.location === 'wsl') {
      const paths = JSON.parse(project.paths);
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Get the server name without -mcp suffix for claude command
      const serverName = serverId.replace('-mcp', '');
      
      try {
        // Use claude mcp remove command
        const removeCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "cd ${paths.wsl || paths.host} && claude mcp remove ${serverName}"`;
        logger.info(`Running remove command: ${removeCommand}`);
        
        const { stdout, stderr } = await execAsync(removeCommand, { timeout: 10000 });
        
        if (stdout) logger.info(`Remove output: ${stdout}`);
        if (stderr) logger.warn(`Remove warnings: ${stderr}`);
        
        // Also uninstall the npm package if it's a Node.js based MCP
        const fs = require('fs').promises;
        const path = require('path');
        const configPath = path.join(__dirname, '../../src/config/mcp-servers.json');
        const configData = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);
        const server = config.servers.find((s: any) => s.id === serverId);
        
        // For npx-based servers, no uninstall needed
        if (server && server.configTemplate?.command === 'npx') {
          logger.info(`${serverId} uses npx - no package to uninstall`);
        } else if (server && server.installCommand.includes('npm install -g')) {
          // Only uninstall if it was globally installed (not npx)
          const packageName = server.installCommand.replace('npm install -g ', '');
          const uninstallCommand = `wsl.exe -d Ubuntu -u jfranjic bash -l -c "npm uninstall -g ${packageName}"`;
          logger.info(`Uninstalling npm package: ${packageName}`);
          
          try {
            await execAsync(uninstallCommand, { timeout: 30000 });
            logger.info(`Package ${packageName} uninstalled`);
          } catch (uninstallError) {
            logger.warn(`Could not uninstall package: ${uninstallError}`);
          }
        }
        
        logger.info(`MCP server ${serverId} removed successfully`);
        
        res.json({
          success: true,
          serverId,
          message: `${serverName} removed successfully`
        });
      } catch (error: any) {
        logger.error(`Failed to remove MCP server ${serverId}:`, error);
        throw new HttpError(`Failed to remove MCP server: ${error.message}`, 500);
      }
    } else {
      throw new HttpError('Windows MCP removal not yet implemented', 501);
    }
  } catch (error) {
    next(error);
  }
});

export default router;