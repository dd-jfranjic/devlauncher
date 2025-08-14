import React from 'react'
import { Project } from '@types'
import { cn, formatRelativeTime } from '@lib/utils'

interface ProjectCardProps {
  project: Project
  isSelected: boolean
  onSelect: () => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isSelected,
  onSelect
}) => {
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'running':
        return 'bg-success'
      case 'starting':
        return 'bg-warning animate-pulse'
      case 'error':
        return 'bg-error'
      case 'stopped':
      default:
        return 'bg-neutral-400'
    }
  }

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'running':
        return 'Running'
      case 'starting':
        return 'Starting...'
      case 'error':
        return 'Error'
      case 'stopped':
      default:
        return 'Stopped'
    }
  }

  const getTemplateIcon = (template: Project['template']) => {
    switch (template) {
      case 'nextjs':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.5725 0c-.1763 0-.3098.0013-.3584.0067-.0516.0053-.2159.021-.3636.0328-3.4088.3073-6.6017 2.1463-8.624 4.9728C1.1004 6.584.3802 8.3666.1082 10.255c-.0962.659-.108.8537-.108 1.7474s.012 1.0884.108 1.7476c.652 4.506 3.8591 8.2919 8.2087 9.6945.7789.2511 1.6.4223 2.5337.5255.3636.04 1.9354.04 2.299 0 1.6117-.1783 2.9772-.577 4.3237-1.2643.2065-.1056.2464-.1337.2183-.1573-.0188-.0139-.8987-1.1938-1.9543-2.62l-1.919-2.592-2.4047-3.5583c-1.3231-1.9564-2.4117-3.556-2.4211-3.556-.0094-.0026-.0187 1.5787-.0235 3.509-.0067 3.3802-.0093 3.5162-.0516 3.596-.061.115-.108.1618-.2064.2134-.075.0374-.1408.0445-.5429.0445h-.4570l-.0731-.046c-.0425-.0275-.0792-.0771-.0865-.1133-.0047-.0312-.0073-1.3365-.0038-2.9057L9.0617 9.01l.0731-.0431c.0478-.0275.1206-.0459.1683-.0459.0515 0 .1048.0184.151.0459l.0733.0431.0056 2.2976c.0038 1.2624.0094 2.3139.0134 2.3372.0038.0232.0178.0625.0296.0818.0119.0206.0334.0378.0499.0378.0165.0013.0315.0032.0315.0032.0147.0013.0178.0013.0199.0013.0026.0013.0057.0013.0084.0013.0113 0 .0148-.0006.0162-.0006l.0017-.0006c.0049-.0013.0076-.0013.0101-.0013.0025.0013.0051.0013.0076.0013.0025 0 .0051-.0013.0076-.0013.0013 0 .0025-.0006.0038-.0006.0012.0006.0025.0006.0037.0006.0013-.0006.0026-.0006.0039-.0006.0013.0006.0025.0006.0038.0006.0012-.0006.0025-.0006.0037-.0006l.0017.0006c.0024.0013.005.0013.0075.0013.0025-.0013.0051-.0013.0076-.0013.0025 0 .0051.0013.0076.0013.0025-.0013.0051-.0013.0076-.0013.0013 0 .0025.0006.0038.0006.0012-.0006.0025-.0006.0037-.0006.0013.0006.0026.0006.0039.0006.0012-.0006.0025-.0006.0037-.0006.0013.0006.0025.0006.0038.0006.0012-.0006.0025-.0006.0037-.0006l.0018.0006c.0049.0013.0076.0013.0101.0013.0025-.0013.005-.0013.0076-.0013.0024.0013.005.0013.0075.0013.0025-.0013.0051-.0013.0076-.0013.0013 0 .0025.0006.0038.0006.0012-.0006.0025-.0006.0037-.0006.0013.0006.0026.0006.0039.0006.0012-.0006.0025-.0006.0037-.0006.0013.0006.0025.0006.0038.0006.0012-.0006.0024-.0006.0037-.0006l.0017.0006c.0049.0013.0076.0013.0101.0013.0025-.0013.005-.0013.0076-.0013.0024.0013.005.0013.0075.0013.0025-.0013.0051-.0013.0076-.0013z" />
          </svg>
        )
      case 'wordpress':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.109m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.135-2.85-.135-.584-.031-.661.854-.078.899 0 0 .554.075 1.139.105l1.694 4.615-2.378 7.133L5.354 6.825c.649-.03 1.234-.105 1.234-.105.583-.075.516-.93-.065-.899 0 0-1.756.135-2.88.135-.202 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.607-3.582.607M1.211 12c0-1.564.336-3.05.940-4.39L7.44 21.684C3.566 19.875 1.212 16.197 1.212 12m10.79-7.304c0-.896-.72-1.616-1.616-1.616s-1.615.72-1.615 1.616.72 1.615 1.615 1.615 1.615-.72 1.615-1.615" />
          </svg>
        )
      case 'blank':
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const getLocationIcon = (location: Project['location']) => {
    switch (location) {
      case 'wsl':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.18 6.463c.04-.277.14-.54.288-.769.147-.23.339-.42.564-.556.449-.271.973-.271 1.422 0 .225.136.417.327.564.556.148.23.248.492.288.769.04.277.02.558-.06.817-.078.26-.218.492-.408.676-.191.184-.427.316-.689.387-.262.07-.538.074-.803.012-.264-.062-.506-.19-.702-.375-.196-.184-.338-.416-.414-.676-.077-.259-.09-.54-.05-.817m6.545 0c.04-.277.14-.54.288-.769.147-.23.339-.42.564-.556.449-.271.973-.271 1.422 0 .225.136.417.327.564.556.148.23.248.492.288.769.04.277.02.558-.06.817-.078.26-.218.492-.408.676-.191.184-.427.316-.689.387-.262.07-.538.074-.803.012-.264-.062-.506-.19-.702-.375-.196-.184-.338-.416-.414-.676-.077-.259-.09-.54-.05-.817m6.545 0c.04-.277.14-.54.288-.769.147-.23.339-.42.564-.556.449-.271.973-.271 1.422 0 .225.136.417.327.564.556.148.23.248.492.288.769.04.277.02.558-.06.817-.078.26-.218.492-.408.676-.191.184-.427.316-.689.387-.262.07-.538.074-.803.012-.264-.062-.506-.19-.702-.375-.196-.184-.338-.416-.414-.676-.077-.259-.09-.54-.05-.817" />
          </svg>
        )
      case 'windows':
      default:
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.849" />
          </svg>
        )
    }
  }

  return (
    <div
      className={cn(
        'p-3 rounded-button border-2 cursor-pointer transition-all duration-200',
        'hover:border-neutral-300 hover:shadow-soft',
        isSelected 
          ? 'border-primary bg-primary/5 shadow-soft' 
          : 'border-neutral-200 bg-white'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="text-neutral-600 flex-shrink-0">
            {getTemplateIcon(project.template)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-body font-medium text-neutral-900 truncate">
              {project.name}
            </h3>
            <p className="text-caption text-neutral-500 truncate">
              {project.slug}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Location indicator */}
          <div className="text-neutral-400" title={project.location.toUpperCase()}>
            {getLocationIcon(project.location)}
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center space-x-1">
            <div className={cn('w-2 h-2 rounded-full', getStatusColor(project.status))} />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-caption text-neutral-500">
          {formatRelativeTime(project.updatedAt)}
        </div>
        
        <div className="text-caption text-neutral-500">
          {getStatusText(project.status)}
        </div>
      </div>
      
      {/* Ports preview */}
      {Object.keys(project.ports).length > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center space-x-2">
            <span className="text-caption text-neutral-500">Ports:</span>
            <div className="flex space-x-1">
              {Object.entries(project.ports).slice(0, 3).map(([service, port]) => (
                <span key={service} className="text-caption text-neutral-600 bg-neutral-100 px-1 rounded">
                  {port}
                </span>
              ))}
              {Object.keys(project.ports).length > 3 && (
                <span className="text-caption text-neutral-500">
                  +{Object.keys(project.ports).length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectCard