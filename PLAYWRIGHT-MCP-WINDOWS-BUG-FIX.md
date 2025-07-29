# PLAYWRIGHT MCP WINDOWS BUG FIX

## The Real Problem
Claude MCP has a bug on Windows where the `/c` flag in `cmd /c` gets converted to `C:/` in the configuration file!

## WORKING SOLUTIONS

### Solution 1: Use Double Dash (RECOMMENDED)
```powershell
# Remove existing
claude mcp remove playwright

# Add with double dash
claude mcp add playwright npx -- @playwright/mcp@latest
```

### Solution 2: Direct npx without cmd wrapper
```powershell
claude mcp remove playwright
claude mcp add playwright npx @playwright/mcp@latest
```

### Solution 3: Check and fix the config manually
1. Open `C:\Users\jfran\.claude.json`
2. Look for the playwright section
3. If you see `"C:/"` instead of `/c`, that's the bug!
4. Manually edit it to fix

### Solution 4: Use alternative syntax
```powershell
claude mcp remove playwright
claude mcp add --stdio playwright npx @playwright/mcp@latest
```

## Why This Happens

- Claude's command parser has a bug where it interprets `/c` as a Windows path `C:/`
- This is a known issue: https://github.com/anthropics/claude-code/issues/4158
- The bug affects any Windows command that uses forward slashes

## Testing

After adding, check your configuration:
```powershell
# Look at the playwright section in:
cat C:\Users\jfran\.claude.json | Select-String -Pattern "playwright" -Context 5
```

If you see `"C:/"` instead of `/c`, the bug occurred and you need to use one of the alternative methods.

## Update for DevLauncher

We should update the DevLauncher button to use the working syntax:

```typescript
installCommand: 'claude mcp add playwright npx -- @playwright/mcp@latest',
```

This avoids the `/c` parsing bug entirely!