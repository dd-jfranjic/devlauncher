@echo off
echo Starting Dev Launcher locally (without Docker)...
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Run Prisma migrations
echo Setting up database...
cd server
if not exist "prisma\devlauncher.db" (
    npx prisma db push --schema=prisma/schema.prisma
)
cd ..

REM Start both frontend and backend
echo.
echo Starting services...
echo - Backend API: http://localhost:9976
echo - Frontend UI: http://localhost:5173
echo.
echo Press Ctrl+C to stop
echo.

REM Use concurrently to run both
npx concurrently --names "API,UI" --prefix-colors "cyan,magenta" "npm run dev:server" "npm run dev:client"