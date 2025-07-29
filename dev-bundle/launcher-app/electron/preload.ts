import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProject: (project: any) => ipcRenderer.invoke('save-project', project),
  runCommand: (command: string, args: string[], cwd?: string) => 
    ipcRenderer.invoke('run-command', command, args, cwd),
  openInVSCode: (path: string) => ipcRenderer.invoke('open-in-vscode', path),
  openInBrowser: (url: string) => ipcRenderer.invoke('open-in-browser', url),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
})