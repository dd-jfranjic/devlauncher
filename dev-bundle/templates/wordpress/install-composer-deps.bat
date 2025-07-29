@echo off
echo Installing Composer Dependencies for WordPress MCP
echo =================================================
echo.

cd /d "%~dp0app\public"

echo Running composer install in WordPress container...
echo.

docker exec {{PROJECT_NAME}}_wordpress composer install --no-dev --no-interaction --working-dir=/var/www/html/wp-content/plugins/wordpress-mcp

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Composer dependencies installed.
    echo Plugin is now ready to be activated in WordPress.
) else (
    echo.
    echo ERROR: Failed to install dependencies.
    echo Make sure Docker is running and the plugin folder exists.
)

echo.
pause