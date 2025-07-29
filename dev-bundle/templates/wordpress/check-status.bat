@echo off
echo ====================================
echo Checking {{PROJECT_NAME}} Status
echo ====================================
echo.

echo 1. Checking running containers:
docker ps -a | findstr {{PROJECT_NAME}}
echo.

echo 2. Checking WordPress container logs:
docker logs {{PROJECT_NAME}}_wordpress --tail 50
echo.

echo 3. Checking folder contents:
dir "{{PROJECT_PATH}}\app\public"
echo.

echo 4. Checking inside container:
docker exec {{PROJECT_NAME}}_wordpress ls -la /var/www/html
echo.

pause