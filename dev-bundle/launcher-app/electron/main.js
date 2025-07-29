const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const Store = require('electron-store');

const store = new Store();
let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev') || !require('fs').existsSync(require('path').join(__dirname, '../dist/index.html'));

async function waitForServer(url, maxAttempts = 30) {
  const http = require('http');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        http.get(url, (res) => {
          if (res.statusCode === 200) resolve();
          else reject();
        }).on('error', reject);
      });
      return true;
    } catch (e) {
      console.log(`Waiting for Vite server... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('=== ELECTRON MAIN ===');
  console.log('__dirname:', __dirname);
  console.log('Preload path:', preloadPath);
  console.log('Preload exists:', require('fs').existsSync(preloadPath));
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,  // This allows preload script to work properly
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  if (isDev) {
    const serverReady = await waitForServer('http://localhost:5173');
    if (serverReady) {
      await mainWindow.loadURL('http://localhost:5173');
    } else {
      console.error('Vite server not responding. Loading fallback...');
      mainWindow.loadURL('data:text/html,<h1>Vite server not running. Please start it manually with: npm run dev</h1>');
    }
    
    // Wait for page to load before opening devtools
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.openDevTools();
    });
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading production build from:', indexPath);
    mainWindow.loadFile(indexPath);
    
    // Open DevTools in production for debugging
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.openDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-projects', async () => {
  console.log('=== GET PROJECTS CALLED ===');
  console.log('Store path:', store.path);
  let projects = store.get('projects', []);
  console.log('Projects found:', projects.length);
  console.log('Projects:', JSON.stringify(projects, null, 2));
  
  // If no projects found, check for existing mol-apt project
  if (projects.length === 0) {
    const molAptPath = 'C:\\Users\\jfran\\Documents\\dev\\mol-apt';
    const dockerComposePath = path.join(molAptPath, 'docker-compose.yml');
    
    if (require('fs').existsSync(dockerComposePath)) {
      console.log('Found mol-apt project, adding to store...');
      const molAptProject = {
        id: "1737815400000",
        name: "mol-apt",
        path: molAptPath,
        type: "wordpress",
        createdAt: "2025-01-25T15:30:00.000Z",
        mcpEnabled: false,
        wordpressMcpEnabled: false,
        contextEngineeringEnabled: false,
        pocketFlowEnabled: false,
        prpsEnabled: false,
        status: "active",
        wpPort: 14917,
        wpHttpsPort: 15360,
        dbPort: 13309,
        pmaPort: 12785,
        mailPort: 14806,
        smtpPort: 10618
      };
      projects = [molAptProject];
      store.set('projects', projects);
    }
  }
  
  // Check Docker status for each project
  for (const project of projects) {
    if (project.type === 'wordpress' || project.type === 'nextjs-fullstack') {
      try {
        // Check if containers are actually RUNNING (not just existing)
        const result = await new Promise((resolve) => {
          // First try docker-compose ps to check container status
          exec(`docker-compose ps --format json`, 
            { cwd: project.path }, 
            (error, stdout) => {
              if (error) {
                // Fallback to docker ps if docker-compose fails
                const projectName = path.basename(project.path);
                exec(`docker ps --filter "label=com.docker.compose.project=${projectName}" --format "{{.Names}}"`,
                  (dockerError, dockerStdout) => {
                    if (dockerError) {
                      // console.log(`Error checking ${project.name}:`, dockerError.message);
                      resolve(false);
                    } else {
                      const runningContainers = dockerStdout.trim().split('\n').filter(s => s);
                      // console.log(`Project ${project.name} running containers:`, runningContainers);
                      resolve(runningContainers.length > 0);
                    }
                  }
                );
              } else {
                try {
                  // Parse JSON output to check if containers are running
                  const containers = stdout.trim().split('\n')
                    .filter(line => line)
                    .map(line => {
                      try {
                        return JSON.parse(line);
                      } catch (e) {
                        return null;
                      }
                    })
                    .filter(c => c);
                  
                  const running = containers.filter(c => c.State === 'running');
                  // console.log(`Project ${project.name}: ${running.length}/${containers.length} containers running`);
                  resolve(running.length > 0);
                } catch (e) {
                  // console.log(`Error parsing docker-compose output for ${project.name}:`, e);
                  resolve(false);
                }
              }
            }
          );
        });
        
        project.status = result ? 'active' : 'stopped';
      } catch (e) {
        project.status = 'stopped';
      }
    }
  }
  
  // Update store with real status
  store.set('projects', projects);
  return projects;
});

ipcMain.handle('save-project', async (_, project) => {
  const projects = store.get('projects', []);
  projects.push(project);
  store.set('projects', projects);
  return { success: true };
});

ipcMain.handle('run-command', async (_, command, args, cwd) => {
  console.log('=== RUN COMMAND ===');
  console.log('Command:', command);
  console.log('Args:', args);
  console.log('CWD:', cwd);
  
  return new Promise((resolve, reject) => {
    try {
      // Special handling for PowerShell with -NoExit to open new window
      if (command === 'powershell' && args && args[0] === '-NoExit') {
        const psCommand = args.slice(1).join(' ');
        const startArgs = ['powershell.exe', '-NoExit'].concat(args.slice(1));
        
        const proc = spawn('start', startArgs, {
          cwd: cwd || process.cwd(),
          shell: true,
          env: { ...process.env },
          windowsHide: false,
          detached: true,
          stdio: 'ignore'
        });
        
        proc.unref();
        resolve({ success: true, output: 'PowerShell window opened' });
        return;
      }
      
      // Regular command execution
      const proc = spawn(command, args, {
        cwd: cwd || process.cwd(),
        shell: true,
        env: { ...process.env },
        windowsHide: true,
      });

      let output = '';
      let error = '';

      if (proc.stdout) {
        proc.stdout.on('data', (data) => {
          output += data.toString();
        });
      }

      if (proc.stderr) {
        proc.stderr.on('data', (data) => {
          error += data.toString();
        });
      }

      proc.on('error', (err) => {
        console.error('Process error:', err);
        reject({ success: false, error: err.message, code: -1 });
      });

      proc.on('close', (code) => {
        console.log('Process closed with code:', code);
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          reject({ success: false, error: error || 'Command failed', code });
        }
      });
    } catch (err) {
      console.error('Spawn error:', err);
      reject({ success: false, error: err.message, code: -1 });
    }
  });
});

ipcMain.handle('open-in-vscode', async (_, filePath) => {
  shell.openExternal(`vscode://file/${filePath}`);
});

ipcMain.handle('open-in-browser', async (_, url) => {
  shell.openExternal(url);
});

ipcMain.handle('select-directory', async () => {
  console.log('=== SELECT DIRECTORY CALLED ===');
  console.log('Main window exists:', !!mainWindow);
  
  try {
    if (!mainWindow) {
      console.error('Main window is null!');
      return null;
    }
    
    console.log('Opening dialog...');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Project Location',
      buttonLabel: 'Select Folder',
      defaultPath: 'C:\\Users'
    });
    
    console.log('Dialog result:', result);
    
    if (!result.canceled && result.filePaths.length > 0) {
      console.log('Selected directory:', result.filePaths[0]);
      return result.filePaths[0];
    } else {
      console.log('Dialog was cancelled');
      return null;
    }
  } catch (error) {
    console.error('Error in select-directory:', error);
    console.error('Stack trace:', error.stack);
    return null;
  }
});

// Copy template files
ipcMain.handle('copy-template', async (_, templateType, targetPath, projectData) => {
  console.log('=== COPY TEMPLATE ===');
  console.log('Template:', templateType);
  console.log('Target:', targetPath);
  
  try {
    const templatePath = path.join(__dirname, '../../templates', templateType);
    console.log('Template path:', templatePath);
    
    // Check if template exists
    const templateExists = await fs.access(templatePath).then(() => true).catch(() => false);
    if (!templateExists) {
      throw new Error(`Template ${templateType} not found at ${templatePath}`);
    }
    
    // Copy template files
    await copyDirectory(templatePath, targetPath, projectData);
    
    // If PRPs enabled, copy PRPs template too
    if (projectData.prpsEnabled && projectData.prpsTemplate) {
      const prpsPath = path.join(__dirname, '../../templates/PRPs', projectData.prpsTemplate);
      const prpsExists = await fs.access(prpsPath).then(() => true).catch(() => false);
      if (prpsExists) {
        await copyDirectory(prpsPath, targetPath, projectData);
      }
    }
    
    return { 
      success: true, 
      ports: {
        wpPort: projectData.wpPort,
        wpHttpsPort: projectData.wpHttpsPort,
        dbPort: projectData.dbPort,
        pmaPort: projectData.pmaPort,
        mailPort: projectData.mailPort,
        smtpPort: projectData.smtpPort,
        backendPort: projectData.backendPort,
        redisPort: projectData.redisPort,
        browserPort: projectData.browserPort
      }
    };
  } catch (error) {
    console.error('Error copying template:', error);
    return { success: false, error: error.message };
  }
});

// Helper function to copy directory recursively
async function copyDirectory(src, dest, projectData) {
  // Generate ports BEFORE processing templates
  if (projectData.type === 'wordpress' && src.endsWith('wordpress')) {
    console.log('Creating LocalWP directory structure...');
    
    // Generate random ports (LocalWP style) if not already set
    if (!projectData.wpPort) {
      projectData.wpPort = 10000 + Math.floor(Math.random() * 5000);
      projectData.wpHttpsPort = projectData.wpPort + 443;
      projectData.dbPort = 10000 + Math.floor(Math.random() * 5000);
      projectData.pmaPort = 10000 + Math.floor(Math.random() * 5000);
      projectData.mailPort = 10000 + Math.floor(Math.random() * 5000);
      projectData.smtpPort = 10000 + Math.floor(Math.random() * 5000);
    }
    
    // Create the essential directories
    await fs.mkdir(path.join(dest, 'app'), { recursive: true });
    await fs.mkdir(path.join(dest, 'app', 'public'), { recursive: true });
    await fs.mkdir(path.join(dest, 'app', 'sql'), { recursive: true });
    await fs.mkdir(path.join(dest, 'app', 'mailpit'), { recursive: true });
    await fs.mkdir(path.join(dest, 'conf'), { recursive: true });
    await fs.mkdir(path.join(dest, 'conf', 'nginx'), { recursive: true });
    await fs.mkdir(path.join(dest, 'conf', 'php'), { recursive: true });
    await fs.mkdir(path.join(dest, 'conf', 'mysql'), { recursive: true });
    await fs.mkdir(path.join(dest, 'logs'), { recursive: true });
    await fs.mkdir(path.join(dest, 'logs', 'nginx'), { recursive: true });
    await fs.mkdir(path.join(dest, 'logs', 'php'), { recursive: true });
    await fs.mkdir(path.join(dest, 'logs', 'mysql'), { recursive: true });
    await fs.mkdir(path.join(dest, 'certs'), { recursive: true });
  }
  
  // For Next.js Full Stack projects, generate necessary ports
  if (projectData.type === 'nextjs-fullstack' && src.endsWith('nextjs-fullstack')) {
    console.log('Setting up Next.js Full Stack project...');
    
    // Always generate ALL ports for Next.js Full Stack projects
    if (!projectData.wpPort) projectData.wpPort = 10000 + Math.floor(Math.random() * 5000); // Frontend port
    if (!projectData.wpHttpsPort) projectData.wpHttpsPort = projectData.wpPort + 443; // Not used but needed for template
    if (!projectData.backendPort) projectData.backendPort = 10000 + Math.floor(Math.random() * 5000);
    if (!projectData.dbPort) projectData.dbPort = 10000 + Math.floor(Math.random() * 5000);
    if (!projectData.pmaPort) projectData.pmaPort = 10000 + Math.floor(Math.random() * 5000);
    if (!projectData.mailPort) projectData.mailPort = 10000 + Math.floor(Math.random() * 5000);
    if (!projectData.smtpPort) projectData.smtpPort = 10000 + Math.floor(Math.random() * 5000);
    if (!projectData.redisPort) projectData.redisPort = 10000 + Math.floor(Math.random() * 5000);
    if (!projectData.browserPort) projectData.browserPort = 10000 + Math.floor(Math.random() * 5000);
    
    console.log('Next.js Full Stack ports generated:', {
      wpPort: projectData.wpPort,
      wpHttpsPort: projectData.wpHttpsPort,
      backendPort: projectData.backendPort,
      dbPort: projectData.dbPort,
      pmaPort: projectData.pmaPort,
      mailPort: projectData.mailPort,
      smtpPort: projectData.smtpPort,
      redisPort: projectData.redisPort,
      browserPort: projectData.browserPort
    });
    
    // Create the project directories
    await fs.mkdir(path.join(dest, 'frontend'), { recursive: true });
    await fs.mkdir(path.join(dest, 'backend'), { recursive: true });
  }
  
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath, projectData);
    } else {
      // Read file content
      let content = await fs.readFile(srcPath, 'utf8');
      
      // Check if file contains template variables
      const hasTemplateVars = content.includes('{{');
      
      if (hasTemplateVars || entry.name.endsWith('.template')) {
        // Process template files
        let finalPath = destPath;
        
        // Remove .template extension if present
        if (entry.name.endsWith('.template')) {
          finalPath = destPath.replace('.template', '');
        }
        
        // Replace all template variables
        content = content
          .replace(/{{PROJECT_NAME}}/g, projectData.name || 'project')
          .replace(/{{PROJECT_TYPE}}/g, projectData.type || 'unknown')
          .replace(/{{PROJECT_PATH}}/g, projectData.path ? projectData.path.replace(/\\/g, '\\\\') : '')
          .replace(/{{CREATED_DATE}}/g, new Date().toISOString())
          .replace(/{{WP_PORT}}/g, String(projectData.wpPort || 8080))
          .replace(/{{WP_HTTPS_PORT}}/g, String(projectData.wpHttpsPort || 8443))
          .replace(/{{DB_PORT}}/g, String(projectData.dbPort || 3306))
          .replace(/{{PMA_PORT}}/g, String(projectData.pmaPort || 8081))
          .replace(/{{MAIL_PORT}}/g, String(projectData.mailPort || 8025))
          .replace(/{{SMTP_PORT}}/g, String(projectData.smtpPort || 1025))
          .replace(/{{BACKEND_PORT}}/g, String(projectData.backendPort || 3000))
          .replace(/{{REDIS_PORT}}/g, String(projectData.redisPort || 6379))
          .replace(/{{BROWSER_PORT}}/g, String(projectData.browserPort || 3333));
        
        await fs.writeFile(finalPath, content);
      } else if (entry.name !== 'nul') { // Skip weird 'nul' file
        // Copy as is
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// Delete project handler
ipcMain.handle('delete-project', async (_, projectId, projectPath) => {
  console.log('=== DELETE PROJECT ===');
  console.log('Project ID:', projectId);
  console.log('Project Path:', projectPath);
  
  try {
    // First, stop Docker containers if running
    console.log('Stopping Docker containers...');
    try {
      await new Promise((resolve, reject) => {
        const proc = spawn('docker-compose', ['down', '-v'], {
          cwd: projectPath,
          shell: true,
        });
        
        proc.on('close', (code) => {
          if (code === 0 || code === 1) { // 1 means no containers found, which is OK
            resolve();
          } else {
            reject(new Error(`Docker compose down failed with code ${code}`));
          }
        });
        
        proc.on('error', () => {
          // If docker-compose fails, continue anyway
          resolve();
        });
      });
    } catch (dockerError) {
      console.warn('Docker compose down failed:', dockerError);
      // Continue with deletion even if Docker fails
    }
    
    // Delete the project directory
    console.log('Deleting project directory...');
    await deleteDirectory(projectPath);
    
    // Remove from store
    const projects = store.get('projects', []);
    const updatedProjects = projects.filter(p => p.id !== projectId);
    store.set('projects', updatedProjects);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message };
  }
});

// Helper function to delete directory recursively
async function deleteDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Delete all files and subdirectories
    await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await deleteDirectory(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }));
    
    // Delete the directory itself
    await fs.rmdir(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Directory doesn't exist, that's OK
      return;
    }
    throw error;
  }
}

// Read WordPress credentials from wp-config.php
// Write PowerShell script handler
ipcMain.handle('write-ps-script', async (_, scriptPath, scriptContent) => {
  try {
    await fs.writeFile(scriptPath, scriptContent, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Failed to write PowerShell script:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-wp-credentials', async (_, projectPath) => {
  try {
    const wpConfigPath = path.join(projectPath, 'app', 'public', 'wp-config.php');
    const content = await fs.readFile(wpConfigPath, 'utf8');
    
    // Extract DB_USER (admin username)
    const userMatch = content.match(/define\s*\(\s*['"]DB_USER['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
    
    // Extract DB_PASSWORD (admin password)
    const passwordMatch = content.match(/define\s*\(\s*['"]DB_PASSWORD['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
    
    // If we can't find DB credentials, check for admin credentials in comments or custom defines
    // Some installations store admin credentials differently
    let adminUser = userMatch ? userMatch[1] : 'admin';
    let adminPassword = passwordMatch ? passwordMatch[1] : 'password';
    
    // Check for custom admin credentials in comments
    const adminUserComment = content.match(/\/\/\s*Admin\s*User:\s*(.+)/i);
    const adminPasswordComment = content.match(/\/\/\s*Admin\s*Password:\s*(.+)/i);
    
    if (adminUserComment) adminUser = adminUserComment[1].trim();
    if (adminPasswordComment) adminPassword = adminPasswordComment[1].trim();
    
    return { 
      success: true, 
      username: adminUser, 
      password: adminPassword 
    };
  } catch (error) {
    console.error('Error reading wp-config.php:', error);
    // Return default credentials if file not found
    return { 
      success: false, 
      username: 'admin', 
      password: 'password' 
    };
  }
});

// Copy MCP configuration script
ipcMain.handle('copy-mcp-script', async (_, projectPath, wpUrl, publicPath) => {
  try {
    const templatePath = path.join(__dirname, '../../templates/wordpress/configure-mcp-correct.ps1');
    const scriptPath = path.join(projectPath, 'configure-mcp.ps1');
    
    // Read template
    let content = await fs.readFile(templatePath, 'utf8');
    
    // Don't replace parameters - the script accepts them as arguments
    // Just copy the script as-is
    await fs.writeFile(scriptPath, content);
    
    return { success: true, scriptPath };
  } catch (error) {
    console.error('Error copying MCP script:', error);
    return { success: false, error: error.message };
  }
});