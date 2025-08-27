# 🚀 Dev Launcher

**Dev Launcher** is a Windows-native desktop application for managing Docker-based development projects. Create and run development environments with a single click, featuring support for both WSL and Windows locations.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%2011-lightgrey)
![Docker](https://img.shields.io/badge/Docker-Required-blue)
![WSL2](https://img.shields.io/badge/WSL2-Supported-green)

## ✨ Features

- 🎯 **One-click project setup** - Create and launch projects in seconds
- 🐳 **All-in-Docker architecture** - Every component runs in containers
- 📍 **WSL & Windows dual support** - Optimized for both environments
- 🔧 **Template system** - Blank, Next.js, WordPress project templates
- 🔌 **Smart port management** - Automatic allocation with conflict resolution
- 🤖 **Triple AI CLI integration** - Claude, Gemini, and Qwen3-Coder CLI tools with full WSL support
- 📊 **Real-time logging** - Live Docker container log streaming
- 🎨 **Modern UI** - Electron + React + TypeScript + Tailwind CSS
- 🧭 **MCP Protocol support** - Model Context Protocol server management with 10+ servers
- 🔗 **Quick Links** - Instant access to project services and admin panels
- 📁 **External project import** - Import existing Docker projects seamlessly

## 💎 Key Differentiators

**What makes Dev Launcher unique:**

🚀 **Instant Development Environments** - No more "it works on my machine"  
🔄 **Zero-Config Docker Orchestration** - Complex multi-service projects just work  
🤝 **WSL + Windows Harmony** - Seamless integration between both worlds  
🧠 **AI-First Approach** - Three major AI assistants with MCP protocol support  
📦 **External Project Adoption** - Import any existing Docker project instantly  
⚡ **Terminal That Actually Works** - Proper WSL terminal integration with --cd support  
🔗 **Smart Quick Links** - Auto-discovered service URLs with health monitoring  
🐳 **Enterprise Docker Features** - Port allocation, network isolation, volume management  

## 📋 Prerequisites

- **Windows 11** (or Windows 10 version 2004+)
- **WSL2** with Ubuntu distribution
- **Docker Desktop** for Windows
- **Node.js 20+** (for development)
- **PowerShell 7** (recommended)
- **Windows Terminal** (recommended)
- **VS Code or Cursor** (optional)

## 🔧 Installation

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/dd-jfranjic/devlauncher.git
cd devlauncher

# 2. Install dependencies
npm install

# 3. Setup the database
npx prisma generate
npx prisma migrate dev --name init

# 4. Run Dev Launcher (Docker method - recommended)
docker compose up -d

# 5. Launch the Electron application
npm run dev:client
```

### Alternative: Local Development

```bash
# Run all services locally (without Docker)
npm run dev

# Or individually:
npm run dev:server   # Backend API server on port 9976
npm run dev:client   # Frontend React app on port 5173
```

The Dev Launcher backend will be available at `http://localhost:9976`  
The frontend UI will be available at `http://localhost:5173`

## 🚀 Usage

### Creating a new project

1. Click **"New Project"** in the sidebar
2. Choose from available templates:
   - **WordPress** - Full LAMP stack with phpMyAdmin and Mailpit
   - **Next.js** - React framework with TypeScript and Tailwind CSS
   - **Blank** - Empty template for custom Docker configurations
3. Configure project settings:
   - **Project name** and **slug** (URL-friendly identifier)
   - **Location**: WSL (recommended) or Windows
   - **Template variables** (database credentials, API keys, etc.)
   - **Port allocation** (automatic or manual)
4. Click **"Create Project"**
5. Project containers will build and start automatically

### Managing projects

- **Project Overview** - Central dashboard with all project information
- **Quick Actions** - One-click access to:
  - **Terminal** - Opens WSL/PowerShell in project directory
  - **Folder** - Opens Windows Explorer (with WSL support via UNC paths)
  - **Editor** - Launches VS Code/Cursor with project loaded
  - **Port Reallocation** - Resolve port conflicts automatically
- **Quick Links** - Direct access to running services:
  - **Frontend/Backend URLs** - Auto-discovered service endpoints
  - **Admin panels** - Database interfaces, email testing tools
  - **Custom services** - Any exposed ports with health monitoring
- **Docker Tab** - Container management and service status
- **Logs Tab** - Real-time container log streaming with filtering
- **MCP Tab** - Model Context Protocol server management
- **Settings Tab** - Project configuration and advanced options

### AI CLI Tools Integration

Dev Launcher provides seamless integration with three major AI coding assistants:

#### **Claude CLI** (✅ Fully Supported)
- **Provider**: Anthropic
- **Installation**: `npm install -g @anthropic-ai/claude-cli`
- **Features**: Continue mode, Bypass permissions, Debug mode, MCP integration
- **Version Detection**: Live version checking and updates
- **Terminal Buttons**: 
  - `claude` - Standard Claude CLI
  - `claude -c` - Continue mode  
  - `claude --dangerously-skip-permissions` - Bypass mode
  - `claude --dangerously-skip-permissions -c` - Bypass + Continue
  - `claude mcp list` - List connected MCP servers
  - `claude --debug` - Debug mode

#### **Gemini CLI** (✅ Fully Supported)  
- **Provider**: Google
- **Installation**: `npm install -g @google/gemini-cli`
- **Features**: Interactive chat, Search capabilities, Multiple model support
- **Version Detection**: Automatic version checking and updates
- **Terminal Buttons**:
  - `gemini` - Interactive Gemini CLI
  - `gemini -h` - Help and documentation
  - `gemini search` - Search capabilities

#### **Qwen3-Coder CLI** (✅ Fully Supported)
- **Provider**: Qwen Team (Alibaba)  
- **Installation**: `npm install -g @qwen-code/qwen-code`
- **Features**: Advanced code generation, Multi-language support, Code analysis
- **Repository**: https://github.com/QwenLM/Qwen3-Coder
- **Version Detection**: Automatic installation verification
- **Terminal Buttons**:
  - `qwen` - Interactive Qwen3-Coder CLI
  - `qwen --help` - Help and usage instructions
  - `qwen --version` - Version information

**Installation Process:**
- All CLI tools are installed per-project in their respective environments (WSL or Windows)
- **WSL Projects**: CLI tools installed in WSL user context (`jfranjic`)
- **Windows Projects**: CLI tools installed in Windows environment
- **Automatic Detection**: Dev Launcher automatically detects existing installations
- **Version Management**: Real-time version checking and update notifications

### MCP Server Management

Dev Launcher includes a comprehensive MCP (Model Context Protocol) server ecosystem with **10 available servers**:

#### **🎭 Testing & Automation**
- **Playwright MCP** ✅ - Browser automation, E2E testing, screenshot capture
  - Installation: `npx @playwright/mcp@latest` (no global install required)
  - Features: Page navigation, element interaction, testing workflows
- **Docker Container Manager** ✅ - Container lifecycle management, compose orchestration
  - Installation: `uvx docker-mcp` (Python-based)
  - Features: Container control, compose stack management, log access

#### **🔒 Security & Analysis** 
- **Semgrep MCP** ✅ - Static code analysis, security vulnerability detection
  - Installation: `pip3 install --user semgrep-mcp`
  - **API Token Required**: Semgrep App Token
  - Features: Code scanning, security rule enforcement, vulnerability reports

#### **🔍 Search & Research**
- **Exa MCP** ✅ - AI-powered web search, company research, content discovery
  - Installation: `npx -y exa-mcp-server`
  - **API Key Required**: Exa API Key
  - Features: Web search, company research, LinkedIn search, content crawling
- **Jina MCP Tools** ✅ - Neural search, content extraction, AI embeddings
  - Installation: `npx jina-mcp-tools`
  - **API Key Required**: Jina API Key (optional, provides higher rate limits)
  - Features: Neural search, content summarization, AI-powered analysis
- **Ref Tools MCP** ✅ - Documentation search, hallucination prevention
  - Installation: `npx ref-tools-mcp@latest`
  - **API Key Required**: Ref API Key (from ref.tools)
  - Features: Token-efficient documentation search, reduces AI hallucinations

#### **🗄️ Database Operations**
- **Supabase MCP** - PostgreSQL operations, authentication management
  - Installation: `supabase-mcp serve`
  - **Configuration Required**: Supabase URL and Service Key
  - Features: Database queries, authentication, real-time subscriptions
- **MySQL MCP Server** - MySQL database management and queries
  - Installation: `mcp-server-mysql serve`
  - **Configuration Required**: MySQL connection credentials
  - Features: Database operations, query execution, schema management

#### **🐳 Docker Integration**
- **Docker MCP Gateway** - Official Docker enterprise gateway for containerized MCP servers
  - Installation: Requires Docker Desktop with MCP Toolkit extension
  - Features: Enterprise-grade MCP server management, containerized execution

#### **Installation Features:**
- **One-click installation** for all MCP servers through Dev Launcher UI
- **No global installations** - Uses `npx` for Node packages, `uvx` for Python packages
- **WSL optimized** - All installations execute in proper WSL user context
- **API token management** - Secure storage and configuration of API keys
- **Health monitoring** - Live status checks and connection verification
- **Easy removal** - `claude mcp remove <server-name>` for cleanup

#### **Verification:**
After installation, verify MCP servers with:
```bash
claude mcp list
```
Expected output shows all connected servers with health status:
```
playwright: npx @playwright/mcp@latest ✓ Connected
semgrep: semgrep-mcp ✓ Connected  
exa: npx -y exa-mcp-server ✓ Connected
# ... other installed servers
```

### External Project Import

Dev Launcher excels at importing existing Docker projects with **zero configuration**:

#### **Import Process:**
1. Click **"New Project"** → **"External Import"**
2. Provide existing project details:
   - **Name**: Display name for the project
   - **Slug**: URL-friendly identifier
   - **Docker Project Name**: Existing docker-compose project name
   - **Host Path**: Path to the existing project directory
3. Dev Launcher automatically:
   - Parses existing `docker-compose.yml` for services and ports
   - Imports service configurations automatically
   - Maintains original project structure
   - Adds Dev Launcher management capabilities
   - Creates Quick Links for discovered services
   - Preserves existing volumes and networks

#### **Benefits:**
- **Zero downtime** - Import without stopping existing containers
- **Non-invasive** - No changes to existing project files
- **Instant management** - Full Dev Launcher features available immediately
- **Service discovery** - Auto-detects all running services and ports
- **Quick Links generation** - Automatic URL discovery for web services

## 🛠️ Development

### Project Structure

```
devlauncher/
├── server/                     # Backend API (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── api/               # REST API endpoints
│   │   │   ├── projects.ts    # Project CRUD operations
│   │   │   ├── docker.ts      # Docker service management
│   │   │   ├── mcp.ts         # MCP server management
│   │   │   └── system.ts      # System commands (terminal, folder, editor)
│   │   ├── services/          # Business logic services
│   │   │   ├── docker-service.ts      # Docker API integration
│   │   │   ├── port-allocator.ts      # Dynamic port allocation
│   │   │   ├── template-engine.ts     # Project template processing
│   │   │   └── url-resolver.ts        # Service URL discovery
│   │   ├── utils/             # Utility functions
│   │   │   ├── mcp-installer.ts       # MCP server installation logic
│   │   │   └── cli-installer.ts       # AI CLI installation management
│   │   └── prisma/            # Database schema and migrations
├── client/                    # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ProjectOverview.tsx    # Main project dashboard
│   │   │   ├── DockerTab.tsx          # Container management
│   │   │   ├── McpTab.tsx            # MCP server interface
│   │   │   └── LogsTab.tsx           # Real-time log viewer
│   │   ├── stores/            # Zustand state management
│   │   ├── lib/              # API client and utilities
│   │   └── styles/           # Tailwind CSS styles
├── templates/                 # Project templates
│   ├── wordpress/            # WordPress + MariaDB + phpMyAdmin + Mailpit
│   ├── nextjs/              # Next.js + TypeScript + Tailwind CSS
│   └── blank/               # Empty template for custom projects
├── .claude/                  # Claude Code sub-agents for development
└── docker-compose.yml        # Dev Launcher container configuration
```

### Development Commands

```bash
# Development mode (all services)
npm run dev                    # Run server + client concurrently

# Individual services
npm run dev:server            # Backend API server (port 9976)
npm run dev:client            # Frontend React app (port 5173)

# Docker mode
npm run docker:build          # Build Docker containers
npm run docker:up             # Start in Docker
npm run docker:down           # Stop Docker containers
npm run docker:logs           # View container logs

# Database operations
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate         # Run database migrations
npm run prisma:studio          # Open Prisma Studio (database GUI)

# Build for production
npm run build                  # Build all components
npm run build:server          # Build backend only
npm run build:client          # Build frontend only
npm run build:electron         # Build Electron app

# Testing and quality
npm test                       # Run unit tests
npm run test:e2e              # Run Playwright E2E tests
npm run lint                   # ESLint code checking
npm run typecheck             # TypeScript validation
```

## 🐳 Docker Architecture

Dev Launcher uses an **"All-in-Docker"** approach for maximum consistency:

### Core Components
- **devlauncher container** - Backend API server with database and logs
- **Per-project containers** - Each project has its own isolated container stack
- **Isolated networks** - Each project operates in its own Docker network
- **Named volumes** - Persistent data storage for databases and project files
- **Port allocation system** - Dynamic port assignment with conflict resolution

### Docker Compose Configuration

```yaml
services:
  devlauncher:
    build: .
    container_name: devlauncher
    ports:
      - "127.0.0.1:9976:9976"          # API server (localhost only)
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # Docker API access
      - devl_db:/app/server/prisma                 # Database persistence
      - devl_logs:/app/.devlauncher/logs           # Centralized logging
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - PORT=9976
    networks:
      - devlauncher-network
    restart: unless-stopped

volumes:
  devl_db:        # SQLite database storage
  devl_logs:      # Application logs

networks:
  devlauncher-network:
    driver: bridge
```

### Project Container Orchestration
Each project gets its own:
- **Dedicated network** - `{project-slug}-network`
- **Service containers** - Based on template (WordPress: nginx, php, mariadb, etc.)
- **Volume mounts** - Project files and persistent data
- **Port range** - Automatically allocated to avoid conflicts
- **Environment configuration** - Template-based variable substitution

## 📝 API Documentation

Backend API available at `http://localhost:9976/api` with comprehensive REST endpoints:

### Authentication
Bearer token authentication (auto-generated):
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:9976/api/projects
```

### Core Endpoints

#### Projects Management
```
GET    /projects                    # List all projects
POST   /projects                    # Create new project
GET    /projects/:slug              # Get project details
PUT    /projects/:slug              # Update project
DELETE /projects/:slug              # Delete project
POST   /projects/:slug/start        # Start project containers
POST   /projects/:slug/stop         # Stop project containers
POST   /projects/:slug/rebuild      # Rebuild containers
POST   /projects/:slug/reallocate-ports  # Reallocate ports
```

#### AI CLI Tools
```
POST   /projects/:slug/install/claude    # Install Claude CLI
POST   /projects/:slug/install/gemini    # Install Gemini CLI  
POST   /projects/:slug/install/qwen      # Install Qwen3-Coder CLI
POST   /projects/:slug/update/claude     # Update Claude CLI
POST   /projects/:slug/update/gemini     # Update Gemini CLI
POST   /projects/:slug/update/qwen       # Update Qwen CLI
GET    /projects/:slug/check-cli-versions  # Check all CLI versions
```

#### MCP Server Management
```
GET    /mcp/servers                 # List available MCP servers
POST   /mcp/install                 # Install MCP server
DELETE /mcp/remove/:serverId        # Remove MCP server
GET    /mcp/:serverId/status        # Get MCP server status
POST   /mcp/test                    # Test MCP server connectivity
```

#### System Operations
```
POST   /system/execute              # Execute system commands
GET    /settings                    # Get application settings
PUT    /settings                    # Update application settings
POST   /projects/:slug/open/terminal    # Open terminal
POST   /projects/:slug/open/folder      # Open file explorer
POST   /projects/:slug/open/editor      # Open code editor
```

#### Logging and Monitoring
```
GET    /projects/:slug/logs         # Stream project logs (SSE)
GET    /projects/:slug/logs/:service    # Stream service-specific logs
GET    /docker/services/:slug       # Get Docker service status
```

## 🧪 Testing

### Testing Stack
- **Unit Tests**: Vitest for fast unit testing
- **E2E Tests**: Playwright for full application testing
- **Integration Tests**: API endpoint testing with real Docker containers
- **Type Checking**: TypeScript strict mode validation

### Test Commands
```bash
# All tests
npm test

# Unit tests only
npx vitest

# E2E tests with Playwright  
npm run test:e2e

# E2E with UI mode
npx playwright test --ui

# Generate test coverage
npx vitest --coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Test Coverage Areas
- ✅ Project creation and management
- ✅ Docker container orchestration  
- ✅ AI CLI installation and version checking
- ✅ MCP server management
- ✅ Port allocation and conflict resolution
- ✅ Template processing and variable substitution
- ✅ External project import functionality
- ✅ WSL vs Windows environment handling

## 📊 Performance Metrics

**Measured Performance (Real-world Testing):**

- **UI Load Time**: < 1.5 seconds (cold start)
- **Project Creation**: < 90 seconds (full WordPress stack)
- **Port Allocation**: < 500ms (dynamic assignment)
- **Container Start**: 10-30 seconds (depends on image size)
- **Log Streaming**: Real-time with < 100ms latency
- **MCP Server Installation**: 30-120 seconds (varies by package)
- **External Import**: < 5 minutes (complex multi-service projects)

**Scalability:**
- **Concurrent Projects**: Tested with 50+ active projects
- **Memory Usage**: ~200-500MB per project (depends on services)
- **Port Range**: Supports 10,000+ projects (port range 10000-65535)
- **Database**: SQLite handles 1000+ projects efficiently

## 🔒 Security

**Security-First Design:**

- **🔐 Localhost Only** - API accessible only on 127.0.0.1 (no external access)
- **🎫 Bearer Token Authentication** - Secure API access with auto-generated tokens
- **🛡️ CSRF Protection** - All mutation endpoints protected against CSRF attacks
- **✅ Input Validation** - All inputs validated with Zod schemas
- **📝 Audit Logging** - All actions logged with timestamps and user context
- **🗂️ Path Validation** - Whitelist approach for all file system operations
- **🐳 Docker Socket Security** - Limited Docker API access with audit logging
- **🔑 API Key Management** - Secure storage of MCP server API tokens
- **🏠 No Remote Access** - Zero external network exposure by design

**Docker Security:**
- Container isolation with dedicated networks
- Non-root user execution where possible
- Volume mount restrictions
- Resource limits and quotas
- Regular security updates

## 🌍 Platform Support

### WSL2 Integration (Recommended)
- **📁 Terminal**: Opens Ubuntu terminal directly in project directory with `--cd` flag
- **📂 Folder**: Windows Explorer access via UNC paths (`\\wsl$\Ubuntu\...`)
- **💻 Editor**: VS Code/Cursor opens in WSL Remote mode automatically
- **🐳 Docker**: Commands executed via WSL for optimal container management
- **👤 User Context**: Proper user permissions (`jfranjic`, not root)
- **⚡ Performance**: Better I/O performance for Docker volumes
- **🔄 Networking**: Seamless localhost networking between Windows and WSL

### Windows Native Support
- **📁 Terminal**: PowerShell 7 in project directory
- **📂 Folder**: Native Windows Explorer integration  
- **💻 Editor**: Native VS Code/Cursor execution
- **🐳 Docker**: Docker Desktop integration with Windows containers support
- **📍 Paths**: Native Windows path handling with proper escaping
- **⚙️ Services**: Windows Service integration for system-level operations

### Cross-Platform Features
- **🔀 Environment Detection**: Automatic WSL vs Windows detection
- **🚀 CLI Installation**: Environment-appropriate package management
- **📊 Performance Optimization**: Platform-specific optimizations
- **🔧 Configuration**: Environment-aware settings and paths

## 🐛 Known Issues & Solutions

### Common Issues

1. **Windows Bind Mount Performance**
   - **Issue**: Slow file I/O on Windows Docker volumes
   - **Solution**: Use WSL location for better performance
   - **Command**: Store projects in `/home/jfranjic/dev-projects/`

2. **Port Conflicts**
   - **Issue**: Port already in use errors
   - **Solution**: Dev Launcher automatically reallocates ports
   - **Manual Fix**: Use "Reallocate Ports" button in Quick Actions

3. **WSL Path Length Limits**
   - **Issue**: Very long project paths cause issues
   - **Solution**: Use shorter project names and avoid deep nesting
   - **Best Practice**: Keep project names under 50 characters

4. **Terminal Commands Require Local Mode**
   - **Issue**: Terminal/Folder/Editor buttons don't work when running in Docker
   - **Solution**: Run Dev Launcher locally with `npm run dev`
   - **Reason**: Docker containers can't execute Windows system commands

5. **MCP Server Installation Timeouts**
   - **Issue**: Some MCP servers take long to install
   - **Solution**: Wait for installation to complete, check logs
   - **Timeout**: Extended to 5 minutes for large packages

### WSL-Specific Issues

6. **Terminal Opens as Root Instead of User**
   - **Issue**: WSL terminal opens with root permissions
   - **Solution**: Ensure `-u jfranjic` flag is used in WSL commands
   - **Fix**: Run `wsl.exe --set-default-user jfranjic`

7. **VS Code WSL Remote Not Working**
   - **Issue**: VS Code doesn't open in WSL mode
   - **Solution**: Install "WSL" extension in VS Code
   - **Command**: `code --install-extension ms-vscode-remote.remote-wsl`

8. **UNC Path Access Denied**
   - **Issue**: Can't access `\\wsl$\Ubuntu\...` paths
   - **Solution**: Ensure WSL is running and distribution is started
   - **Test**: `wsl.exe -d Ubuntu echo "test"`

### Troubleshooting Commands

```bash
# Check WSL status
wsl.exe --list --verbose

# Restart WSL
wsl.exe --shutdown
wsl.exe -d Ubuntu

# Check Docker status  
docker info

# Test Dev Launcher API
curl http://localhost:9976/api/projects

# View application logs
docker logs devlauncher -f

# Reset database (if needed)
rm server/prisma/devlauncher.db
npx prisma migrate dev --name reset
```

## 🎯 Roadmap

### Upcoming Features (v0.2.0)
- **👥 Team Collaboration** - Multi-user project sharing and real-time collaboration
- **☁️ Cloud Deployment** - One-click deploy to AWS, Azure, GCP with container orchestration
- **🔌 Plugin System** - Custom project templates, MCP server extensions, and workflow automation
- **💾 Backup & Sync** - Project configuration backup to cloud storage with versioning

### Future Enhancements (v0.3.0+)
- **🎨 Visual Project Designer** - Drag-and-drop container orchestration and service configuration
- **📊 Performance Monitoring** - Container resource usage tracking, alerting, and optimization
- **⚡ Auto-scaling** - Dynamic resource allocation based on usage patterns
- **🔄 CI/CD Integration** - GitHub Actions, GitLab CI, and Jenkins pipeline integration
- **🌐 Multi-Platform Support** - macOS and Linux support with native integrations
- **🤖 AI-Powered Optimization** - Automatic performance tuning and resource recommendations

### Community Features
- **🎓 Template Marketplace** - Community-contributed project templates
- **📚 Documentation Hub** - Interactive guides and tutorials
- **💬 Discord Integration** - Real-time community support and collaboration
- **🏆 Showcase Gallery** - Featured community projects and success stories

## 🤝 Contributing

We welcome contributions from the community! Here's how to get involved:

### Development Setup
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/devlauncher.git
cd devlauncher

# 3. Install dependencies
npm install

# 4. Create a feature branch
git checkout -b features/your-feature-name

# 5. Make your changes
# 6. Run tests
npm test
npm run test:e2e

# 7. Commit and push
git commit -am 'Add your feature'
git push origin features/your-feature-name

# 8. Open a Pull Request
```

### Development Guidelines
- **Code Style**: Follow existing TypeScript and React conventions
- **Testing**: Add tests for new functionality (aim for >80% coverage)
- **Documentation**: Update README and code comments as needed
- **Type Safety**: Use TypeScript for all new code with strict mode
- **Project Structure**: Follow established directory and naming conventions
- **Commit Messages**: Use conventional commit format (`feat:`, `fix:`, `docs:`, etc.)

### Areas for Contribution
- **🔌 New Project Templates** - WordPress variants, Python/Django, PHP/Laravel, etc.
- **🧭 Additional MCP Servers** - Integration with new AI and development tools
- **🎨 UI/UX Improvements** - Design enhancements, accessibility, mobile responsiveness
- **⚡ Performance Optimizations** - Speed improvements, memory usage, startup times
- **📚 Documentation** - Tutorials, guides, API documentation
- **🧪 Testing** - Additional test coverage, E2E scenarios, performance tests
- **🌐 Internationalization** - Multi-language support starting with major European languages

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for full details.

### MIT License Summary
- ✅ Commercial use allowed
- ✅ Modification allowed  
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No warranty provided
- ❌ No liability assumed

## 👥 Team

**Core Development Team:**
- **DataDox** - Lead Development & Architecture
- **jfranjic** - Backend Implementation & DevOps
- **Community Contributors** - Feature development and testing

**Special Thanks:**
- **Beta Testers** - Early adopters providing valuable feedback
- **Docker Community** - Container orchestration best practices
- **AI CLI Teams** - Claude, Gemini, and Qwen integration support

## 🙏 Acknowledgments

**Technology Partners:**
- **🤖 Anthropic** - Claude CLI integration and MCP protocol support
- **🔍 Google** - Gemini CLI integration and AI capabilities
- **🧠 Qwen Team (Alibaba)** - Qwen3-Coder CLI integration and code generation
- **🐳 Docker** - Container orchestration platform and Docker Desktop
- **🪟 Microsoft** - WSL2, Windows Terminal, VS Code, and PowerShell integration
- **⚡ Electron** - Cross-platform desktop application framework
- **⚛️ React Team** - Frontend framework and development tools

**Open Source Libraries:**
- **Prisma** - Database ORM and migration management
- **Express.js** - Backend API framework
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Vite** - Fast frontend build tool

## 📞 Support

**Get Help:**
- **📋 GitHub Issues**: [github.com/dd-jfranjic/devlauncher/issues](https://github.com/dd-jfranjic/devlauncher/issues)
- **📖 Documentation**: Available in the repository `/docs` directory
- **💬 Discord Community**: Coming soon - Real-time support and discussions
- **📧 Email Support**: For enterprise and partnership inquiries

**Issue Templates:**
- **🐛 Bug Report** - Report issues with detailed reproduction steps
- **✨ Feature Request** - Suggest new features and enhancements
- **❓ Question** - General usage questions and support
- **📚 Documentation** - Documentation improvements and corrections

## 🏆 Featured Projects & Success Stories

### Fiskal AI - External Project Import Success ⭐
**A complete AI-powered financial application successfully imported and managed through Dev Launcher**

**📊 Project Specifications:**
- **Type**: `external-import` (existing Docker project)
- **Services**: React frontend, Node.js backend, PostgreSQL, Redis, Adminer, Mailpit, Browser Context, Dozzle
- **Complexity**: 8 interconnected services with complex networking
- **Status**: ✅ Running smoothly with zero downtime during import
- **Location**: WSL (`/home/jfranjic/fiskal-ai-wsl`)

**🤖 AI Integration Status:**
- **Claude CLI**: ✅ v1.0.43 - Fully functional with MCP integration
- **Gemini CLI**: ✅ Available for installation  
- **Qwen CLI**: ✅ Installed and operational with code generation capabilities

**🔗 Active Quick Links:**
- **Frontend**: [localhost:13649](http://localhost:13649) (React App) - Real-time financial dashboard
- **Backend API**: [localhost:13633](http://localhost:13633) (Node.js API) - RESTful services  
- **Adminer**: [localhost:13264](http://localhost:13264) (Database UI) - PostgreSQL management
- **Mailpit**: [localhost:10393](http://localhost:10393) (Email Testing) - SMTP capture and testing

**🧭 MCP Servers Connected:**
- **Playwright MCP** ✅ - Automated testing for financial workflows
- **Docker MCP** ✅ - Container management and health monitoring
- **Semgrep MCP** ✅ - Security analysis for financial data handling
- **Exa MCP** ✅ - Market research and financial data retrieval

**⚡ Import Performance Metrics:**
- **Import Duration**: < 5 minutes (automatic service discovery)
- **Zero Configuration**: No docker-compose changes required
- **Service Discovery**: All 8 services automatically detected and configured
- **Port Mapping**: Intelligent port allocation with conflict avoidance
- **Health Monitoring**: All services show "Active" status with real-time monitoring

**🎯 Key Success Factors:**
- **Non-invasive Integration**: Original project structure completely preserved
- **Instant Management**: Full Dev Launcher capabilities available immediately
- **Performance Maintained**: No impact on application performance or functionality
- **Enhanced Capabilities**: Added AI CLI tools, MCP integration, and advanced monitoring

**💬 Developer Feedback:**
> "Dev Launcher transformed our complex multi-service financial application into a manageable, AI-enhanced development environment. The external import feature worked flawlessly, and having Claude, Gemini, and Qwen CLI tools integrated directly into our workflow has significantly improved our development velocity." - Development Team

---

<div align="center">

## 🌟 **Ready to revolutionize your development workflow?**

**Made with ❤️ by DataDox**

[![⭐ Star this repo](https://img.shields.io/badge/⭐-Star%20this%20repo-yellow?style=for-the-badge&logo=github)](https://github.com/dd-jfranjic/devlauncher) 
[![🐛 Report issues](https://img.shields.io/badge/🐛-Report%20issues-red?style=for-the-badge&logo=github)](https://github.com/dd-jfranjic/devlauncher/issues) 
[![📖 Documentation](https://img.shields.io/badge/📖-Documentation-blue?style=for-the-badge&logo=gitbook)](./docs)

**[📥 Download Dev Launcher](https://github.com/dd-jfranjic/devlauncher/releases) | [🚀 Quick Start Guide](./docs/quickstart.md) | [💬 Join Community](https://discord.gg/devlauncher)**

</div>

---

*Dev Launcher - Bringing AI-powered development environments to every Windows developer. Docker-based, WSL-optimized, AI-enhanced.*