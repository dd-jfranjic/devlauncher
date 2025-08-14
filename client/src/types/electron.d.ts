interface ElectronAPI {
  getVersion: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  openPath: (path: string) => Promise<void>;
  execute: (command: string, args: string[]) => Promise<any>;
  send: (channel: string, data: any) => void;
  on: (channel: string, func: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
  onMenuAction?: (callback: (action: string) => void) => void;
  
  // Additional APIs that the app expects
  cmd?: {
    claude: (args?: string) => Promise<any>;
    terminal: () => Promise<any>;
  };
  
  fs?: {
    selectFolder: () => Promise<string | null>;
  };
}

interface SystemAPI {
  platform: string;
  arch: string;
  version: string;
  env: {
    NODE_ENV: string;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
  systemAPI?: SystemAPI;
}