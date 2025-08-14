import React, { useState, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import {
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

interface DockerTabProps {
  project: any;
  onRefresh: () => void;
}

interface DockerService {
  name: string;
  status: 'running' | 'stopped' | 'error';
  image: string;
  ports: string[];
  health?: string;
}

interface DockerVolume {
  name: string;
  description: string;
}

const DockerTab: React.FC<DockerTabProps> = ({ project, onRefresh }) => {
  const { showToast } = useStore();
  const [services, setServices] = useState<DockerService[]>([]);
  const [volumes, setVolumes] = useState<DockerVolume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDockerServices();
  }, [project]);

  const loadDockerServices = async () => {
    setIsLoading(true);
    try {
      // For external-import projects, fetch real Docker services from API
      if (project.type === 'external-import') {
        const response = await fetch(`/api/projects/${project.slug}/docker/services`);
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setServices(data.data.services || []);
        setVolumes(data.data.volumes || []);
      } else {
        // Keep existing mock logic for WordPress and Next.js
        const mockServices: DockerService[] = [];
        
        if (project.type === 'wordpress') {
          mockServices.push(
            {
              name: 'nginx',
              status: project.status === 'running' ? 'running' : 'stopped',
              image: 'nginx:alpine',
              ports: [`${project.ports.wordpress}:80`],
              health: 'healthy'
            },
            {
              name: 'php-fpm',
              status: project.status === 'running' ? 'running' : 'stopped',
              image: 'wordpress:php8.2-fpm',
              ports: [],
              health: 'healthy'
            },
            {
              name: 'mariadb',
              status: project.status === 'running' ? 'running' : 'stopped',
              image: 'mariadb:10.11',
              ports: [`${project.ports.db}:3306`],
              health: 'healthy'
            },
            {
              name: 'phpmyadmin',
              status: project.status === 'running' ? 'running' : 'stopped',
              image: 'phpmyadmin:latest',
              ports: [`${project.ports.phpmyadmin}:80`]
            },
            {
              name: 'mailpit',
              status: project.status === 'running' ? 'running' : 'stopped',
              image: 'axllent/mailpit',
              ports: [
                `${project.ports.mailpit_ui}:8025`,
                `${project.ports.smtp}:1025`
              ]
            }
          );
        } else if (project.type === 'nextjs') {
          mockServices.push({
            name: 'nextjs',
            status: project.status === 'running' ? 'running' : 'stopped',
            image: 'node:20-alpine',
            ports: [`${project.ports.http}:3000`],
            health: 'healthy'
          });
        }
        
        setServices(mockServices);
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to load Docker services'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceAction = async (service: string, action: 'start' | 'stop' | 'restart' | 'logs') => {
    try {
      // In production, this would call the appropriate API endpoint
      showToast({
        type: 'info',
        message: `${action} ${service}...`
      });
      
      if (action === 'logs') {
        // Switch to logs tab with service filter
        useStore.getState().setActiveTab('logs');
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: `Failed to ${action} ${service}`
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-success';
      case 'error':
        return 'text-error';
      default:
        return 'text-neutral-500';
    }
  };

  const getHealthBadge = (health?: string) => {
    if (!health) return null;
    
    const colors = {
      healthy: 'badge-success',
      unhealthy: 'badge-error',
      starting: 'badge-warning'
    };
    
    return (
      <span className={`badge ${colors[health as keyof typeof colors] || 'badge-info'}`}>
        {health}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner w-8 h-8 mb-4" />
          <p className="text-neutral-400">Loading Docker services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Docker Compose Info */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Docker Compose</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="btn-ghost btn-sm"
              title="Refresh"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-neutral-400">Project Name</span>
            <p className="font-mono mt-1">{project.dockerProject}</p>
          </div>
          <div>
            <span className="text-neutral-400">Services</span>
            <p className="mt-1">{services.length}</p>
          </div>
          <div>
            <span className="text-neutral-400">Status</span>
            <p className={`mt-1 ${getStatusColor(project.status)}`}>
              {project.status}
            </p>
          </div>
          <div>
            <span className="text-neutral-400">Network</span>
            <p className="font-mono mt-1">{project.slug}_network</p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Services</h3>
        
        {services.length === 0 ? (
          <div className="text-center py-8">
            <ServerIcon className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-500">No services configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.name}
                className="p-4 bg-neutral-700 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{service.name}</h4>
                      <span className={`text-sm ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                      {getHealthBadge(service.health)}
                    </div>
                    
                    <div className="space-y-1 text-sm text-neutral-400">
                      <p>
                        <span className="text-neutral-500">Image:</span>{' '}
                        <span className="font-mono">{service.image}</span>
                      </p>
                      {service.ports.length > 0 && (
                        <p>
                          <span className="text-neutral-500">Ports:</span>{' '}
                          <span className="font-mono">{service.ports.join(', ')}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {service.status === 'running' ? (
                      <>
                        <button
                          onClick={() => handleServiceAction(service.name, 'restart')}
                          className="p-2 hover:bg-neutral-600 rounded transition-colors"
                          title="Restart"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleServiceAction(service.name, 'stop')}
                          className="p-2 hover:bg-neutral-600 rounded transition-colors"
                          title="Stop"
                        >
                          <StopIcon className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleServiceAction(service.name, 'start')}
                        className="p-2 hover:bg-neutral-600 rounded transition-colors"
                        title="Start"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleServiceAction(service.name, 'logs')}
                      className="p-2 hover:bg-neutral-600 rounded transition-colors"
                      title="View Logs"
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Volumes */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Volumes</h3>
        <div className="space-y-2 text-sm">
          {project.type === 'external-import' ? (
            volumes.length > 0 ? (
              volumes.map((volume, index) => (
                <div key={index} className="flex justify-between py-2">
                  <span className="font-mono text-neutral-400">{volume.name}</span>
                  <span className="text-neutral-500">{volume.description}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-neutral-500">
                No volumes configured
              </div>
            )
          ) : (
            <>
              {project.type === 'wordpress' && (
                <>
                  <div className="flex justify-between py-2">
                    <span className="font-mono text-neutral-400">{project.slug}_wp_content</span>
                    <span className="text-neutral-500">WordPress files</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-mono text-neutral-400">{project.slug}_db_data</span>
                    <span className="text-neutral-500">Database</span>
                  </div>
                </>
              )}
              {project.type === 'nextjs' && (
                <div className="flex justify-between py-2">
                  <span className="font-mono text-neutral-400">{project.slug}_node_modules</span>
                  <span className="text-neutral-500">Dependencies</span>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="card">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button className="btn-secondary">
            Pull Images
          </button>
          <button className="btn-secondary">
            Build Images
          </button>
          <button className="btn-secondary">
            Prune Unused
          </button>
          <button className="btn-secondary">
            View Compose File
          </button>
          <button className="btn-secondary">
            Open in Docker Desktop
          </button>
          <button className="btn-secondary text-warning">
            Reset Volumes
          </button>
        </div>
      </section>
    </div>
  );
};

export default DockerTab;