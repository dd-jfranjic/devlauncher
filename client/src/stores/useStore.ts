import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Project {
  id: string;
  name: string;
  slug: string;
  type: 'blank' | 'nextjs' | 'wordpress';
  location: 'windows' | 'wsl';
  status: 'stopped' | 'running' | 'error';
  paths: {
    wsl?: string;
    windows?: string;
    unc?: string;
  };
  ports: Record<string, number>;
  dockerProject: string;
  claudeCli?: {
    installed: boolean;
    version?: string;
  };
  geminiCli?: {
    installed: boolean;
    version?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  projectsRootWSL: string;
  projectsRootWindows: string;
  defaultLocation: 'wsl' | 'windows';
  editorMode: 'system' | 'code' | 'cursor' | 'custom';
  terminalProfile: string;
  portsBase: Record<string, number>;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface AppState {
  // Projects
  projects: Project[];
  selectedProjectId: string | null;
  isLoadingProjects: boolean;
  
  // Settings
  settings: Settings;
  
  // UI State
  sidebarCollapsed: boolean;
  activeTab: string;
  toasts: Toast[];
  modals: {
    newProject: boolean;
    settings: boolean;
    deleteProject: boolean;
  };
  
  // Actions
  setProjects: (projects: Project[]) => void;
  selectProject: (id: string | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  setSettings: (settings: Partial<Settings>) => void;
  
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  openModal: (modal: keyof AppState['modals']) => void;
  closeModal: (modal: keyof AppState['modals']) => void;
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        projects: [],
        selectedProjectId: null,
        isLoadingProjects: false,
        
        settings: {
          projectsRootWSL: '/home/jfranjic/dev-projects',
          projectsRootWindows: 'C:\\Users\\jfran\\Documents\\dev-projects',
          defaultLocation: 'wsl',
          editorMode: 'code',
          terminalProfile: 'PowerShell 7',
          portsBase: {
            nextjs: 3000,
            wordpress: 9080,
            phpmyadmin: 9081,
            mailpit_ui: 9025,
            smtp: 9125,
            db: 9306
          }
        },
        
        sidebarCollapsed: false,
        activeTab: 'overview',
        toasts: [],
        modals: {
          newProject: false,
          settings: false,
          deleteProject: false
        },
        
        // Actions
        setProjects: (projects) => set({ projects }),
        
        selectProject: (id) => set({ selectedProjectId: id, activeTab: 'overview' }),
        
        updateProject: (id, updates) => set((state) => ({
          projects: state.projects.map((p) => 
            p.id === id ? { ...p, ...updates } : p
          )
        })),
        
        deleteProject: (id) => set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId
        })),
        
        setSettings: (settings) => set((state) => ({
          settings: { ...state.settings, ...settings }
        })),
        
        toggleSidebar: () => set((state) => ({ 
          sidebarCollapsed: !state.sidebarCollapsed 
        })),
        
        setActiveTab: (tab) => set({ activeTab: tab }),
        
        showToast: (toast) => {
          const id = Date.now().toString();
          const newToast = { ...toast, id };
          
          set((state) => ({ toasts: [...state.toasts, newToast] }));
          
          // Auto-remove after duration
          if (toast.duration !== 0) {
            setTimeout(() => {
              set((state) => ({ 
                toasts: state.toasts.filter((t) => t.id !== id) 
              }));
            }, toast.duration || 4000);
          }
        },
        
        removeToast: (id) => set((state) => ({ 
          toasts: state.toasts.filter((t) => t.id !== id) 
        })),
        
        openModal: (modal) => set((state) => ({
          modals: { ...state.modals, [modal]: true }
        })),
        
        closeModal: (modal) => set((state) => ({
          modals: { ...state.modals, [modal]: false }
        }))
      }),
      {
        name: 'dev-launcher-storage',
        partialize: (state) => ({
          settings: state.settings,
          sidebarCollapsed: state.sidebarCollapsed
        })
      }
    )
  )
);