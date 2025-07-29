console.log('=== PRELOAD SCRIPT STARTING ===');

const { contextBridge, ipcRenderer } = require('electron');

console.log('contextBridge:', !!contextBridge);
console.log('ipcRenderer:', !!ipcRenderer);

const electronAPI = {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProject: (project) => ipcRenderer.invoke('save-project', project),
  runCommand: (command, args, cwd) => 
    ipcRenderer.invoke('run-command', command, args, cwd),
  openInVSCode: (path) => ipcRenderer.invoke('open-in-vscode', path),
  openInBrowser: (url) => ipcRenderer.invoke('open-in-browser', url),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  copyTemplate: (templateType, targetPath, projectData) => 
    ipcRenderer.invoke('copy-template', templateType, targetPath, projectData),
  deleteProject: (projectId, projectPath) => 
    ipcRenderer.invoke('delete-project', projectId, projectPath),
  copyMcpScript: (projectPath, wpUrl, publicPath) =>
    ipcRenderer.invoke('copy-mcp-script', projectPath, wpUrl, publicPath),
  getWpCredentials: (projectPath) =>
    ipcRenderer.invoke('get-wp-credentials', projectPath),
  writePsScript: (scriptPath, scriptContent) =>
    ipcRenderer.invoke('write-ps-script', scriptPath, scriptContent),
};

console.log('electronAPI object created:', electronAPI);

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('=== PRELOAD SCRIPT COMPLETED ===');
} catch (error) {
  console.error('Error exposing electronAPI:', error);
}