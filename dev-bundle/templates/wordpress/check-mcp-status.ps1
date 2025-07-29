# Check WordPress MCP Status
param(
    [string]$projectName,
    [string]$wpPort
)

Write-Host 'WordPress MCP Status Check' -ForegroundColor Green
Write-Host '=========================' -ForegroundColor Green
Write-Host ''

# Check if container is running
Write-Host 'Checking Docker container...' -ForegroundColor Yellow
$containerName = "${projectName}_wordpress"
$containerRunning = docker ps --format "table {{.Names}}" | Select-String $containerName

if ($containerRunning) {
    Write-Host "✓ Container $containerName is running" -ForegroundColor Green
} else {
    Write-Host "✗ Container $containerName is NOT running!" -ForegroundColor Red
    Write-Host "  Start the project first!" -ForegroundColor Yellow
    Read-Host 'Press Enter to exit'
    exit
}

# Check plugin status
Write-Host ''
Write-Host 'Checking WordPress MCP plugin status...' -ForegroundColor Yellow
$pluginStatus = docker exec $containerName wp plugin list --format=csv 2>&1 | Select-String "wordpress-mcp"

if ($pluginStatus) {
    Write-Host "✓ WordPress MCP plugin is installed" -ForegroundColor Green
    
    # Check if active
    if ($pluginStatus -match "active") {
        Write-Host "✓ Plugin is ACTIVE" -ForegroundColor Green
    } else {
        Write-Host "✗ Plugin is INACTIVE!" -ForegroundColor Red
        Write-Host ''
        Write-Host 'Activating plugin...' -ForegroundColor Yellow
        docker exec $containerName wp plugin activate wordpress-mcp
        if ($?) {
            Write-Host "✓ Plugin activated successfully!" -ForegroundColor Green
        }
    }
} else {
    Write-Host "✗ WordPress MCP plugin NOT FOUND!" -ForegroundColor Red
    Write-Host "  Make sure you copied the plugin (Step 2)" -ForegroundColor Yellow
}

# Check permalinks
Write-Host ''
Write-Host 'Checking permalinks...' -ForegroundColor Yellow
$permalinks = docker exec $containerName wp rewrite structure 2>&1

if ($permalinks -match "/%postname%/" -or $permalinks -match "/%year%/" -or $permalinks -match "/%monthnum%/") {
    Write-Host "✓ Permalinks are configured" -ForegroundColor Green
} else {
    Write-Host "✗ Permalinks not configured!" -ForegroundColor Red
    Write-Host ''
    Write-Host 'Setting permalinks...' -ForegroundColor Yellow
    docker exec $containerName wp rewrite structure '/%postname%/'
    docker exec $containerName wp rewrite flush
    Write-Host "✓ Permalinks configured!" -ForegroundColor Green
}

# Test REST API
Write-Host ''
Write-Host 'Testing WordPress REST API...' -ForegroundColor Yellow
$restUrl = "http://localhost:$wpPort/wp-json/wp/v2"
try {
    $response = Invoke-WebRequest -Uri $restUrl -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ REST API is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ REST API not accessible!" -ForegroundColor Red
}

# Test MCP endpoint
Write-Host ''
Write-Host 'Testing WordPress MCP endpoint...' -ForegroundColor Yellow
$mcpUrl = "http://localhost:$wpPort/wp-json/wp/v2/wpmcp/streamable"
try {
    $response = Invoke-WebRequest -Uri $mcpUrl -Method GET -UseBasicParsing
    Write-Host "✓ MCP endpoint is accessible" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ MCP endpoint requires authentication (this is correct)" -ForegroundColor Green
    } else {
        Write-Host "✗ MCP endpoint not accessible!" -ForegroundColor Red
        Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ''
Write-Host 'Summary:' -ForegroundColor Yellow
Write-Host '--------' -ForegroundColor Yellow
Write-Host "Project: $projectName" -ForegroundColor White
Write-Host "Port: $wpPort" -ForegroundColor White
Write-Host "MCP URL: $mcpUrl" -ForegroundColor White

Write-Host ''
Read-Host 'Press Enter to exit'