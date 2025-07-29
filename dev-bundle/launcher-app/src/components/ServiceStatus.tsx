import { ArrowPathIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { MCPService } from '../types'

interface ServiceStatusProps {
  services: MCPService[]
  onRefresh: () => void
}

export default function ServiceStatus({ services, onRefresh }: ServiceStatusProps) {
  const statusColors = {
    running: 'bg-green-100 text-green-800',
    stopped: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800',
  }

  const statusDots = {
    running: 'bg-green-400',
    stopped: 'bg-gray-400',
    error: 'bg-red-400',
  }

  const handleStartAll = async () => {
    try {
      await window.electronAPI.runCommand(
        'docker-compose',
        ['up', '-d'],
        '../core-mcp-stack'
      )
      onRefresh()
    } catch (error) {
      console.error('Failed to start services:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Service Status</h3>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          title="Refresh status"
        >
          <ArrowPathIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={clsx(
                'h-2 w-2 rounded-full',
                statusDots[service.status]
              )} />
              <span className="text-sm font-medium text-gray-900">{service.name}</span>
            </div>
            <span className={clsx(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              statusColors[service.status]
            )}>
              {service.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={handleStartAll}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          Start All Services
        </button>
      </div>
    </div>
  )
}