@echo off
echo ========================================
echo    DevLauncher - Stopping Services
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Stopping Docker services...
cd core-mcp-stack
docker compose down
cd ..

echo.
echo [2/2] Stopping Node processes...
REM Kill Vite dev server
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /PID %%a /F 2>nul
)

REM Kill Electron processes
taskkill /IM electron.exe /F 2>nul

echo.
echo ========================================
echo DevLauncher stopped successfully!
echo ========================================
pause