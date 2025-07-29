@echo off
echo ====================================
echo Installing Claude Code for {{PROJECT_NAME}}
echo ====================================
echo.

cd /d "{{PROJECT_PATH}}\app\public"

echo Current directory: %CD%
echo.

echo This will open a new PowerShell window to install Claude Code.
echo.

REM Open PowerShell to install Claude Code
powershell -NoExit -Command "Write-Host 'Installing Claude Code...' -ForegroundColor Green; npm install -g @anthropic-ai/claude-code; Write-Host ''; Write-Host 'If installation succeeded, you can now use:' -ForegroundColor Yellow; Write-Host '  claude' -ForegroundColor Cyan; Write-Host '  claude chat' -ForegroundColor Cyan; Write-Host '  claude --help' -ForegroundColor Cyan"

echo.
echo Check the PowerShell window for installation status.
echo.
pause