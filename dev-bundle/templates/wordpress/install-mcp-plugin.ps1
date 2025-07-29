param(
    [string]$ProjectPath,
    [string]$ProjectName,
    [string]$WpPort
)

Write-Host "Step 2: Copy WordPress MCP Plugin to WordPress" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

Set-Location $ProjectPath

if (Test-Path "wordpress-mcp\wordpress-mcp.php") {
    Write-Host "Found WordPress MCP plugin!" -ForegroundColor Green
    
    # Check if build exists
    if (Test-Path "wordpress-mcp\build") {
        Write-Host "Build folder found - plugin is ready!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Build folder not found. Run Step 1 first!" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Creating plugin directory..." -ForegroundColor Yellow
    
    # Remove old plugin if exists
    if (Test-Path "wp-content\plugins\wordpress-mcp") {
        Remove-Item -Path "wp-content\plugins\wordpress-mcp" -Recurse -Force
    }
    
    # Create plugin directory
    New-Item -ItemType Directory -Path "wp-content\plugins\wordpress-mcp" -Force | Out-Null
    
    Write-Host "Copying plugin files..." -ForegroundColor Yellow
    
    # Copy PHP files
    Copy-Item -Path "wordpress-mcp\*.php" -Destination "wp-content\plugins\wordpress-mcp\" -Force
    
    # Copy JSON files if exist
    if (Test-Path "wordpress-mcp\*.json") {
        Copy-Item -Path "wordpress-mcp\*.json" -Destination "wp-content\plugins\wordpress-mcp\" -Force
    }
    
    # Copy essential directories
    $directories = @("includes", "build", "vendor", "assets", "src")
    foreach ($dir in $directories) {
        if (Test-Path "wordpress-mcp\$dir") {
            Write-Host "  Copying $dir..." -ForegroundColor Gray
            Copy-Item -Path "wordpress-mcp\$dir" -Destination "wp-content\plugins\wordpress-mcp\" -Recurse -Force
        }
    }
    
    Write-Host "Plugin files copied!" -ForegroundColor Green
    Write-Host ""
    
    # List what was copied
    Write-Host "Plugin contents:" -ForegroundColor Gray
    Get-ChildItem -Path "wp-content\plugins\wordpress-mcp" -Name
    
    Write-Host ""
    Write-Host "Activating plugin in WordPress..." -ForegroundColor Yellow
    
    docker exec "${ProjectName}_wordpress" wp plugin activate wordpress-mcp --allow-root
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "WordPress MCP Plugin activated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Opening WordPress admin MCP settings..." -ForegroundColor Yellow
        Start-Process "http://localhost:${WpPort}/wp-admin/options-general.php?page=mcp-api"
        Write-Host ""
        Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
        Write-Host "1. In WordPress admin, generate a new API token" -ForegroundColor Cyan
        Write-Host "2. Copy the generated token" -ForegroundColor Cyan
        Write-Host "3. Click the yellow key icon to configure MCP with your token" -ForegroundColor Cyan
    } else {
        Write-Host "ERROR: Failed to activate plugin!" -ForegroundColor Red
        Write-Host "Check if WordPress is running and try again." -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: wordpress-mcp.php not found!" -ForegroundColor Red
    Write-Host "Please first click the puzzle icon to install WordPress MCP from GitHub" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")