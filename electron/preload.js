const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script is loading...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),
  
  // Shell operations
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),
  execute: (command, args) => ipcRenderer.invoke('shell:execute', command, args),
  
  // IPC communication
  send: (channel, data) => {
    const validChannels = ['menu-new-project', 'menu-settings'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  on: (channel, func) => {
    const validChannels = ['menu-new-project', 'menu-settings'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Menu action handler
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => {
      callback(action);
    });
  }
});

// System info
contextBridge.exposeInMainWorld('systemAPI', {
  platform: process.platform,
  arch: process.arch,
  version: process.version,
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production'
  }
});