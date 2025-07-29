Write-Host "🚀 Starting DevLauncher MCP stack..." -ForegroundColor Green

# Create network if it doesn't exist
Write-Host "Creating Docker network..." -ForegroundColor Yellow
docker network create devlauncher-network 2>$null

# Start Docker services
docker compose up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Register MCP servers with Claude
Write-Host "🔗 Registering MCP servers..." -ForegroundColor Yellow

$servers = Get-Content -Path "servers.json" | ConvertFrom-Json
foreach ($server in $servers) {
    Write-Host "  - Registering $($server.id)..." -ForegroundColor Cyan
    npx @anthropic-ai/claude-code mcp add $server.id --transport $server.transport $server.url -s $server.scope
}

Write-Host "✅ MCP stack started successfully!" -ForegroundColor Green