# PowerShell Scripts Documentation

This document details all PowerShell scripts used in the DevLauncher WordPress MCP integration.

## configure-mcp-correct.ps1

**Purpose**: Configures Claude Code to connect with WordPress MCP using JWT authentication.

**Parameters**:
- `$wpUrl` - The WordPress MCP endpoint URL
- `$projectPath` - The project's app/public directory path

**Workflow**:
1. Prompts user for JWT token using `Read-Host`
2. Changes to project directory
3. Removes any existing wordpress-mcp configuration
4. Executes `claude mcp add` command with proper parameters

**Key Commands**:
```powershell
# Remove existing configuration
claude mcp remove wordpress-mcp 2>$null | Out-Null

# Add new configuration
claude mcp add --transport http wordpress-mcp $wpUrl --header "Authorization: Bearer $token"
```

## configure-mcp-nobom.ps1 (Deprecated)

**Purpose**: Previous version that attempted to manually edit .claude.json file.

**Issue**: PowerShell's `-Encoding UTF8` adds BOM (Byte Order Mark) which causes JSON parsing errors.

**Fix Applied**: Uses .NET method to write without BOM:
```powershell
[System.IO.File]::WriteAllText($configPath, $jsonContent, [System.Text.UTF8Encoding]::new($false))
```

**Status**: Replaced by configure-mcp-correct.ps1 which uses Claude's native commands.

## check-mcp-status.ps1

**Purpose**: Diagnostic script to verify WordPress MCP installation status.

**Checks**:
1. Docker container running status
2. WordPress MCP plugin installation
3. Plugin activation status
4. Permalinks configuration
5. REST API accessibility
6. MCP endpoint availability

**Usage**:
```powershell
.\check-mcp-status.ps1 -projectName "xxx" -wpPort "10054"
```

## Critical PowerShell Fixes

### Out-Null Error Fix
**Problem**: When executing PowerShell through CMD, PowerShell-specific cmdlets cause errors.

**Solution**: Replace piping to Out-Null with variable assignment:
```powershell
# ❌ WRONG - Causes "Out-Null is not recognized" error
New-Item -Path $path -Force | Out-Null

# ✅ CORRECT - Suppresses output without using cmdlets
$null = New-Item -Path $path -Force
```

### String Escaping in Electron
**Problem**: Complex PowerShell commands need proper escaping when passed through Electron.

**Solution**: Join commands with semicolons for single-line execution:
```javascript
const commands = [
  `cd '${publicPath}'`,
  `Write-Host 'Message' -ForegroundColor Green`,
  `Copy-Item 'source' 'dest' -Recurse`
].join('; ')
```

## Script Locations

All PowerShell scripts are located in:
```
dev-bundle/templates/wordpress/
├── configure-mcp-correct.ps1    # Current MCP configuration script
├── configure-mcp-nobom.ps1      # Deprecated JSON manipulation
├── check-mcp-status.ps1         # Diagnostic utility
└── install-wp.bat              # WordPress installation wrapper
```

## Best Practices

1. **Always quote paths** with spaces using single quotes
2. **Use $null =** to suppress output instead of Out-Null
3. **Test scripts directly** in PowerShell before integration
4. **Use -ExecutionPolicy Bypass** when calling scripts
5. **Join multi-line commands** with semicolons for CMD execution

## Common Issues & Solutions

### Issue: Script window closes immediately
**Solution**: Add `Read-Host 'Press Enter to exit'` at the end

### Issue: Path not found errors
**Solution**: Use `.Replace(/\//g, '\\')` to ensure Windows path format

### Issue: Permission denied
**Solution**: Run with `-ExecutionPolicy Bypass` flag

### Issue: BOM in JSON files
**Solution**: Use .NET WriteAllText method with UTF8 encoding without BOM