@echo off
echo Starting DevLauncher development server...
cd /d "%~dp0"
call npm install
start cmd /k "npm run dev"
timeout /t 5
start cmd /k "npm run electron"