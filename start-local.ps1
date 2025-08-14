#!/usr/bin/env pwsh

Write-Host "Starting Dev Launcher locally (without Docker)..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Run Prisma migrations
Write-Host "Setting up database..." -ForegroundColor Yellow
Set-Location server
if (-not (Test-Path "prisma\devlauncher.db")) {
    npx prisma db push --schema=prisma/schema.prisma
}
Set-Location ..

# Start both frontend and backend
Write-Host ""
Write-Host "Starting services..." -ForegroundColor Green
Write-Host "- Backend API: " -NoNewline
Write-Host "http://localhost:9976" -ForegroundColor Cyan
Write-Host "- Frontend UI: " -NoNewline
Write-Host "http://localhost:5173" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Use concurrently to run both
npx concurrently --names "API,UI" --prefix-colors "cyan,magenta" "npm run dev:server" "npm run dev:client"