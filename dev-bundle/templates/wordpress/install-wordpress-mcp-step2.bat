@echo off
echo Step 2: Copy WordPress MCP Plugin to WordPress
echo ===============================================
echo.

cd /d "%~dp0app\public" 2>nul || cd /d "%~dp0"

if not exist "wordpress-mcp\wordpress-mcp.php" (
    echo ERROR: wordpress-mcp.php not found!
    echo Please run Step 1 first to install WordPress MCP from GitHub
    pause
    exit /b 1
)

echo Found WordPress MCP plugin!
echo.

if exist "wordpress-mcp\build" (
    echo [OK] Build folder found - plugin is ready!
) else (
    echo [WARNING] Build folder not found. Run Step 1 first!
)

echo.
echo Creating plugin directory...
if exist "wp-content\plugins\wordpress-mcp" (
    rmdir /s /q "wp-content\plugins\wordpress-mcp"
)
mkdir "wp-content\plugins\wordpress-mcp"

echo.
echo Copying plugin files...
echo   - Copying PHP files...
copy "wordpress-mcp\*.php" "wp-content\plugins\wordpress-mcp\" > nul

echo   - Copying directories...
if exist "wordpress-mcp\includes" (
    echo     - includes\
    xcopy "wordpress-mcp\includes" "wp-content\plugins\wordpress-mcp\includes\" /E /I /Y /Q > nul
)
if exist "wordpress-mcp\build" (
    echo     - build\
    xcopy "wordpress-mcp\build" "wp-content\plugins\wordpress-mcp\build\" /E /I /Y /Q > nul
)
if exist "wordpress-mcp\vendor" (
    echo     - vendor\
    xcopy "wordpress-mcp\vendor" "wp-content\plugins\wordpress-mcp\vendor\" /E /I /Y /Q > nul
)
if exist "wordpress-mcp\assets" (
    echo     - assets\
    xcopy "wordpress-mcp\assets" "wp-content\plugins\wordpress-mcp\assets\" /E /I /Y /Q > nul
)
if exist "wordpress-mcp\src" (
    echo     - src\
    xcopy "wordpress-mcp\src" "wp-content\plugins\wordpress-mcp\src\" /E /I /Y /Q > nul
)

echo.
echo Plugin files copied!
echo.

echo Activating plugin in WordPress...
docker exec %PROJECT_NAME%_wordpress wp plugin activate wordpress-mcp --allow-root

if %errorlevel% equ 0 (
    echo.
    echo WordPress MCP Plugin activated successfully!
    echo.
    echo Opening WordPress admin MCP settings...
    start http://localhost:%WP_PORT%/wp-admin/options-general.php?page=mcp-api
    echo.
    echo IMPORTANT NEXT STEPS:
    echo 1. In WordPress admin, generate a new API token
    echo 2. Copy the generated token
    echo 3. Click the yellow key icon to configure MCP with your token
) else (
    echo.
    echo ERROR: Failed to activate plugin!
    echo Check if WordPress is running and try again.
)

echo.
pause