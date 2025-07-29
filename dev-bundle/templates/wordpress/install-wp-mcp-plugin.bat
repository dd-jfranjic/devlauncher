@echo off
echo ====================================
echo Installing WordPress MCP Plugin
echo ====================================
echo.

REM Copy the plugin to WordPress plugins directory
echo Copying MCP plugin to WordPress...
xcopy /E /I /Y "{{PROJECT_PATH}}\app\public\node_modules\@automattic\wordpress-mcp\wordpress-plugin\*" "{{PROJECT_PATH}}\app\public\wp-content\plugins\wordpress-mcp\"

if %errorlevel% equ 0 (
    echo.
    echo Plugin files copied successfully!
    echo.
    
    REM Activate the plugin using WP-CLI
    echo Activating WordPress MCP plugin...
    docker exec {{PROJECT_NAME}}_wordpress wp plugin activate wordpress-mcp --allow-root
    
    if %errorlevel% equ 0 (
        echo.
        echo ====================================
        echo WordPress MCP Plugin activated!
        echo ====================================
        echo.
        echo Next steps:
        echo 1. Go to: http://localhost:{{WP_PORT}}/wp-admin
        echo 2. Navigate to Settings > MCP API
        echo 3. Generate a new API token
        echo 4. Copy the token and click "Configure MCP Token" button
        echo.
        start http://localhost:{{WP_PORT}}/wp-admin/options-general.php?page=mcp-api
    ) else (
        echo.
        echo ERROR: Failed to activate plugin!
        echo Please activate it manually in WordPress admin.
    )
) else (
    echo.
    echo ERROR: Failed to copy plugin files!
)

echo.
pause