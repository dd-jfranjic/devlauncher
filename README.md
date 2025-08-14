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
- 🧭 **MCP Protocol support** - Model Context Protocol server management
- 🔗 **Quick Links** - Instant access to project services and admin panels
- 📁 **External project import** - Import existing Docker projects seamlessly

## 📋 Prerequisites

- **Windows 11** (or Windows 10 version 2004+)
- **WSL2** with Ubuntu distribution
- **Docker Desktop** for Windows
- **Node.js 20+** (for development)
- **PowerShell 7** (recommended)
- **Windows Terminal** (recommended)
- **VS Code or Cursor** (optional)

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/dd-jfranjic/devlauncher.git
cd devlauncher
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup the database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init
```

### 4. Run Dev Launcher in Docker container

```bash
# Build and start the container
docker compose up -d

# Check logs
docker logs devlauncher -f
```

The Dev Launcher backend will be available at `http://localhost:9976`

### 5. Launch the Electron application

```bash
# In a new terminal
npm run dev:client
```

## 🚀 Usage

### Creating a new project

1. Click **"New Project"** in the sidebar
2. Enter project name and slug
3. Choose project type (Blank, Next.js, WordPress)
4. Select location (WSL or Windows)
5. Configure variables and ports
6. Click **"Create Project"**

### Managing projects

- **Start/Stop** - Launch or stop Docker containers
- **Quick Actions** - Terminal, Folder, Editor, Port reallocation
- **Quick Links** - Direct access to running services (Frontend, API, Admin panels)
- **Docker Tab** - Container management and service status
- **Logs Tab** - Real-time container log streaming
- **MCP Tab** - Model Context Protocol server management

### AI CLI Tools Integration

Dev Launcher provides seamless integration with three major AI coding assistants:

1. Open any project
2. Go to **Overview** tab  
3. Install AI CLI tools (automatic detection and installation):

#### **Claude CLI** (✅ Fully Supported)
- **Provider**: Anthropic
- **Installation**: `npm install -g @anthropic-ai/claude-cli`
- **Features**: Continue mode, Bypass permissions, Debug mode, MCP integration
- **Version Detection**: Live version checking and updates
- **Buttons**: Claude, Continue, Bypass, Bypass+Continue, MCP List, Debug

#### **Gemini CLI** (✅ Fully Supported)  
- **Provider**: Google
- **Installation**: `npm install -g @google/gemini-cli`
- **Features**: Interactive chat, Search capabilities, Multiple model support
- **Version Detection**: Automatic version checking and updates
- **Buttons**: Gemini, Help, Search

#### **Qwen3-Coder CLI** (✅ Fully Supported)
- **Provider**: Qwen Team (Alibaba)  
- **Installation**: `npm install -g @qwen-code/qwen-code`
- **Features**: Advanced code generation, Multi-language support
- **Repository**: https://github.com/QwenLM/Qwen3-Coder
- **Version Detection**: Automatic installation verification
- **Buttons**: Qwen, Help, Version

All CLI tools support both **WSL** and **Windows** environments with proper terminal integration.

### MCP Server Management

Dev Launcher includes a comprehensive MCP (Model Context Protocol) server ecosystem:

1. Navigate to **MCP Tab**
2. **One-click installation** for all MCP servers
3. **Automatic API token management** for services requiring authentication
4. **Live status monitoring** and health checks

#### **Available MCP Servers (10 Total):**

**🎭 Testing & Automation**
- **Playwright MCP** ✅ - Browser automation, E2E testing, screenshot capture
- **Docker Container Manager** ✅ - Container lifecycle management, compose orchestration

**🔒 Security & Analysis** 
- **Semgrep MCP** ✅ - Static code analysis, security vulnerability detection (API token required)

**🔍 Search & Research**
- **Exa MCP** ✅ - AI-powered web search, company research (API key required)  
- **Jina MCP Tools** ✅ - Neural search, content extraction (API key required)
- **Ref Tools MCP** ✅ - Documentation search, hallucination prevention (API key required)

**🗄️ Database Operations**
- **Supabase MCP** - PostgreSQL operations, authentication management
- **MySQL MCP Server** - MySQL database management and queries

**🐳 Docker Integration**
- **Docker MCP Gateway** - Official Docker enterprise gateway for containerized MCP servers

**⚡ Additional Tools**
- Custom MCP servers can be easily added through configuration

#### **Installation Process:**
- **No Global Install Required** - Uses `npx` for npm packages, `uvx` for Python packages
- **WSL Optimized** - All installations execute in proper WSL user context
- **API Token Management** - Secure token storage and configuration
- **Verification** - `claude mcp list` shows all connected servers

### External Project Import

Dev Launcher supports importing existing Docker projects:

1. Click **"New Project"** → **"External Import"**
2. Provide existing project details:
   - **Name**: Display name for the project
   - **Slug**: URL-friendly identifier
   - **Docker Project Name**: Existing docker-compose project name
   - **Host Path**: Path to the existing project directory
3. Dev Launcher will:
   - Parse existing docker-compose.yml for services and ports
   - Import service configurations automatically
   - Maintain original project structure
   - Add Dev Launcher management capabilities

**Example**: Fiskal AI project successfully imported and managed through Dev Launcher.

## 🛠️ Development

### Project structure

```
devlauncher/
├── server/              # Backend API (Node.js + Express + Prisma)
│   ├── src/api/        # REST API endpoints
│   ├── src/services/   # Business logic services
│   ├── src/utils/      # Utility functions
│   └── prisma/         # Database schema and migrations
├── client/             # Frontend (React + Vite + TypeScript)
│   ├── src/components/ # React components
│   ├── src/stores/     # Zustand state management
│   ├── src/lib/        # API client and utilities
│   └── src/styles/     # Tailwind CSS styles
├── templates/          # Project templates
│   ├── wordpress/      # WordPress + MariaDB + phpMyAdmin + Mailpit
│   ├── nextjs/        # Next.js + TypeScript + Tailwind
│   └── blank/         # Empty template for custom projects
├── .claude/           # Claude Code sub-agents
└── docker-compose.yml # Dev Launcher container configuration
```

### Development mode

```bash
# Start all services in development mode
npm run dev

# Or individually:
npm run dev:server   # Backend API server
npm run dev:client   # Frontend React app
```

### Build for production

```bash
npm run build
npm run electron:build
```

## 🐳 Docker Architecture

Dev Launcher uses an "All-in-Docker" approach:

- **devlauncher container** - Backend API server
- **Per-project containers** - Each project has its own container stack
- **Isolated networks** - Each project has its own Docker network
- **Named volumes** - For persistent data storage
- **Port allocation** - Dynamic port assignment with conflict resolution

### Docker Compose Configuration

```yaml
services:
  devlauncher:
    build: .
    container_name: devlauncher
    ports:
      - "127.0.0.1:9976:9976"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # Docker API access
      - devl_db:/app/server/prisma                 # Database persistence
      - devl_logs:/app/.devlauncher/logs           # Log storage
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
```

## 📝 API Documentation

The backend API is available at `http://localhost:9976/api`

### Authentication

All API calls require a Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:9976/api/projects
```

The token is automatically generated on first run and stored in the database.

### Main endpoints

#### Projects
- `GET /projects` - List all projects
- `POST /projects` - Create new project
- `GET /projects/:slug` - Get project details
- `POST /projects/:slug/start` - Start project containers
- `POST /projects/:slug/stop` - Stop project containers
- `DELETE /projects/:slug` - Delete project

#### CLI Tools
- `POST /projects/:slug/install/claude` - Install Claude CLI
- `POST /projects/:slug/install/gemini` - Install Gemini CLI
- `POST /projects/:slug/install/qwen` - Install Qwen CLI
- `GET /projects/:slug/check-cli-versions` - Check CLI versions

#### MCP Servers
- `GET /mcp/servers` - List available MCP servers
- `POST /mcp/install` - Install MCP server
- `DELETE /mcp/remove/:serverId` - Remove MCP server

#### System
- `POST /system/execute` - Execute system commands (terminal, folder, editor)
- `GET /settings` - Get application settings
- `PUT /settings` - Update application settings

## 🧪 Testing

```bash
# Unit tests
npm test

# End-to-end tests with Playwright
npm run test:e2e

# Linting
npm run lint

# Type checking
npm run typecheck
```

## 📊 Performance

- **UI load time**: < 1.5s
- **Project creation**: < 90s
- **Port allocation**: < 500ms
- **Support for 1000+ projects**

## 🔒 Security

- **Localhost only** - API accessible only on 127.0.0.1
- **Bearer token authentication** - Secure API access
- **CSRF protection** - For all mutations
- **Input validation** - All inputs validated with Zod
- **Audit logging** - All actions logged for security
- **Path validation** - Whitelist approach for file operations
- **Docker socket security** - Limited access with audit logging

## 🌍 Platform Support

### WSL Integration

- **Terminal**: Opens Ubuntu terminal directly in project directory
- **Folder**: Access via Windows Explorer using UNC paths (`\\wsl$\Ubuntu\...`)
- **Editor**: VS Code/Cursor opens in WSL Remote mode
- **Docker**: Commands executed via WSL for proper container management
- **Permissions**: Proper user context (jfranjic, not root)

### Windows Native

- **Terminal**: PowerShell 7 in project directory
- **Folder**: Windows Explorer integration
- **Editor**: Native VS Code/Cursor
- **Docker**: Docker Desktop integration
- **Paths**: Native Windows path handling

## 🐛 Known Issues

1. **Windows bind mount performance** - Use WSL location for better performance
2. **Port conflicts** - Application automatically reallocates ports
3. **WSL path length limits** - Use shorter project names
4. **Terminal commands require local Dev Launcher** - Not available when running in Docker

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

## 🎯 Roadmap

### Upcoming Features (v0.2.0)
- **🧠 Archon AI Integration** - Global AI command center for cross-project knowledge
- **👥 Team collaboration** - Multi-user project sharing and real-time collaboration
- **☁️ Cloud deployment** - One-click deploy to AWS, Azure, GCP
- **🔌 Plugin system** - Custom project templates and MCP server extensions
- **💾 Backup & sync** - Project configuration backup to cloud storage

### Future Enhancements
- **Visual project designer** - Drag-and-drop container orchestration
- **Performance monitoring** - Container resource usage tracking
- **Auto-scaling** - Dynamic resource allocation
- **CI/CD integration** - GitHub Actions, GitLab CI support

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b features/new-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -am 'Add new feature'`)
6. Push to the branch (`git push origin features/new-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Use TypeScript for all new code
- Follow the established project structure

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **DataDox** - Lead Development
- **jfranjic** - Architecture & Implementation

## 🙏 Acknowledgments

- **Anthropic** - Claude CLI integration
- **Google** - Gemini CLI integration
- **Qwen Team** - Qwen3-Coder CLI integration
- **Docker** - Container orchestration platform
- **Microsoft** - WSL2 and Windows Terminal
- **Electron** - Cross-platform desktop framework

## 📞 Support

- **GitHub Issues**: [github.com/dd-jfranjic/devlauncher/issues](https://github.com/dd-jfranjic/devlauncher/issues)
- **Documentation**: Available in the `/docs` directory
- **Discord**: Community support (coming soon)

## 🏆 Featured Projects & Success Stories

### Fiskal AI - External Project Import Success
A complete AI-powered financial application successfully imported and managed through Dev Launcher:

**📊 Project Details:**
- **Type**: external-import (existing Docker project)
- **Services**: React frontend, Node.js backend, PostgreSQL, Redis, Adminer, Mailpit, Browser Context, Dozzle
- **Status**: ✅ Running smoothly with zero downtime during import
- **Location**: WSL (/home/jfranjic/fiskal-ai-wsl)

**🤖 AI Integration Status:**
- **Claude CLI**: ✅ v1.0.43 (fully functional with MCP integration)
- **Gemini CLI**: Available for installation  
- **Qwen CLI**: ✅ Installed and operational

**🔗 Quick Links Active:**
- **Frontend**: localhost:13649 (React App)
- **API**: localhost:13633 (Backend API)  
- **Adminer**: localhost:13264 (Database UI)
- **Mailpit**: localhost:10393 (Email Testing)

**🧭 MCP Servers Connected:**
- Playwright MCP for testing automation
- Docker MCP for container management
- Multiple research and security tools available

**⚡ Performance:**
- Import completed in < 5 minutes
- All services auto-discovered and configured
- Zero configuration required for existing containers
- Native WSL terminal integration working perfectly

---

<div align="center">

**Made with ❤️ by DataDox**

[⭐ Star this repo](https://github.com/dd-jfranjic/devlauncher) | [🐛 Report issues](https://github.com/dd-jfranjic/devlauncher/issues) | [📖 Documentation](./docs)

</div>