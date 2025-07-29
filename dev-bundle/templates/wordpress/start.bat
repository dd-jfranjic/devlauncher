@echo off
title {{PROJECT_NAME}} - Docker Containers
echo ====================================
echo Starting {{PROJECT_NAME}} WordPress
echo ====================================
echo.

echo Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop and try again.
    pause
    exit /b 1
)

echo Starting containers...
docker compose up -d

if %errorlevel% eq 0 (
    echo.
    echo ====================================
    echo WordPress is starting!
    echo ====================================
    echo.
    echo Waiting for services to initialize...
    echo This may take 1-2 minutes...
    timeout /t 30 /nobreak >nul
    
    echo.
    echo ====================================
    echo WordPress is ready!
    echo ====================================
    echo.
    echo Access your sites:
    echo - WordPress: http://localhost:{{WP_PORT}}
    echo - WordPress Admin: http://localhost:{{WP_PORT}}/wp-admin
    echo - phpMyAdmin: http://localhost:{{PMA_PORT}}
    echo - Mailpit: http://localhost:{{MAIL_PORT}}
    echo.
    echo Default login: admin / admin123
    echo.
    echo WordPress should be auto-installed. If you see the 
    echo installation screen, run install-wp.bat manually.
    echo.
    echo To stop, run: docker compose down
    echo ====================================
) else (
    echo.
    echo ERROR: Failed to start containers!
    echo Check the error messages above.
)

pause