import { Router } from 'express';
import { projectRouter } from './projects';
import { importRouter } from './projects-import';
import { taskRouter } from './tasks';
import { portRouter } from './ports';
import { settingsRouter } from './settings';
import { auditRouter } from './audit';
import { templateRouter } from './templates';
import { systemRouter } from './system';
import { dockerRouter } from './docker';
import { installWordPressMcpPlugin, configureWordPressMcp, removeWordPressMcp } from './wordpress-mcp';

export const apiRouter = Router();

// API version and info
apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'Dev Launcher API',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      projects: '/api/projects',
      tasks: '/api/tasks',
      ports: '/api/ports',
      settings: '/api/settings',
      audit: '/api/audit',
      templates: '/api/templates'
    }
  });
});

// Route handlers
apiRouter.use('/projects', projectRouter);
apiRouter.use('/projects', importRouter);  // Add import routes to /projects path
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/ports', portRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/audit', auditRouter);
apiRouter.use('/templates', templateRouter);
apiRouter.use('/system', systemRouter);
apiRouter.use('/', dockerRouter);

// WordPress MCP routes
apiRouter.post('/wordpress-mcp/install', installWordPressMcpPlugin);
apiRouter.post('/wordpress-mcp/configure', configureWordPressMcp);
apiRouter.delete('/wordpress-mcp/:projectSlug', removeWordPressMcp);