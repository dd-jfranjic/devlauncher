@echo off
echo ========================================
echo    Building DevLauncher.exe
echo ========================================
echo.

:: Build React app first
echo [1/3] Building React app...
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ERROR: React build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Building Electron app...
call npm run build:electron

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Electron build failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Packaging to exe...
call npm run dist

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Packaging failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Build Complete!
echo ========================================
echo.
echo Your installer is ready in: dist\
echo.
pause