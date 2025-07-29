# Configure WordPress MCP for Claude Code - Using claude mcp add
param(
    [string]$wpUrl,
    [string]$projectPath
)

Write-Host 'Step 3: Configure WordPress MCP with API Token' -ForegroundColor Green
Write-Host '=============================================' -ForegroundColor Green
Write-Host ''

# Prompt for token
$token = Read-Host 'Enter your WordPress MCP JWT token'
if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host 'No token entered. Exiting...' -ForegroundColor Red
    Read-Host 'Press Enter to exit'
    exit
}

Write-Host ''
Write-Host 'Configuring Claude MCP...' -ForegroundColor Yellow

# Change to project directory
cd $projectPath

Write-Host "Working directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ''

# Remove existing wordpress-mcp if exists
Write-Host 'Removing any existing wordpress-mcp configuration...' -ForegroundColor Yellow
claude mcp remove wordpress-mcp 2>$null | Out-Null

# Add the MCP server with JWT token
Write-Host 'Adding WordPress MCP server...' -ForegroundColor Yellow
Write-Host ''

$command = "claude mcp add --transport http wordpress-mcp $wpUrl --header `"Authorization: Bearer $token`""
Write-Host "Executing: $command" -ForegroundColor DarkGray
Write-Host ''

# Execute the command
& claude mcp add --transport http wordpress-mcp $wpUrl --header "Authorization: Bearer $token"

if ($?) {
    Write-Host ''
    Write-Host 'Configuration added successfully!' -ForegroundColor Green
    Write-Host ''
    Write-Host 'You can now use Claude with WordPress!' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Test the connection with:' -ForegroundColor Yellow
    Write-Host '  claude mcp list' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Start Claude with:' -ForegroundColor Yellow
    Write-Host '  claude' -ForegroundColor Cyan
} else {
    Write-Host ''
    Write-Host 'ERROR: Failed to add MCP configuration!' -ForegroundColor Red
}

Write-Host ''
Read-Host 'Press Enter to exit'