import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { 
  ArrowLeftIcon, 
  FolderIcon,
  RocketLaunchIcon,
  CubeTransparentIcon,
  BookOpenIcon,
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { Project } from '../types'

const projectTypes = [
  { 
    id: 'wordpress', 
    name: 'WordPress', 
    description: 'Full WordPress development environment with Docker',
    icon: CubeTransparentIcon,
    color: 'purple'
  },
  { 
    id: 'nextjs-fullstack', 
    name: 'Next.js Full Stack', 
    description: 'Modern full-stack app with Next.js + NestJS + PostgreSQL + Redis',
    icon: BeakerIcon,
    color: 'blue'
  },
  // More project types can be added here later
]

export default function NewProjectPage() {
  const navigate = useNavigate()
  
  useEffect(() => {
    setIsCreating(false);
    setCreationProgress('');
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    path: 'C:\\Users\\jfran\\Documents\\dev',
    type: 'wordpress' // Always WordPress for now
  })
  
  const [isCreating, setIsCreating] = useState(false)
  const [creationProgress, setCreationProgress] = useState('')

  const waitForWordPress = async (port: number, maxAttempts = 60) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        setCreationProgress(`🔍 Checking WordPress installation... (${i + 1}/${maxAttempts})`)
        
        // Use no-cors mode to avoid CORS errors
        const response = await fetch(`http://localhost:${port}`, { 
          method: 'GET',
          mode: 'no-cors'
        })
        
        // With no-cors, we can't read the response but if fetch succeeds, WordPress is running
        setCreationProgress('🎉 WordPress is running! Installation will complete on first visit.')
        return true
      } catch (error) {
        // If fetch fails, WordPress is not ready yet
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    setCreationProgress('⚠️ WordPress may still be starting - check the dashboard!')
    return false
  }

  const handleSelectDirectory = async () => {
    try {
      const directory = await window.electronAPI.selectDirectory();
      if (directory) {
        setFormData({ ...formData, path: directory });
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const project: Project = {
      id: Date.now().toString(),
      name: formData.name,
      path: `${formData.path}/${formData.name}`,
      type: formData.type as Project['type'],
      createdAt: new Date().toISOString(),
      mcpEnabled: false,
      wordpressMcpEnabled: false,
      contextEngineeringEnabled: false,
      pocketFlowEnabled: false,
      prpsEnabled: false,
      status: 'active',
    }

    try {
      setIsCreating(true)
      setCreationProgress('🚀 Starting project creation...')
      
      if (!formData.name || !formData.path) {
        alert('Please enter project name and select location');
        return;
      }

      const sanitizedName = formData.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/^[-_]+|[-_]+$/g, '')
        .replace(/[-_]{2,}/g, '-');
        
      if (sanitizedName.length === 0) {
        alert('Project name cannot be empty');
        return;
      }
      
      project.name = sanitizedName;
      project.path = `${formData.path}/${sanitizedName}`;
      
      if (sanitizedName !== formData.name.trim()) {
        console.log(`Project name sanitized: "${formData.name}" → "${sanitizedName}"`);
      }
      
      setCreationProgress('📁 Creating project directory...')

      const isWindows = navigator.platform.startsWith('Win');
      const projectPath = project.path.replace(/\//g, '\\');
      
      if (isWindows) {
        const parentDir = formData.path.replace(/\//g, '\\');
        // Create parent directory if it doesn't exist
        await window.electronAPI.runCommand('cmd', ['/c', `if not exist "${parentDir}" mkdir "${parentDir}"`]);
        // Create project directory
        await window.electronAPI.runCommand('cmd', ['/c', `if not exist "${projectPath}" mkdir "${projectPath}"`]);
      } else {
        await window.electronAPI.runCommand('mkdir', ['-p', project.path]);
      }
      
      setCreationProgress('📄 Copying template files...')
      const copyResult = await window.electronAPI.copyTemplate(project.type, projectPath, project);
      if (!copyResult.success) {
        throw new Error(copyResult.error);
      }
      
      if (copyResult.ports) {
        project.wpPort = copyResult.ports.wpPort;
        project.wpHttpsPort = copyResult.ports.wpHttpsPort;
        project.dbPort = copyResult.ports.dbPort;
        project.pmaPort = copyResult.ports.pmaPort;
        project.mailPort = copyResult.ports.mailPort;
        project.smtpPort = copyResult.ports.smtpPort;
        project.backendPort = copyResult.ports.backendPort;
        project.redisPort = copyResult.ports.redisPort;
        project.browserPort = copyResult.ports.browserPort;
      }
      
      // Save installation preferences
      if (formData.claudeCodeEnabled || formData.wordpressMcpEnabled) {
        const prefsPath = `${projectPath}\\devlauncher-prefs.json`;
        const prefs = {
          claudeCodeEnabled: formData.claudeCodeEnabled,
          wordpressMcpEnabled: formData.wordpressMcpEnabled,
          installOnFirstStart: true
        };
        await window.electronAPI.runCommand('cmd', [
          '/c', 
          `echo ${JSON.stringify(JSON.stringify(prefs))} > "${prefsPath}"`
        ]);
      }
      
      setCreationProgress('💾 Saving project...')
      await window.electronAPI.saveProject(project)
      
      if (project.type === 'wordpress') {
        setCreationProgress('🐳 Setting up Docker network...')
        try {
          try {
            await window.electronAPI.runCommand('docker', ['network', 'create', 'devlauncher-network']);
          } catch (netError) {
            console.log('Network might already exist:', netError);
          }
          
          setCreationProgress('🐳 Starting Docker containers (this may take a few minutes)...')
          await window.electronAPI.runCommand('docker', ['compose', 'up', '-d'], projectPath);
          
          const wpPort = copyResult.ports?.wpPort || 8080;
          
          setCreationProgress('✅ WordPress containers started! Waiting for WordPress to be ready...')
          
          const isReady = await waitForWordPress(wpPort)
          
          if (isReady) {
            setCreationProgress('🎉 WordPress is ready! Redirecting to dashboard...')
            setTimeout(() => navigate('/'), 2000)
          } else {
            setCreationProgress('⚠️ WordPress is starting in background. Check dashboard in a minute.')
            setTimeout(() => navigate('/'), 3000)
          }
        } catch (error) {
          console.error('Failed to start Docker:', error);
          alert('✅ Project created!\n\n⚠️ Docker auto-start failed.\n\nTry running manually:\n1. docker network create devlauncher-network\n2. docker compose up -d');
        }
      } else if (project.type === 'nextjs-fullstack') {
        // Create Docker network for Next.js Full Stack projects
        setCreationProgress('🐳 Setting up Docker network...')
        try {
          try {
            await window.electronAPI.runCommand('docker', ['network', 'create', 'devlauncher-network']);
          } catch (netError) {
            console.log('Network might already exist:', netError);
          }
          setCreationProgress('✅ Next.js Full Stack project created successfully!')
          setTimeout(() => {
            setCreationProgress('🎉 Redirecting to dashboard...')
            setTimeout(() => navigate('/'), 1000)
          }, 2000)
        } catch (error) {
          console.error('Failed to create Docker network:', error);
          setCreationProgress('✅ Project created! Note: Create Docker network manually if needed.')
          setTimeout(() => navigate('/'), 3000)
        }
      } else {
        setCreationProgress('✅ Project created successfully!')
        setTimeout(() => {
          setCreationProgress('🎉 Redirecting to dashboard...')
          setTimeout(() => navigate('/'), 1000)
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      setCreationProgress('❌ Project creation failed')
      alert('Failed to create project: ' + ((error as any).error || (error as any).message))
    } finally {
      setIsCreating(false)
      setTimeout(() => setCreationProgress(''), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <RocketLaunchIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Project Information
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  disabled={isCreating}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="my-awesome-project"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Will be converted to lowercase and Docker-compatible format
                </p>
              </div>

              <div>
                <label htmlFor="path" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Location
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="path"
                    required
                    disabled={isCreating}
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleSelectDirectory}
                    disabled={isCreating}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FolderIcon className="h-4 w-4" />
                    Browse
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Project Type
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {projectTypes.map((type) => (
                    <label
                      key={type.id}
                      className={clsx(
                        'relative flex cursor-pointer rounded-lg border-2 p-4 transition-all',
                        formData.type === type.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.id}
                        checked={formData.type === type.id}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="sr-only"
                        disabled={isCreating}
                      />
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'p-2 rounded-lg',
                          formData.type === type.id
                            ? 'bg-purple-100 dark:bg-purple-800/30'
                            : 'bg-gray-100 dark:bg-gray-700'
                        )}>
                          <type.icon className={clsx(
                            'h-6 w-6',
                            formData.type === type.id
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-gray-600 dark:text-gray-400'
                          )} />
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-gray-900 dark:text-white">{type.name}</span>
                          <span className="block text-sm text-gray-500 dark:text-gray-400">{type.description}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>


          {/* Progress Indicator */}
          {isCreating && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {creationProgress.includes('🎉') || creationProgress.includes('✅') ? (
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  ) : creationProgress.includes('❌') ? (
                    <XCircleIcon className="h-8 w-8 text-red-500" />
                  ) : (
                    <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {creationProgress.includes('🎉') || creationProgress.includes('✅') ? 'Project Ready!' : 
                     creationProgress.includes('❌') ? 'Creation Failed' : 
                     'Creating your project...'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{creationProgress}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={isCreating}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <RocketLaunchIcon className="h-5 w-5" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}