import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { createLogger } from '../utils/logger';
import { ProjectType, ProjectLocation, ProjectLocationValues } from '../domain/types';
import { PortAllocatorService } from './port-allocator';

const logger = createLogger('template-engine');

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean';
  default?: any;
  description?: string;
  required?: boolean;
}

export interface TemplateManifest {
  name: string;
  type: ProjectType;
  description: string;
  version: string;
  variables: TemplateVariable[];
  ports: {
    [portName: string]: {
      default: number;
      description: string;
    };
  };
  locations: {
    wsl?: {
      files: string[];
      compose?: string;
      runtime?: string[];
    };
    windows?: {
      files: string[];
      compose?: string;
      runtime?: string[];
    };
  };
  hooks?: {
    preCreate?: string[];
    postCreate?: string[];
    preUp?: string[];
    postUp?: string[];
  };
}

export interface TemplateRenderContext {
  slug: string;
  name: string;
  type: ProjectType;
  location: ProjectLocation;
  ports: { [portName: string]: number };
  paths: {
    host: string;
    container: string;
    relative: string;
  };
  variables: { [key: string]: any };
  // WSL specific variables
  wslDistro?: string;
  wslUser?: string;
  // Windows specific variables
  windowsUser?: string;
}

export class TemplateEngine {
  private templatesRoot: string;

  constructor(
    templatesRoot?: string,
    private portAllocator?: PortAllocatorService
  ) {
    this.templatesRoot = templatesRoot || path.join(process.cwd(), 'templates');
  }

  /**
   * Get list of available templates
   */
  async getAvailableTemplates(): Promise<TemplateManifest[]> {
    const templates: TemplateManifest[] = [];
    
    try {
      const templateDirs = await fs.readdir(this.templatesRoot, { withFileTypes: true });
      
      for (const dir of templateDirs) {
        if (dir.isDirectory()) {
          try {
            const manifest = await this.loadManifest(dir.name);
            templates.push(manifest);
          } catch (error) {
            logger.warn(`Failed to load template '${dir.name}':`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to read templates directory:', error);
    }

    return templates;
  }

  /**
   * Load template manifest
   */
  async loadManifest(templateName: string): Promise<TemplateManifest> {
    const manifestPath = path.join(this.templatesRoot, templateName, 'manifest.yaml');
    
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = yaml.load(manifestContent) as TemplateManifest;
      
      // Validate manifest structure
      if (!manifest.name || !manifest.type || !manifest.locations) {
        throw new Error('Invalid manifest structure');
      }

      return manifest;
    } catch (error) {
      throw new Error(`Failed to load manifest for template '${templateName}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render template to target directory
   */
  async renderTemplate(
    templateName: string,
    targetPath: string,
    context: TemplateRenderContext
  ): Promise<void> {
    logger.info(`Rendering template '${templateName}' to '${targetPath}'`, { context });

    const manifest = await this.loadManifest(templateName);
    const locationConfig = manifest.locations[context.location];
    
    if (!locationConfig) {
      throw new Error(`Template '${templateName}' does not support location '${context.location}'`);
    }

    // Ensure target directory exists
    await fs.mkdir(targetPath, { recursive: true });

    // Render files based on location
    const filesToRender = locationConfig.files || [];
    
    for (const filePath of filesToRender) {
      await this.renderFile(templateName, filePath, targetPath, context);
    }

    // Render compose file if specified
    if (locationConfig.compose) {
      await this.renderFile(templateName, locationConfig.compose, targetPath, context, locationConfig.compose);
    }

    // Generate .devlauncher.json
    await this.generateProjectConfig(targetPath, context, manifest);

    logger.info(`Template '${templateName}' rendered successfully`);
  }

  /**
   * Render individual file
   */
  private async renderFile(
    templateName: string,
    sourceRelativePath: string,
    targetPath: string,
    context: TemplateRenderContext,
    targetFileName?: string
  ): Promise<void> {
    const sourcePath = path.join(this.templatesRoot, templateName, sourceRelativePath);
    // Preserve directory structure from source path
    const fileName = targetFileName || sourceRelativePath;
    const targetFilePath = path.join(targetPath, fileName);

    // Handle directories in source path
    const targetDir = path.dirname(targetFilePath);
    if (targetDir !== targetPath) {
      await fs.mkdir(targetDir, { recursive: true });
    }

    try {
      const templateContent = await fs.readFile(sourcePath, 'utf-8');
      const renderedContent = this.renderVariables(templateContent, context);
      
      await fs.writeFile(targetFilePath, renderedContent, 'utf-8');
      logger.debug(`Rendered file: ${sourceRelativePath} -> ${fileName}`);
    } catch (error) {
      logger.error(`Failed to render file ${sourceRelativePath}:`, error);
      throw error;
    }
  }

  /**
   * Render variables in template content
   */
  private renderVariables(content: string, context: TemplateRenderContext): string {
    // Simple template variable replacement
    // Replace {{VARIABLE}} with context values
    return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = this.getContextValue(varName, context);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get value from render context
   */
  private getContextValue(varName: string, context: TemplateRenderContext): any {
    // Standard variables
    switch (varName) {
      case 'SLUG':
        return context.slug;
      case 'NAME':
      case 'PROJECT_NAME':
        return context.name;
      case 'TYPE':
        return context.type;
      case 'LOCATION':
        return context.location;
      case 'HOST_PATH':
        return context.paths.host;
      case 'CONTAINER_PATH':
        return context.paths.container;
      case 'RELATIVE_PATH':
        return context.paths.relative;
      case 'WSL_DISTRO':
        return context.wslDistro || 'Ubuntu';
      case 'WSL_USER':
        return context.wslUser || 'jfranjic';
      case 'WINDOWS_USER':
        return context.windowsUser || 'user';
    }

    // Port variables
    if (varName.endsWith('_PORT')) {
      const portName = varName.replace('_PORT', '').toLowerCase();
      return context.ports[portName];
    }

    // Custom variables
    if (context.variables && varName in context.variables) {
      return context.variables[varName];
    }

    return undefined;
  }

  /**
   * Generate .devlauncher.json config file
   */
  private async generateProjectConfig(
    targetPath: string,
    context: TemplateRenderContext,
    manifest: TemplateManifest
  ): Promise<void> {
    const config = {
      name: context.name,
      slug: context.slug,
      type: context.type,
      location: context.location,
      createdAt: new Date().toISOString(),
      template: {
        name: manifest.name,
        version: manifest.version
      },
      ports: context.ports,
      paths: {
        host: context.paths.host,
        container: context.paths.container,
        relative: context.paths.relative
      },
      dockerProject: `devlauncher-${context.slug}`,
      runtime: context.location === ProjectLocationValues.WSL ? 'docker' : 
               (context.variables?.runtime || 'docker'),
      claude: {
        cli: {
          installed: false,
          version: null
        },
        mcp: {
          configured: false,
          servers: []
        }
      },
      gemini: {
        cli: {
          installed: false,
          version: null
        }
      },
      urlResolver: {
        candidates: [],
        resolved: null,
        lastChecked: null,
        healthStatus: 'unknown'
      }
    };

    const configPath = path.join(targetPath, '.devlauncher.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    logger.debug('Generated .devlauncher.json');
  }

  /**
   * Allocate ports for template
   */
  async allocatePorts(
    templateName: string,
    slug: string,
    preferredPorts?: { [portName: string]: number }
  ): Promise<{ [portName: string]: number }> {
    const manifest = await this.loadManifest(templateName);
    const allocatedPorts: { [portName: string]: number } = {};

    if (!this.portAllocator) {
      // Fallback to default ports if no port allocator
      for (const [portName, config] of Object.entries(manifest.ports)) {
        allocatedPorts[portName] = preferredPorts?.[portName] || config.default;
      }
      return allocatedPorts;
    }

    // Allocate ports through port allocator service
    for (const [portName, config] of Object.entries(manifest.ports)) {
      const preferredPort = preferredPorts?.[portName] || config.default;
      
      try {
        const allocation = await this.portAllocator.allocatePort({
          slug,
          template: templateName,
          portName,
          preferredPort
        });
        allocatedPorts[portName] = allocation.portNumber;
      } catch (error) {
        logger.error(`Failed to allocate port ${portName} for ${slug}:`, error);
        logger.error('Error details:', { 
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined 
        });
        
        // Try to allocate a random port if the preferred one fails
        try {
          const randomPort = Math.floor(Math.random() * (9999 - 3001) + 3001);
          const allocation = await this.portAllocator.allocatePort({
            slug,
            template: templateName,
            portName,
            preferredPort: randomPort
          });
          allocatedPorts[portName] = allocation.portNumber;
          logger.warn(`Allocated alternative port ${allocation.portNumber} for ${portName}`);
        } catch (fallbackError) {
          logger.error(`Fallback port allocation also failed for ${portName}:`, fallbackError);
          // As last resort, use default port
          allocatedPorts[portName] = config.default;
          logger.warn(`Using default port ${config.default} for ${portName} as last resort`);
        }
      }
    }

    return allocatedPorts;
  }

  /**
   * Execute template hooks
   */
  async executeHooks(
    templateName: string,
    hookType: 'preCreate' | 'postCreate' | 'preUp' | 'postUp',
    context: TemplateRenderContext
  ): Promise<void> {
    try {
      const manifest = await this.loadManifest(templateName);
      const hooks = manifest.hooks?.[hookType];
      
      if (!hooks || hooks.length === 0) {
        return;
      }

      logger.info(`Executing ${hookType} hooks for template '${templateName}'`);
      
      for (const hook of hooks) {
        const renderedCommand = this.renderVariables(hook, context);
        logger.debug(`Executing hook command: ${renderedCommand}`);
        
        // TODO: Execute command based on location (WSL vs Windows)
        // This would need to use the same execution strategy as DockerService
      }
    } catch (error) {
      logger.error(`Failed to execute ${hookType} hooks:`, error);
      // Don't throw - hooks are optional
    }
  }

  /**
   * Validate template context
   */
  async validateContext(
    templateName: string,
    context: Partial<TemplateRenderContext>
  ): Promise<string[]> {
    const errors: string[] = [];
    
    try {
      const manifest = await this.loadManifest(templateName);
      
      // Check required variables
      for (const variable of manifest.variables) {
        if (variable.required && !context.variables?.[variable.name]) {
          errors.push(`Required variable '${variable.name}' is missing`);
        }
      }

      // Check location support
      if (context.location && !manifest.locations[context.location]) {
        errors.push(`Template does not support location '${context.location}'`);
      }

    } catch (error) {
      errors.push(`Failed to validate template: ${error instanceof Error ? error.message : String(error)}`);
    }

    return errors;
  }

  /**
   * Get default variables from template manifest
   */
  async getDefaultVariables(templateName: string): Promise<Record<string, any>> {
    try {
      const manifest = await this.loadManifest(templateName);
      const defaults: Record<string, any> = {};
      
      // Extract default values from manifest variables
      for (const variable of manifest.variables) {
        if (variable.default !== undefined) {
          defaults[variable.name] = variable.default;
        }
      }
      
      return defaults;
    } catch (error) {
      this.logger.warn(`Failed to get default variables for template ${templateName}:`, error);
      return {};
    }
  }
}