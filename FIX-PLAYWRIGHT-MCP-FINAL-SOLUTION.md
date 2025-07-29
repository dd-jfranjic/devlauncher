# FINAL SOLUTION: Playwright MCP on Windows

## The Problem
On Windows, `npx` is a batch script (.cmd file) that requires a command interpreter. When Claude tries to execute `npx` directly via stdio, it fails because Windows can't execute batch scripts directly.

## The Solution

### Method 1: Use CMD Wrapper (RECOMMENDED)
```powershell
# Remove existing configuration
claude mcp remove playwright

# Add with CMD wrapper
claude mcp add playwright "cmd /c npx @playwright/mcp@latest"
```

### Method 2: Alternative CMD syntax
```powershell
claude mcp remove playwright
claude mcp add --stdio playwright cmd /c "npx @playwright/mcp@latest"
```

### Method 3: Use PowerShell wrapper
```powershell
claude mcp remove playwright
claude mcp add playwright "powershell -Command npx @playwright/mcp@latest"
```

## Why This Works

1. **Windows Batch Files**: On Windows, `npx` is actually `npx.cmd` - a batch file
2. **Direct Execution**: Windows can't execute batch files directly without a command interpreter
3. **CMD Wrapper**: Using `cmd /c` provides the necessary interpreter
4. **The `/c` flag**: Tells cmd.exe to execute the command and then terminate

## Testing The Fix

Before adding to Claude, test if the command works:
```powershell
cmd /c npx @playwright/mcp@latest
```

This should start and wait for input (not exit immediately).

## If Still Having Issues

1. **Check Node.js Installation**:
   ```powershell
   where node
   where npx
   ```
   Make sure they're in Windows (not just WSL)

2. **Install Playwright Browsers**:
   ```powershell
   npx playwright install
   ```

3. **Try with explicit paths**:
   ```powershell
   claude mcp add playwright "cmd /c C:\Users\jfran\AppData\Roaming\npm\npx.cmd @playwright/mcp@latest"
   ```

## Update DevLauncher Button

We also need to update the DevLauncher button to use the CMD wrapper:

```typescript
installCommand: 'claude mcp add playwright "cmd /c npx @playwright/mcp@latest"',
```

## Common Windows MCP Issues

1. **Batch Script Execution**: Always wrap npx/npm commands with `cmd /c`
2. **Path Issues**: Ensure Node.js is in Windows PATH, not just WSL
3. **STDIO Communication**: Windows handles stdio differently than Unix
4. **Antivirus**: Some antivirus software blocks MCP server connections

## Source
This solution is based on official MCP documentation and community reports:
- https://github.com/modelcontextprotocol/servers/issues/1097
- https://mcpcat.io/guides/fixing-mcp-error-32000-connection-closed/