# WordPress Claude Code Installation Guide

## Important: Installation Location for WordPress Projects

When working with WordPress projects in DevLauncher, Claude Code and all MCP integrations **MUST** be installed and run from the WordPress public directory:

```
project-root/
├── app/
│   └── public/     ← Claude Code MUST be installed HERE
│       ├── .claude/    ← Claude configuration directory
│       ├── wp-content/
│       ├── wp-admin/
│       └── ...
├── docker-compose.yml
└── ...
```

## Why This Matters

1. **WordPress Context**: Claude Code needs to be in the WordPress root to properly analyze and work with WordPress files
2. **MCP Integrations**: MCP servers need to access WordPress files and database from the correct location
3. **Path Resolution**: Many tools expect to find WordPress files relative to the current directory

## Correct Installation Process

### 1. Install Claude Code (Purple Terminal Icon)
This automatically:
- Changes to `app/public` directory
- Runs `npm install -g @anthropic-ai/claude-code`
- Sets up the workspace in the correct location

### 2. Install MCP Integrations
All MCP installations (Docker, WordPress MCP, etc.) automatically:
- Change to `app/public` directory first
- Install the MCP from that location
- Configure Claude to use them from the WordPress directory

### 3. Always Start Claude from WordPress Directory

**Correct way to start Claude:**
```powershell
cd C:\path\to\project\app\public
claude
```

**Helper script created automatically:**
- DevLauncher creates `start-claude.bat` in your project root
- Double-click it to start Claude from the correct location

## Common Issues and Solutions

### Issue: "No MCP servers found" when running Claude
**Cause**: Running Claude from the project root instead of `app/public`
**Solution**: 
```powershell
cd app\public
claude
```

### Issue: MCP installations fail
**Cause**: Not in the correct directory
**Solution**: Always use the DevLauncher buttons which handle directory changes automatically

### Issue: Claude can't find WordPress files
**Cause**: Running from wrong directory
**Solution**: Ensure you're in `app/public` before starting Claude

## Best Practices

1. **Always use DevLauncher buttons** - They handle directory navigation automatically
2. **Use the helper script** - `start-claude.bat` ensures correct directory
3. **Check your location** - Run `pwd` or `cd` to verify you're in `app/public`
4. **MCP commands** - Always run `claude mcp` commands from `app/public`

## Directory Structure After Proper Installation

```
project-root/
├── app/
│   └── public/
│       ├── .claude/           ← Claude configuration
│       │   ├── claude.json
│       │   └── commands/
│       ├── package.json       ← Created by npm init
│       ├── node_modules/      ← If any local packages installed
│       ├── wordpress-mcp/     ← WordPress MCP plugin source
│       ├── SuperClaude/       ← SuperClaude Framework
│       └── [WordPress files]
└── start-claude.bat          ← Helper to start Claude correctly
```

## Manual Fix for Existing Projects

If Claude was installed in the wrong location, run this PowerShell script:

```powershell
# Fix Claude location for WordPress project
cd C:\path\to\project
.\dev-bundle\templates\wordpress\fix-claude-location.ps1
```

This script will:
1. Check for WordPress structure
2. Move/reinstall Claude in the correct location
3. Create helper scripts
4. Update configurations

## Remember

**Golden Rule**: For WordPress projects, ALWAYS work from `app/public` directory when using Claude Code!