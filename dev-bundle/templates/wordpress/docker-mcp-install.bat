@echo off
cd /d %~dp0..\..\app\public

echo Docker MCP Toolkit Installation
echo ===============================
echo.

echo Current directory: %CD%
echo.

echo Removing any existing docker-labs-mcp...
claude mcp remove docker-labs-mcp >nul 2>&1

echo.
echo Adding Docker MCP with different approaches...
echo.

echo Attempt 1: Using -- separator
claude mcp add docker-labs-mcp -- docker run -i --rm alpine/socat STDIO TCP:host.docker.internal:8811
if %errorlevel%==0 (
    echo SUCCESS with -- separator!
) else (
    echo Failed with -- separator. Error: %errorlevel%
)

echo.
echo Current MCP list:
claude mcp list

echo.
pause