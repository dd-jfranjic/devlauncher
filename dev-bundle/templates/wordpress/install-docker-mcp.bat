@echo off
cd /d "%~dp0app\public"

echo Installing Docker MCP Toolkit...
echo ================================
echo.

REM Create the docker runner batch file
echo Creating Docker MCP runner script...
echo @echo off > docker-mcp.bat
echo docker run -i --rm alpine/socat STDIO TCP:host.docker.internal:8811 >> docker-mcp.bat
echo Script created: docker-mcp.bat
echo.

REM Check for existing installation
echo Checking for existing docker-labs-mcp...
claude mcp list 2>&1 | findstr "docker-labs-mcp" >nul
if %errorlevel%==0 (
    echo Removing existing docker-labs-mcp...
    claude mcp remove docker-labs-mcp >nul 2>&1
)

REM Add Docker MCP
echo.
echo Adding Docker MCP to Claude Code...
claude mcp add --transport stdio docker-labs-mcp docker-mcp.bat

if %errorlevel%==0 (
    echo.
    echo SUCCESS! Docker MCP Toolkit connected!
    echo.
    echo Verifying installation...
    claude mcp list
) else (
    echo.
    echo ERROR: Failed to add Docker MCP!
)

echo.
pause