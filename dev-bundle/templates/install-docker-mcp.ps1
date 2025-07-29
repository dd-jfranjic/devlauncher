# Docker MCP Toolkit Installation Script
param(
    [string]$ProjectPath
)

cd $ProjectPath

Write-Host 'Installing Docker MCP Toolkit...' -ForegroundColor Green
Write-Host '================================' -ForegroundColor Green
Write-Host ''

# Check Docker
Write-Host 'Checking Docker Desktop...' -ForegroundColor Yellow
docker version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'ERROR: Docker Desktop is not running!' -ForegroundColor Red
    Write-Host 'Please start Docker Desktop first.' -ForegroundColor Yellow
    Read-Host 'Press Enter to exit'
    exit
}
Write-Host 'Docker Desktop is running!' -ForegroundColor Green

Write-Host ''
Write-Host 'IMPORTANT: Docker MCP Toolkit must be enabled in Docker Desktop:' -ForegroundColor Yellow
Write-Host '1. Open Docker Desktop' -ForegroundColor White
Write-Host '2. Go to Settings > Features in development' -ForegroundColor White
Write-Host '3. Enable "Docker MCP Toolkit"' -ForegroundColor White
Write-Host '4. Install desired MCP servers from the Catalog' -ForegroundColor White
Write-Host ''
Read-Host 'Press Enter to continue'

# Check existing MCP
Write-Host ''
Write-Host 'Checking existing MCP configurations...' -ForegroundColor Yellow
$mcpList = claude mcp list 2>&1 | Out-String
if ($mcpList -match 'docker-labs-mcp') {
    Write-Host 'Removing existing docker-labs-mcp...' -ForegroundColor Yellow
    claude mcp remove docker-labs-mcp 2>&1 | Out-Null
}

# Add Docker MCP
Write-Host ''
Write-Host 'Adding Docker MCP to Claude Code...' -ForegroundColor Yellow
Write-Host 'Running: claude mcp add docker-labs-mcp --scope local -- docker run -i --rm alpine/socat STDIO TCP:host.docker.internal:8811' -ForegroundColor Gray
claude mcp add docker-labs-mcp --scope local -- docker run -i --rm alpine/socat STDIO TCP:host.docker.internal:8811

if ($?) {
    Write-Host ''
    Write-Host 'SUCCESS! Docker MCP Toolkit connected!' -ForegroundColor Green
    Write-Host ''
    Write-Host 'To manage MCP servers:' -ForegroundColor Cyan
    Write-Host '- Open Docker Desktop' -ForegroundColor White
    Write-Host '- Go to MCP Toolkit extension' -ForegroundColor White
    Write-Host '- Install servers from the Catalog' -ForegroundColor White
    Write-Host ''
    Write-Host 'Verifying installation...' -ForegroundColor Yellow
    claude mcp list
} else {
    Write-Host 'ERROR: Failed to add Docker MCP!' -ForegroundColor Red
}

Write-Host ''
Read-Host 'Press Enter to close'