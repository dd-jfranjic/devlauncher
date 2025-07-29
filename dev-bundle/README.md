# 🧠 DevLauncher by Datadox

The ultimate development environment starter kit - GUI tool for managing Claude Code projects with automatic Docker MCP integration, WordPress instances, and multiple AI frameworks. Get from idea to coding in under 60 seconds!

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/devlauncher.git
cd devlauncher/dev-bundle

# Install dependencies
cd launcher-app
npm install

# Start the core MCP stack
cd ../core-mcp-stack
docker compose up -d

# Run the app
cd ../launcher-app
npm run dev
```

## 🎯 Features

### Project Management
- Visual project creation wizard
- Multiple project templates (WordPress, Static, AI Agent, Node.js)
- One-click project start/stop
- Integrated VS Code launcher

### MCP Integration
- Automatic Docker MCP server registration
- Pre-configured services:
  - Docker Toolkit MCP
  - MySQL Database
  - Redis Cache
  - WordPress MCP
  - Mailpit (email testing)
  - FileBrowser

### Development Methodologies
- **PRPs (Product Requirement Prompts)** - Structured AI development
- **Context Engineering** - Optimized Claude interactions
- **PocketFlow** - AI agent integration

## 📁 Project Structure
```
dev-bundle/
├── launcher-app/          # Electron GUI application
├── core-mcp-stack/        # Central Docker MCP servers
├── templates/             # Project templates
│   ├── wordpress/         # WordPress development
│   ├── PRPs/             # PRPs methodology templates
│   └── shared/           # Shared resources
└── scripts/              # Helper scripts
```

## 🔧 Configuration

### MCP Services
Services are defined in `core-mcp-stack/docker-compose.yml` and registered via `servers.json`.

### Project Templates
Templates are stored in `/templates/` and copied when creating new projects.

### Environment Variables
Each project gets a `.env` file with:
- Port configurations
- Database credentials
- Service URLs

## 🛠 Development

### Building from Source
```bash
cd launcher-app
npm run build
```

### Creating Distributions
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 📝 Usage Guide

### Creating a New Project
1. Click "New Project" button
2. Enter project name and location
3. Select project type
4. Choose integrations (MCP, PRPs, etc.)
5. Click "Create Project"

### Managing Projects
- **Start/Stop**: Click play/stop button on project card
- **Open in VS Code**: Click code icon
- **View Logs**: Access via Docker Desktop

### Using PRPs
When PRPs is enabled:
```bash
# Generate a new PRP
claude /prp "Implement user authentication"

# Validate PRP structure
node PRPs/scripts/validate-prp.js auth.md

# Execute PRP
claude /execute PRPs/auth.md
```

## 🤝 Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License
MIT License - see LICENSE file for details

## 🙏 Acknowledgments
- Claude Code team at Anthropic
- Docker MCP Toolkit contributors
- PRPs methodology by Wirasm