import React, { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import { getSettings, updateSettings } from '../lib/api';
import { 
  FolderIcon,
  CommandLineIcon,
  ServerIcon,
  CogIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const SettingsPage: React.FC = () => {
  const { settings: storeSettings, setSettings: setStoreSettings, showToast } = useStore();
  const [settings, setSettings] = useState(storeSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    const hasChanged = JSON.stringify(settings) !== JSON.stringify(storeSettings);
    setHasChanges(hasChanged);
  }, [settings, storeSettings]);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      setStoreSettings(data);
    } catch (error) {
      // Use store settings as fallback
      setSettings(storeSettings);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
      setStoreSettings(settings);
      showToast({
        type: 'success',
        message: 'Settings saved successfully'
      });
      setHasChanges(false);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to save settings'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(storeSettings);
    setHasChanges(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-neutral-400">Configure Dev Launcher preferences and defaults</p>
      </div>

      <div className="space-y-8">
        {/* Project Paths */}
        <section className="card">
          <div className="flex items-center gap-3 mb-4">
            <FolderIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium">Project Paths</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                WSL Projects Root
              </label>
              <input
                type="text"
                value={settings.projectsRootWSL}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  projectsRootWSL: e.target.value 
                }))}
                className="input font-mono"
                placeholder="/home/username/dev-projects"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Default location for projects created in WSL
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Windows Projects Root
              </label>
              <input
                type="text"
                value={settings.projectsRootWindows}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  projectsRootWindows: e.target.value 
                }))}
                className="input font-mono"
                placeholder="C:\Users\username\Documents\dev-projects"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Default location for projects created in Windows
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Location
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, defaultLocation: 'wsl' }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.defaultLocation === 'wsl' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <span className="text-sm font-medium">WSL</span>
                  <p className="text-xs text-neutral-500 mt-1">Recommended</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, defaultLocation: 'windows' }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.defaultLocation === 'windows' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <span className="text-sm font-medium">Windows</span>
                  <p className="text-xs text-neutral-500 mt-1">Direct access</p>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Editor & Terminal */}
        <section className="card">
          <div className="flex items-center gap-3 mb-4">
            <CommandLineIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium">Editor & Terminal</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Editor
              </label>
              <select
                value={settings.editorMode}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  editorMode: e.target.value as any
                }))}
                className="input"
              >
                <option value="system">System Default</option>
                <option value="code">Visual Studio Code</option>
                <option value="cursor">Cursor</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Terminal Profile
              </label>
              <input
                type="text"
                value={settings.terminalProfile}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  terminalProfile: e.target.value 
                }))}
                className="input"
                placeholder="PowerShell 7"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Windows Terminal profile name
              </p>
            </div>
          </div>
        </section>

        {/* Default Ports */}
        <section className="card">
          <div className="flex items-center gap-3 mb-4">
            <ServerIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium">Default Port Ranges</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Next.js Base Port
              </label>
              <input
                type="number"
                value={settings.portsBase.nextjs}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  portsBase: { ...prev.portsBase, nextjs: parseInt(e.target.value) }
                }))}
                className="input"
                min="1024"
                max="65535"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                WordPress Base Port
              </label>
              <input
                type="number"
                value={settings.portsBase.wordpress}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  portsBase: { ...prev.portsBase, wordpress: parseInt(e.target.value) }
                }))}
                className="input"
                min="1024"
                max="65535"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Database Base Port
              </label>
              <input
                type="number"
                value={settings.portsBase.db}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  portsBase: { ...prev.portsBase, db: parseInt(e.target.value) }
                }))}
                className="input"
                min="1024"
                max="65535"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                phpMyAdmin Base Port
              </label>
              <input
                type="number"
                value={settings.portsBase.phpmyadmin}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  portsBase: { ...prev.portsBase, phpmyadmin: parseInt(e.target.value) }
                }))}
                className="input"
                min="1024"
                max="65535"
              />
            </div>
          </div>
          
          <p className="text-xs text-neutral-500 mt-4">
            Base ports are used as starting points for automatic port allocation
          </p>
        </section>

        {/* Advanced */}
        <section className="card">
          <div className="flex items-center gap-3 mb-4">
            <CogIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium">Advanced</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-neutral-600 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show performance warnings for Windows bind mounts</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-neutral-600 text-primary focus:ring-primary"
                />
                <span className="text-sm">Enable debug logging</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-neutral-600 text-primary focus:ring-primary"
                />
                <span className="text-sm">Auto-check for updates</span>
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-800 border-t border-neutral-700 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-neutral-400">You have unsaved changes</p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="btn-ghost"
                disabled={isSaving}
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;