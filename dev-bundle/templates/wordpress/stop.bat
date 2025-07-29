@echo off
title {{PROJECT_NAME}} - Stopping...
echo Stopping {{PROJECT_NAME}} containers...

REM Stop Docker containers
docker compose down

REM Kill any remaining docker-compose processes
taskkill /F /IM "docker-compose.exe" 2>nul

echo.
echo ✅ {{PROJECT_NAME}} stopped successfully!
echo.

REM This window will close automatically...
timeout /t 1 /nobreak >nul