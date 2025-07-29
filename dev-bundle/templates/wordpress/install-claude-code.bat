@echo off
echo ====================================
echo Installing Claude Code for {{PROJECT_NAME}}
echo ====================================
echo.

cd /d "{{PROJECT_PATH}}\app\public"

echo Current directory: %CD%
echo.

echo Checking for Node.js and npm...
echo.

REM Try to find npm in common locations
where npm >nul 2>&1
if %errorlevel% equ 0 (
    echo Found npm in PATH
    npm --version
    node --version
) else (
    echo npm not found in PATH, checking common locations...
    
    REM Check Program Files
    if exist "%ProgramFiles%\nodejs\npm.cmd" (
        echo Found npm in Program Files
        set "PATH=%PATH%;%ProgramFiles%\nodejs"
        "%ProgramFiles%\nodejs\npm.cmd" --version
    ) else if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" (
        echo Found npm in Program Files (x86)
        set "PATH=%PATH%;%ProgramFiles(x86)%\nodejs"
        "%ProgramFiles(x86)%\nodejs\npm.cmd" --version
    ) else (
        echo.
        echo ERROR: npm is not installed or not in PATH!
        echo.
        echo Current PATH:
        echo %PATH%
        echo.
        echo Please install Node.js from https://nodejs.org/
        echo Or add Node.js to your system PATH variable.
        echo.
        echo Alternatively, you can install Claude Code manually:
        echo   npm install -g @anthropic-ai/claude-code
        pause
        exit /b 1
    )
)

echo.
echo Installing Claude Code...
npm install -g @anthropic-ai/claude-code

if %errorlevel% eq 0 (
    echo.
    echo ====================================
    echo Claude Code installed successfully!
    echo ====================================
    echo.
    echo You can now use Claude Code in this project.
    echo.
    echo To start Claude Code, run:
    echo   claude
    echo.
    echo Or use it with specific commands:
    echo   claude chat
    echo   claude --help
    echo.
    echo Working directory: %CD%
    echo ====================================
) else (
    echo.
    echo ERROR: Failed to install Claude Code!
    echo Please check the error messages above.
)

echo.
pause