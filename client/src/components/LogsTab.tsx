import React, { useState, useEffect, useRef } from 'react';
import { streamLogs } from '../lib/api';
import { useStore } from '../stores/useStore';
import {
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface LogsTabProps {
  project: any;
}

interface LogEntry {
  timestamp: string;
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

const LogsTab: React.FC<LogsTabProps> = ({ project }) => {
  const { showToast } = useStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [logLevel, setLogLevel] = useState<string>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Load initial logs
    loadLogs();
    
    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [project]);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [logs]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadLogs = () => {
    // Mock initial logs
    const mockLogs: LogEntry[] = [
      {
        timestamp: new Date().toISOString(),
        service: 'system',
        level: 'info',
        message: 'Dev Launcher started successfully'
      },
      {
        timestamp: new Date().toISOString(),
        service: project.type === 'wordpress' ? 'nginx' : 'nextjs',
        level: 'info',
        message: `${project.name} project loaded`
      }
    ];
    setLogs(mockLogs);
  };

  const handleStartStreaming = async () => {
    try {
      setIsStreaming(true);
      const service = selectedService === 'all' ? undefined : selectedService;
      
      // In production, this would use the actual SSE endpoint
      // For now, we'll simulate with mock data
      const interval = setInterval(() => {
        const newLog: LogEntry = {
          timestamp: new Date().toISOString(),
          service: selectedService === 'all' ? 
            ['nginx', 'php-fpm', 'mariadb', 'nextjs'][Math.floor(Math.random() * 4)] : 
            selectedService,
          level: ['info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 4)] as any,
          message: `Sample log message ${Math.random().toString(36).substring(7)}`
        };
        setLogs(prev => [...prev, newLog]);
      }, 1000);

      // Store the interval ID for cleanup
      (eventSourceRef as any).current = { interval };
      
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to start log streaming'
      });
      setIsStreaming(false);
    }
  };

  const handleStopStreaming = () => {
    if ((eventSourceRef as any).current?.interval) {
      clearInterval((eventSourceRef as any).current.interval);
    }
    setIsStreaming(false);
  };

  const handleClearLogs = () => {
    setLogs([]);
    showToast({
      type: 'info',
      message: 'Logs cleared'
    });
  };

  const handleExportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.service}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.slug}-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast({
      type: 'success',
      message: 'Logs exported successfully'
    });
  };

  const getServices = () => {
    const services = ['all'];
    if (project.type === 'wordpress') {
      services.push('nginx', 'php-fpm', 'mariadb', 'phpmyadmin', 'mailpit');
    } else if (project.type === 'nextjs') {
      services.push('nextjs');
    }
    return services;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-error';
      case 'warn':
        return 'text-warning';
      case 'info':
        return 'text-info';
      case 'debug':
        return 'text-neutral-500';
      default:
        return 'text-neutral-400';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesService = selectedService === 'all' || log.service === selectedService;
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    const matchesSearch = !searchQuery || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesService && matchesLevel && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-4">
          {/* Service Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1">Service</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="input input-sm"
            >
              {getServices().map(service => (
                <option key={service} value={service}>
                  {service === 'all' ? 'All Services' : service}
                </option>
              ))}
            </select>
          </div>

          {/* Log Level Filter */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium mb-1">Level</label>
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value)}
              className="input input-sm"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs font-medium mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="input input-sm pl-9"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            {isStreaming ? (
              <button
                onClick={handleStopStreaming}
                className="btn-secondary btn-sm flex items-center gap-2"
              >
                <PauseIcon className="w-4 h-4" />
                Pause
              </button>
            ) : (
              <button
                onClick={handleStartStreaming}
                className="btn-primary btn-sm flex items-center gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                Stream
              </button>
            )}
            
            <button
              onClick={handleClearLogs}
              className="btn-ghost btn-sm"
              title="Clear logs"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleExportLogs}
              className="btn-ghost btn-sm"
              title="Export logs"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
            
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-600 text-primary focus:ring-primary"
              />
              Auto-scroll
            </label>
          </div>
        </div>
      </div>

      {/* Log Display */}
      <div className="card flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-neutral-400">
            Showing {filteredLogs.length} of {logs.length} logs
          </h3>
          {isStreaming && (
            <span className="flex items-center gap-2 text-sm text-success">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        
        <div className="flex-1 overflow-auto code-scrollbar bg-neutral-900 rounded-lg p-3 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              {searchQuery || selectedService !== 'all' || logLevel !== 'all' ? 
                'No logs match your filters' : 
                'No logs available'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 hover:bg-neutral-800 px-2 py-1 rounded"
                >
                  <span className="text-neutral-600 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-neutral-500 flex-shrink-0 w-20">
                    [{log.service}]
                  </span>
                  <span className={`flex-shrink-0 w-16 ${getLevelColor(log.level)}`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="text-neutral-300 break-all">
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsTab;