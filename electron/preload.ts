import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),
  
  // Shell operations
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
  execute: (command: string, args: string[]) => 
    ipcRenderer.invoke('shell:execute', command, args),
  
  // Menu events
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-new-project', () => callback('new-project'));
    ipcRenderer.on('menu-settings', () => callback('settings'));
  },
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  
  // Platform info
  platform: process.platform,
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux'
});

// Type definitions for TypeScript
export interface ElectronAPI {
  getVersion: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  openPath: (path: string) => Promise<void>;
  execute: (command: string, args: string[]) => Promise<{
    success: boolean;
    stdout?: string;
    stderr?: string;
    code?: number;
  }>;
  onMenuAction: (callback: (action: string) => void) => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  platform: NodeJS.Platform;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}