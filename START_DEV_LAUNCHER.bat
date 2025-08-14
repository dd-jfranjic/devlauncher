@echo off
echo ========================================
echo     Starting Dev Launcher...
echo ========================================
echo.

REM Check if Docker Desktop is running
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I /N "Docker Desktop.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Docker Desktop is not running!
    echo Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

echo Docker Desktop is running ✓
echo.

REM Navigate to Dev Launcher directory
cd /d "C:\Users\jfran\Documents\dev-launcher"

echo Starting Dev Launcher services...
echo.
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:9976
echo.
echo Press Ctrl+C to stop the application
echo ========================================
echo.

REM Start the application
npm run dev

pause