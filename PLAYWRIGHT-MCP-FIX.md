# Playwright MCP Fix Guide

## The Issue
The Playwright MCP server is failing to connect with error:
```
MCP error -32000: Connection closed
```

This is because you installed `@executeautomation/playwright-mcp` instead of the official `@playwright/mcp` package.

## Quick Fix

Run this in PowerShell from your fiskal-ai project:

```powershell
# 1. Navigate to your project
cd C:\Users\jfran\Documents\dev\fiskal-ai

# 2. Remove the incorrect Playwright MCP
claude mcp remove playwright

# 3. Add the official Playwright MCP
claude mcp add playwright "npx @playwright/mcp@latest"

# 4. Check if it's working
claude mcp list
```

## If Still Not Working

### Option 1: Install Playwright First
```powershell
# Install Playwright globally
npm install -g @playwright/mcp

# Install browser binaries
npx playwright install chromium

# Then add to Claude
claude mcp add playwright "npx @playwright/mcp@latest"
```

### Option 2: Use Alternative Command Format
```powershell
# Try with --stdio flag
claude mcp add --stdio playwright "npx @playwright/mcp"
```

### Option 3: Manual Configuration
Edit `C:\Users\jfran\.claude.json` and update the playwright section:

```json
"playwright": {
  "command": "npx",
  "args": ["@playwright/mcp@latest"],
  "type": "stdio"
}
```

## Prerequisites Check

1. **Node.js 18+**:
   ```powershell
   node --version  # Should be v18 or higher
   ```

2. **NPM is working**:
   ```powershell
   npm --version
   ```

3. **Playwright browsers installed**:
   ```powershell
   npx playwright install
   ```

## Full Reinstall Steps

If nothing works, do a complete reinstall:

```powershell
# 1. Remove Playwright MCP
claude mcp remove playwright

# 2. Clear npm cache
npm cache clean --force

# 3. Install Playwright globally
npm install -g playwright
npm install -g @playwright/mcp

# 4. Install browsers
npx playwright install

# 5. Add to Claude
claude mcp add playwright "npx @playwright/mcp@latest"

# 6. Restart Claude
# Exit Claude (Ctrl+C) and run again:
claude
```

## Verification

After fixing, when you run `claude mcp list`, you should see:
```
playwright: npx @playwright/mcp@latest - ✓ Connected
```

## Alternative MCP Servers for Browser Automation

If Playwright MCP continues to have issues, consider using:
- **puppeteer** - Similar browser automation capabilities
- **browser** - Built-in browser context server in your Docker setup

## Using the Scripts

I've created two PowerShell scripts to help:

1. **fix-playwright-mcp.ps1** - Quick fix script
2. **troubleshoot-playwright-mcp.ps1** - Comprehensive troubleshooting

Run them from PowerShell:
```powershell
.\fix-playwright-mcp.ps1
# or
.\troubleshoot-playwright-mcp.ps1
```