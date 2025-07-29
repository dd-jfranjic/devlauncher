@echo off
echo Generating SSL certificate for {{PROJECT_NAME}}...

REM Create certs directory if it doesn't exist
if not exist certs mkdir certs

REM Generate self-signed certificate using OpenSSL in Docker
docker run --rm -v "%CD%\certs:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 ^
  -keyout /certs/localhost.key ^
  -out /certs/localhost.crt ^
  -subj "/C=US/ST=State/L=City/O={{PROJECT_NAME}}/CN=localhost"

if %errorlevel% == 0 (
    echo.
    echo ✅ SSL certificate generated successfully!
    echo.
    echo Certificate: certs\localhost.crt
    echo Private Key: certs\localhost.key
    echo.
    echo Your site will be available at:
    echo - http://localhost:{{WP_PORT}}
    echo - https://localhost:{{WP_HTTPS_PORT}}
) else (
    echo.
    echo ❌ Failed to generate SSL certificate
)

pause