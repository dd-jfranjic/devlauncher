@echo off
echo Checking WordPress MCP Structure
echo ================================
echo.

cd /d "C:\Users\jfran\Documents\dev\ddd\app\public\wordpress-mcp"

echo Current directory: %CD%
echo.

echo Files in root:
echo --------------
dir /b *.* 2>nul
echo.

echo Directories:
echo ------------
dir /ad /b 2>nul
echo.

echo Checking for main plugin file:
if exist "wordpress-mcp.php" (
    echo [OK] wordpress-mcp.php found
) else if exist "plugin.php" (
    echo [OK] plugin.php found
) else if exist "index.php" (
    echo [OK] index.php found
) else (
    echo [WARNING] No standard plugin file found
)

echo.
echo Checking build directory:
if exist "build" (
    echo [OK] build directory exists
    echo Contents of build:
    dir /b "build\*.*" 2>nul
) else (
    echo [INFO] No build directory
)

echo.
echo Checking vendor directory (Composer):
if exist "vendor" (
    echo [OK] vendor directory exists (Composer dependencies installed)
) else (
    echo [WARNING] vendor directory missing (run: composer install)
)

echo.
echo Checking node_modules:
if exist "node_modules" (
    echo [OK] node_modules exists (npm dependencies installed)
) else (
    echo [WARNING] node_modules missing (run: npm install)
)

echo.
echo To copy this plugin to WordPress:
echo wp-content\plugins\wordpress-mcp\
echo.
pause