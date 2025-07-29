# Playwright MCP Windows Fix Guide

## Problem
Playwright MCP shows as "Failed to connect" even with correct package `@playwright/mcp@latest`

## Root Causes on Windows
1. **Process spawning issues** - How Claude spawns processes on Windows
2. **Missing Playwright browsers** - Browsers need to be installed first
3. **Path/Shell issues** - Windows command execution quirks
4. **STDIO communication** - Windows handles stdio differently

## Step-by-Step Fix

### 1. First, Install Playwright Browsers
```powershell
# This is CRITICAL - without browsers, MCP won't start
npx playwright install
```

### 2. Test Direct Execution
```powershell
# This should start and wait for input
npx @playwright/mcp@latest

# If it works, press Ctrl+C to exit
```

### 3. Try Different Configuration Methods

#### Method A: With Explicit STDIO
```powershell
claude mcp remove playwright
claude mcp add --stdio playwright "npx @playwright/mcp@latest"
```

#### Method B: Using CMD Wrapper
```powershell
claude mcp remove playwright
claude mcp add playwright "cmd /c npx @playwright/mcp@latest"
```

#### Method C: Using PowerShell Wrapper
```powershell
claude mcp remove playwright  
claude mcp add playwright "powershell -Command npx @playwright/mcp@latest"
```

#### Method D: Using Batch File Wrapper
1. Copy the `playwright-mcp-wrapper.bat` I created to:
   ```
   C:\Users\jfran\Documents\dev\fiskal-ai\playwright-mcp-wrapper.bat
   ```

2. Then add it to Claude:
   ```powershell
   claude mcp remove playwright
   claude mcp add playwright "C:\\Users\\jfran\\Documents\\dev\\fiskal-ai\\playwright-mcp-wrapper.bat"
   ```

### 4. Global Installation Method
```powershell
# Install globally
npm install -g @playwright/mcp

# Find where it's installed
where playwright-mcp

# Add to Claude with full path
claude mcp add playwright "C:\\Users\\jfran\\AppData\\Roaming\\npm\\playwright-mcp.cmd"
```

### 5. Debug What's Happening
Run the debug script I created:
```powershell
.\debug-playwright-mcp-deep.ps1
```

This will:
- Test direct execution
- Check browser installation
- Test different configurations
- Show environment details

## Alternative: Use Docker MCP Instead

Since you already have Docker MCP working, you can use Puppeteer through Docker:

```powershell
# Your docker-mcp already has puppeteer tool
# Just use that instead of Playwright for now
```

## Quick Checklist

- [ ] Node.js 18+ installed? `node --version`
- [ ] Playwright browsers installed? `npx playwright install`
- [ ] Direct execution works? `npx @playwright/mcp@latest`
- [ ] Tried with --stdio flag?
- [ ] Tried with cmd wrapper?
- [ ] Checked antivirus/firewall?

## If Nothing Works

1. **Check Claude logs**:
   ```powershell
   claude --debug
   ```

2. **Use alternative browser automation**:
   - Docker MCP with Puppeteer
   - Your browser-context service in Docker

3. **Report issue**:
   - https://github.com/microsoft/playwright-mcp/issues

The most likely fix is installing Playwright browsers first:
```powershell
npx playwright install
```

Then trying the --stdio configuration:
```powershell
claude mcp add --stdio playwright "npx @playwright/mcp@latest"
```