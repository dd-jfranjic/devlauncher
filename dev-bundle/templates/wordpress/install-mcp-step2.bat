@echo off
echo Step 2: Copy WordPress MCP Plugin to WordPress
echo ==============================================
echo.

cd /d "%~dp0app\public"

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

if not exist "wordpress-mcp\vendor" (
    echo [WARNING] Vendor folder not found. Plugin may not work properly!
    echo Consider installing Composer and running Step 1 again.
)

echo.
echo Removing old plugin if exists...
if exist "wp-content\plugins\wordpress-mcp" (
    rmdir /s /q "wp-content\plugins\wordpress-mcp"
)

echo Copying entire wordpress-mcp folder to plugins...
xcopy "wordpress-mcp" "wp-content\plugins\wordpress-mcp\" /E /I /Y

echo.
echo Plugin copied successfully!
echo.
echo Copied files include:
echo   - wordpress-mcp.php (main plugin file)
echo   - includes\ (PHP classes)
echo   - build\ (JavaScript assets)
if exist "wp-content\plugins\wordpress-mcp\vendor" (
    echo   - vendor\ (PHP dependencies)
)

echo.
echo Now activating plugin in WordPress...
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
    echo 3. Use the token to configure MCP
) else (
    echo.
    echo ERROR: Failed to activate plugin!
    echo Check if WordPress is running and try again.
)

echo.
pause