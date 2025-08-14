// Mock Electron API for development when running in browser
export const mockElectronAPI = {
  getVersion: async () => '0.1.0-dev',
  openExternal: async (url: string) => {
    window.open(url, '_blank');
  },
  openPath: async (path: string) => {
    console.log('Would open path:', path);
  },
  execute: async (command: string, args: string[]) => {
    console.log('Executing command:', command, args);
    
    // In browser development, we can't directly execute system commands
    // But we can make API calls to the backend to execute them
    try {
      const response = await fetch('http://127.0.0.1:9976/api/system/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, args })
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute command');
      }
      
      const result = await response.json();
      return { success: true, stdout: result.stdout || '', stderr: result.stderr || '' };
    } catch (error) {
      console.error('Failed to execute command:', error);
      // Fallback: try to open in a new window for some commands
      if (command.includes('wt.exe')) {
        console.log('Terminal command detected - cannot execute in browser');
      } else if (command === 'explorer.exe' && args[0]) {
        console.log('Would open folder:', args[0]);
      } else if (command === 'code' && args[0]) {
        console.log('Would open VS Code with:', args[0]);
      }
      return { success: false, stdout: '', stderr: 'Cannot execute system commands in browser' };
    }
  },
  send: (channel: string, data: any) => {
    console.log('IPC send:', channel, data);
  },
  on: (channel: string, func: (...args: any[]) => void) => {
    console.log('IPC listener registered:', channel);
  },
  removeAllListeners: (channel: string) => {
    console.log('Removed listeners for:', channel);
  },
  onMenuAction: (callback: (action: string) => void) => {
    console.log('Menu action listener registered');
    // In development, we could trigger this manually for testing
  },
  minimizeWindow: () => console.log('Minimize window'),
  maximizeWindow: () => console.log('Maximize window'),
  closeWindow: () => console.log('Close window'),
  platform: 'win32' as NodeJS.Platform,
  isWindows: true,
  isMac: false,
  isLinux: false,
  
  // Mock additional APIs
  cmd: {
    claude: async (args?: string) => {
      console.log('Claude command:', args);
      return { success: true };
    },
    terminal: async () => {
      console.log('Open terminal');
      return { success: true };
    }
  },
  
  fs: {
    selectFolder: async () => {
      console.log('Select folder dialog');
      return 'C:\\Users\\jfran\\Documents\\test-project';
    }
  }
};

// Auto-inject mock if no Electron API available
if (typeof window !== 'undefined' && !window.electronAPI) {
  (window as any).electronAPI = mockElectronAPI;
  console.log('Mock Electron API injected for development');
}