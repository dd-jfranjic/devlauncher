# Dev Launcher Templates

This directory contains all project templates for Dev Launcher. Each template provides a complete development environment setup with Docker configurations and WSL/Windows location support.

## Available Templates

### 1. Blank Template (`blank/`)
- Basic empty project structure
- README.md, .gitignore, and source directory
- Minimal setup for custom development

### 2. Next.js Template (`nextjs/`)
- Modern React application with Next.js 14
- TypeScript and Tailwind CSS configured
- Docker development environment with hot reload
- Optimized for both WSL and Windows locations
- Health check endpoint included

### 3. WordPress Template (`wordpress/`)
- Complete WordPress development stack
- Multi-container setup: Nginx, PHP-FPM, MariaDB
- Development tools: phpMyAdmin, Mailpit
- WP-CLI for command-line management
- Automatic WordPress installation

## Template Structure

Each template contains:

```
template-name/
├── manifest.yaml          # Template configuration and metadata
├── docker-compose.wsl.yml  # Docker Compose for WSL (optimal performance)
├── docker-compose.windows.yml # Docker Compose for Windows (with performance notes)
├── README.md              # Template-specific documentation
├── .gitignore             # Appropriate ignore rules
└── template files/        # Source files with {{VARIABLE}} placeholders
```

## Template Variables

Templates support variable substitution using `{{VARIABLE}}` syntax:

### Standard Variables
- `{{SLUG}}` - Project slug (URL-safe identifier)
- `{{NAME}}` - Project display name
- `{{TYPE}}` - Project type (blank, nextjs, wordpress)
- `{{LOCATION}}` - Location (wsl, windows)
- `{{HTTP_PORT}}` - Main HTTP port
- `{{DB_PORT}}` - Database port (if applicable)

### Location-specific Variables
- `{{WSL_DISTRO}}` - WSL distribution name
- `{{WSL_USER}}` - WSL username
- `{{WINDOWS_USER}}` - Windows username

### Custom Variables
Templates can define custom variables in their `manifest.yaml` file.

## Port Allocation

Templates define required ports in their manifest. The port allocator automatically assigns available ports based on:
1. Template defaults
2. Project slug hash
3. Port availability scan

## Location Support

### WSL Location (Recommended)
- **Best performance** for Docker workloads
- Native Linux filesystem
- Fast file watching without polling
- Optimal bind mount performance

### Windows Location
- **Compatible but slower** for Docker workloads
- NTFS filesystem limitations
- File watching requires polling
- Performance warnings displayed in UI

## Manifest Format

```yaml
name: template-name
type: nextjs  # or blank, wordpress
description: Template description
version: "1.0.0"

variables:
  - name: CUSTOM_VAR
    type: string
    default: "default_value"
    description: "Variable description"
    required: false

ports:
  http:
    default: 3000
    description: "HTTP port for the application"
  db:
    default: 3306
    description: "Database port"

locations:
  wsl:
    files:
      - "package.json"
      - "src/app/page.tsx"
    compose: "docker-compose.wsl.yml"
    runtime:
      - "docker"
  windows:
    files:
      - "package.json"
      - "src/app/page.tsx"
    compose: "docker-compose.windows.yml"
    runtime:
      - "docker"
      - "node"  # Windows can also run Node directly

hooks:
  preCreate: ["echo 'Before template render'"]
  postCreate: ["git init", "echo 'After template render'"]
  preUp: ["echo 'Before docker compose up'"]
  postUp: ["echo 'After containers started'"]
```

## Creating New Templates

1. **Create template directory** in `templates/`
2. **Write manifest.yaml** with template configuration
3. **Create template files** with variable placeholders
4. **Add location-specific files** (WSL/Windows variations)
5. **Test template rendering** via API or CLI
6. **Update documentation**

## Template Engine API

The template engine provides REST API endpoints:

- `GET /api/templates` - List all templates
- `GET /api/templates/:name` - Get template details
- `POST /api/templates/:name/render` - Render template
- `POST /api/templates/:name/allocate-ports` - Allocate ports
- `POST /api/templates/:name/validate-context` - Validate variables

## Performance Considerations

### WSL vs Windows
Templates automatically optimize for location:

**WSL Projects:**
- Fast bind mounts
- Efficient file watching
- Native Docker performance

**Windows Projects:**
- Performance warnings shown
- Polling-based file watching
- Alternative runtime options (Node.js for Next.js)

### Docker Compose Variations
Templates include location-specific compose files:
- `docker-compose.wsl.yml` - Optimized for WSL
- `docker-compose.windows.yml` - Windows-compatible with notes

## Best Practices

1. **Use descriptive variable names** with clear defaults
2. **Provide comprehensive documentation** in template README
3. **Test on both WSL and Windows** locations
4. **Include health checks** for Docker services
5. **Use semantic versioning** for template versions
6. **Add appropriate .gitignore** rules
7. **Include development tools** (linting, formatting)
8. **Provide useful npm/composer scripts**

## Troubleshooting

### Template Not Found
- Ensure `manifest.yaml` exists and is valid
- Check template directory permissions
- Verify YAML syntax

### Variable Substitution Issues
- Check variable names match exactly (case-sensitive)
- Ensure variables are defined in manifest
- Use default values for optional variables

### Port Allocation Failures
- Check port conflicts with other services
- Verify port ranges are available
- Review firewall settings

### Location-specific Issues
**WSL:**
- Ensure Docker Desktop WSL backend is enabled
- Check WSL distribution is accessible
- Verify file permissions

**Windows:**
- Check Docker Desktop Windows containers
- Ensure paths don't exceed Windows limits
- Consider using WSL for better performance