@echo off
echo ========================================
echo    DevLauncher - Starting Services
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Cleaning up old processes...
REM Kill any hanging Vite processes
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /PID %%a /F 2>nul
)

echo [2/4] Checking Docker services...
cd core-mcp-stack

docker compose ps -q > nul 2>&1
if %errorlevel% == 0 (
    echo Docker services status:
    docker compose ps --format "table {{.Name}}\t{{.Status}}"
    echo.
) else (
    echo Starting Docker services...
    docker compose up -d
)
cd ..

echo.
echo [3/4] Checking dependencies...
cd launcher-app

if exist node_modules (
    echo Dependencies already installed.
) else (
    echo Installing dependencies...
    call npm install
)

echo.
echo [4/4] Starting DevLauncher...

REM Start Vite in a new window
echo Starting development server...
start "Vite Dev Server" cmd /k npm run dev

echo Waiting for server to start...
timeout /t 5 /nobreak > nul

REM Start Electron
echo Starting Electron app...
start "DevLauncher" npm run electron

echo.
echo ========================================
echo DevLauncher is starting!
echo Two windows will open:
echo 1. Vite Dev Server (keep it running)
echo 2. DevLauncher GUI
echo ========================================
echo.
echo To stop, use STOP-DEVLAUNCHER.bat
pause