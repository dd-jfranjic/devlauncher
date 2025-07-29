@echo off
echo Fixing WordPress MCP Plugin - Installing Composer Dependencies
echo =============================================================
echo.

cd /d "%~dp0app\public"

echo Running composer install inside WordPress container...
echo.

docker exec {{PROJECT_NAME}}_wordpress bash -c "cd /var/www/html/wp-content/plugins/wordpress-mcp && composer install --no-dev --no-interaction"

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Composer dependencies installed.
    echo Plugin should now work properly.
) else (
    echo.
    echo ERROR: Failed to install dependencies.
    echo Make sure Docker is running and the plugin folder exists.
)

echo.
pause