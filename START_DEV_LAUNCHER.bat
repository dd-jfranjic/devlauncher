@echo off
echo ========================================
echo     Starting Dev Launcher...
echo ========================================
echo.

REM Check if Docker Desktop is running
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | findstr /I "Docker Desktop.exe" >NUL
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
echo Backend API will be available at: http://localhost:9976/api/health
echo.
echo Press Ctrl+C to stop the application
echo ========================================
echo.

REM Kill any existing processes on ports 9976 and 5173
echo Checking for existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9976 "') do @taskkill /PID %%a /F >nul 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 "') do @taskkill /PID %%a /F >nul 2>nul
echo Ports cleared ✓
echo.

REM Start the application
npm run dev

pause