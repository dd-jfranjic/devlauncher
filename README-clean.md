# DevLauncher 🚀

A powerful desktop application for managing WordPress development environments with Docker integration, Claude Code AI assistant, and WordPress MCP support.

![DevLauncher](https://img.shields.io/badge/Electron-React-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Docker](https://img.shields.io/badge/Docker-Required-blue) ![Platform](https://img.shields.io/badge/Platform-Windows-blue)

## 🎯 Overview

DevLauncher is an Electron + React + TypeScript desktop application that simplifies WordPress development by providing:
- One-click WordPress project creation with Docker
- Integrated Claude Code AI development assistant
- WordPress MCP (Model Context Protocol) for AI-powered WordPress interactions
- Multiple AI frameworks support (PRPs, Context Engineering, SuperClaude)
- GUI integration with Claudia (Claude Code desktop interface)

## ✨ Key Features

- 🚀 **One-Click WordPress Setup** - Create new WordPress projects with Docker Compose
- 🤖 **Claude Code Integration** - Built-in support for AI-powered development
- 🔌 **WordPress MCP Support** - Enable Claude to interact with WordPress directly
- 🎨 **Modern UI** - Beautiful, responsive interface built with React and Tailwind CSS
- 🐳 **Docker Integration** - Automatic container management
- 📧 **Built-in Mailpit** - Catch all emails for testing
- 🗄️ **phpMyAdmin** - Database management interface included
- 🧩 **Multiple MCP Integrations** - Docker, Semgrep, Exa AI, Ref Tools, Jina AI
- 📚 **AI Frameworks** - PRPs, Context Engineering, Claudia GUI, SuperClaude
- ✨ **SuperClaude Framework** - 16 slash commands for enhanced development

## 🖥️ System Requirements

- **OS**: Windows 10/11 (64-bit)
- **PowerShell**: 5.1+ (pre-installed on Windows)
- **Docker Desktop**: Latest version with WSL2 backend
- **Node.js**: v18+ with npm
- **Git**: For version control and cloning repositories
- **Python**: 3.8+ (for SuperClaude Framework)
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 20GB+ free space

## 📦 Installation

### From Source

1. **Clone the repository**
   ```powershell
   git clone https://github.com/dd-jfranjic/devlauncher.git
   cd devlauncher
   ```

2. **Install dependencies**
   ```powershell
   cd dev-bundle/launcher-app
   npm install
   ```

3. **Run in development mode**
   ```powershell
   npm run dev
   ```

4. **Build for production**
   ```powershell
   npm run build
   npm run dist
   ```

The built application will be in `dev-bundle/launcher-app/release/`

## 🚀 Quick Start

1. **Start Docker Desktop** - Ensure Docker is running before launching DevLauncher

2. **Launch DevLauncher** - Run the executable or `npm run dev`

3. **Create New Project**

   - Click "New Project" button
   - Enter project name (automatically sanitized)
   - Select location for project files
   - Enable desired features (Claude Code, WordPress MCP)
   - Click "Create Project"

4. **Install WordPress** (Blue download icon)
   - Once Docker containers are running
   - Click the blue download icon
   - WordPress will be installed with default credentials

5. **Access Your Site**
   - WordPress: `http://localhost:[PORT]`
   - Admin: `http://localhost:[PORT]/wp-admin`
   - Default credentials: admin / password

## 🔧 Features in Detail

### WordPress Development
- **Docker-based environment** - Isolated, reproducible WordPress installations
- **LocalWP-compatible structure** - Familiar directory layout
- **Multiple projects** - Run multiple WordPress sites simultaneously
- **One-click operations** - Start/stop containers, install WordPress, auto-login

### AI Development Tools
- **Claude Code** - AI pair programmer installed locally per project
- **WordPress MCP** - Let Claude interact with your WordPress site
- **PRPs Framework** - Product Requirement Prompts methodology
- **Context Engineering** - Advanced AI context management
- **Claudia GUI** - Desktop interface for Claude Code
- **SuperClaude Framework** - 16 specialized slash commands

### MCP Integrations
- **Docker MCP Gateway** - Control Docker through Claude
- **Semgrep** - Code security analysis
- **Exa AI** - Web search and research
- **Ref Tools** - API documentation access
- **Jina AI** - Advanced search capabilities

### Developer Tools
- **VS Code integration** - Open projects directly in VS Code
- **PowerShell terminal** - Quick access to project directory
- **Windows Explorer** - Browse project files
- **phpMyAdmin** - Database management
- **Mailpit** - Email testing

## 🏗️ Project Structure

```
devlauncher/
├── dev-bundle/
│   ├── launcher-app/         # Main Electron application
│   │   ├── electron/        # Electron main process
│   │   ├── src/            # React frontend
│   │   │   ├── components/ # UI components
│   │   │   ├── pages/     # Page components
│   │   │   ├── config/    # Configuration files
│   │   │   └── types/     # TypeScript definitions
│   │   └── package.json   
│   ├── templates/          # Project templates
│   │   └── wordpress/     # WordPress Docker template
│   └── build-claudia-final.bat  # Claudia build script
├── MCP-INTEGRATIONS.md    # MCP documentation
├── CLAUDE.md             # Project guidelines for Claude
└── README.md            # This file
```

### Created WordPress Project Structure
```
project-name/
├── app/
│   └── public/           # WordPress files + Claude Code
│       ├── wp-content/   # WordPress content
│       ├── .claude/      # Claude Code config
│       └── package.json  # Node.js dependencies
├── docker-compose.yml    # Docker configuration
├── .env                  # Environment variables
└── conf/                # Server configurations
```

## 🔌 WordPress MCP Setup

Complete workflow for enabling Claude to interact with WordPress:

1. **Build WordPress MCP** (Puzzle icon)
2. **Copy Plugin Files** (Green folder icon)
3. **Install Composer Dependencies** (Cyan cube icon - if needed)
4. **Activate Plugin & Generate Token** (Manual in WP Admin)
5. **Configure Claude Code** (Yellow key icon - paste JWT token)

Detailed instructions in `MCP-INTEGRATIONS.md`

## 🛠️ Development

### Technologies Used
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Desktop**: Electron with context isolation
- **Icons**: Heroicons
- **State**: React Hooks + Electron Store
- **Docker**: Docker Compose for containerization

### Commands
```powershell
# Development
npm run dev          # Start dev server + Electron
npm run type-check   # TypeScript checking

# Building
npm run build        # Build frontend
npm run electron     # Run Electron only
npm run dist         # Package application

# Docker operations (per project)
docker-compose up -d     # Start containers
docker-compose down      # Stop containers
docker-compose ps        # Check status
```

### Adding New Features

1. **New MCP Integration**
   - Add to `src/config/mcpIntegrations.ts`
   - Update handler in `ProjectDetail.tsx`
   - Document in `MCP-INTEGRATIONS.md`

2. **New Project Type**
   - Create template in `templates/`
   - Update project creation logic
   - Add type to TypeScript definitions

## 🐛 Troubleshooting

### Common Issues

**Docker not starting**
- Ensure Docker Desktop is running
- Enable WSL2 backend in Docker settings
- Check Windows Virtualization is enabled

**Port conflicts**
- DevLauncher uses random ports (10000-15000)
- Check for conflicting services
- Ports are stored per project

**MCP installation fails**
- Ensure Claude Code is installed: `npm install -g @anthropic-ai/claude-code`
- Run from project's `app/public` directory
- Check Python/Node.js installation for specific MCPs

**PowerShell execution errors**
- Run as Administrator if needed
- Set execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Credits

Created by [dd-jfranjic](https://github.com/dd-jfranjic)

Special thanks to:
- Anthropic for Claude and Claude Code
- WordPress community
- All MCP integration authors

## 📞 Support

- GitHub Issues: [https://github.com/dd-jfranjic/devlauncher/issues](https://github.com/dd-jfranjic/devlauncher/issues)
- Documentation: Check CLAUDE.md and MCP-INTEGRATIONS.md for detailed guides

---

**Note**: This project is designed for local development only. Do not use default passwords in production environments.