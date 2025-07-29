@echo off
echo =====================================
echo     Building Claudia - Final Try     
echo =====================================
echo.

REM Add Rust to PATH
set PATH=%USERPROFILE%\.cargo\bin;%PATH%

REM Navigate to Claudia directory
cd /d "C:\Users\jfran\Documents\www-data\start-project-gui\dev-bundle\claudia"

REM Build Claudia
echo Starting build (this takes 5-10 minutes)...
echo.
bun run tauri build

REM Check if build succeeded
if exist "src-tauri\target\release\claudia.exe" (
    echo.
    echo =====================================
    echo     BUILD SUCCESSFUL!
    echo =====================================
    echo.
    echo Claudia is ready at:
    echo src-tauri\target\release\claudia.exe
) else (
    echo.
    echo =====================================
    echo     BUILD FAILED!
    echo =====================================
    echo.
    echo Check the errors above.
)

echo.
pause