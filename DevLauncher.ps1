# DevLauncher PowerShell Starter
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       DevLauncher Starter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Windows Terminal is installed
$wtInstalled = Get-Command wt -ErrorAction SilentlyContinue

if ($wtInstalled) {
    Write-Host "Starting DevLauncher in Windows Terminal..." -ForegroundColor Green
    
    # Launch Windows Terminal with two tabs
    wt new-tab --title "Vite Dev Server" -d "$scriptPath\dev-bundle\launcher-app" powershell -NoExit -Command "npm run dev" `; new-tab --title "Electron App" -d "$scriptPath\dev-bundle\launcher-app" powershell -NoExit -Command "Start-Sleep -Seconds 5; npm run electron"
} else {
    Write-Host "Windows Terminal not found. Using standard approach..." -ForegroundColor Yellow
    
    # Start Vite in background
    Write-Host "[1/2] Starting Vite dev server..." -ForegroundColor Yellow
    $viteProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\dev-bundle\launcher-app'; npm run dev" -PassThru -WindowStyle Minimized
    
    # Wait for Vite
    Write-Host "Waiting for Vite server..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Start Electron
    Write-Host "[2/2] Starting Electron app..." -ForegroundColor Yellow
    Set-Location "$scriptPath\dev-bundle\launcher-app"
    npm run electron
    
    # Kill Vite when done
    Write-Host "Shutting down..." -ForegroundColor Yellow
    Stop-Process -Id $viteProcess.Id -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "DevLauncher closed." -ForegroundColor Green
Read-Host "Press Enter to exit"