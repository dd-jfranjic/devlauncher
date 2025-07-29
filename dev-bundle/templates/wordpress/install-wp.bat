@echo off
echo ====================================
echo Installing WordPress for {{PROJECT_NAME}}
echo ====================================
echo.

REM Wait for WordPress to be ready
echo Waiting for WordPress files to be ready...
:wait_loop
docker exec {{PROJECT_NAME}}_wordpress test -f /var/www/html/wp-config.php >nul 2>&1
if %errorlevel% neq 0 (
    echo WordPress is still initializing...
    timeout /t 5 /nobreak >nul
    goto wait_loop
)

echo WordPress files are ready!
timeout /t 5 /nobreak >nul

REM Check if WP-CLI is available
echo Checking if WP-CLI is available...
docker exec {{PROJECT_NAME}}_wordpress which wp >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing WP-CLI in WordPress container...
    docker exec {{PROJECT_NAME}}_wordpress bash -c "curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && chmod +x wp-cli.phar && mv wp-cli.phar /usr/local/bin/wp"
)

REM Check if WordPress is already installed
echo Checking WordPress installation status...
docker exec {{PROJECT_NAME}}_wordpress wp core is-installed --allow-root >nul 2>&1
if %errorlevel% equ 0 (
    echo WordPress is already installed!
    echo.
    echo Access WordPress at: http://localhost:{{WP_PORT}}
    echo Admin panel: http://localhost:{{WP_PORT}}/wp-admin
    echo.
    echo Login credentials:
    echo Username: admin
    echo Password: admin123
) else (
    echo WordPress is not installed. Installing now...
    echo.
    
    REM Run the installation through the web interface
    echo Opening WordPress installation page...
    start http://localhost:{{WP_PORT}}
    echo.
    echo Please complete the installation in your browser.
    echo.
    echo Suggested credentials:
    echo Username: admin
    echo Password: admin123
)

echo.
pause