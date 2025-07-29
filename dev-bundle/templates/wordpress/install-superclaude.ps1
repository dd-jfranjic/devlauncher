# SuperClaude Framework Installation Script
# Adds 16 specialized slash commands to Claude Code

Clear-Host
Write-Host "================================" -ForegroundColor Magenta
Write-Host "  SuperClaude Framework Setup   " -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "This will install 16 slash commands for Claude Code:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Development Commands:" -ForegroundColor Cyan
Write-Host "  /sc:implement  - Build features & components" -ForegroundColor White
Write-Host "  /sc:build      - Compile & package projects" -ForegroundColor White
Write-Host "  /sc:design     - Create architecture & APIs" -ForegroundColor White
Write-Host ""
Write-Host "Analysis Commands:" -ForegroundColor Cyan
Write-Host "  /sc:analyze    - Code quality & security analysis" -ForegroundColor White
Write-Host "  /sc:troubleshoot - Debug & investigate issues" -ForegroundColor White
Write-Host "  /sc:explain    - Educational explanations" -ForegroundColor White
Write-Host ""
Write-Host "Quality Commands:" -ForegroundColor Cyan
Write-Host "  /sc:improve    - Refactor & optimize code" -ForegroundColor White
Write-Host "  /sc:test       - Testing functionality" -ForegroundColor White
Write-Host "  /sc:cleanup    - Clean & organize code" -ForegroundColor White
Write-Host ""
Write-Host "Management Commands:" -ForegroundColor Cyan
Write-Host "  /sc:document   - Generate documentation" -ForegroundColor White
Write-Host "  /sc:git        - Git operations" -ForegroundColor White
Write-Host "  /sc:estimate   - Project estimation" -ForegroundColor White
Write-Host "  /sc:task       - Task management" -ForegroundColor White
Write-Host "  /sc:index      - Show resources" -ForegroundColor White
Write-Host "  /sc:load       - Load configurations" -ForegroundColor White
Write-Host "  /sc:spawn      - Create instances" -ForegroundColor White
Write-Host ""

# Check Python installation
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$pythonVersion = $null
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
    }
} catch {
    # Python not found
}

if (-not $pythonVersion -or $LASTEXITCODE -ne 0) {
    Write-Host "✗ Python not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Python 3.8+ is required for SuperClaude." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Install Python from:" -ForegroundColor Cyan
    Write-Host "1. https://python.org/downloads/" -ForegroundColor White
    Write-Host "2. Or run: winget install python" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
$confirm = Read-Host "Install SuperClaude Framework? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Installation cancelled." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Cloning SuperClaude repository..." -ForegroundColor Yellow
if (Test-Path "SuperClaude") {
    Write-Host "Removing existing SuperClaude folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "SuperClaude"
}

git clone https://github.com/SuperClaude-Org/SuperClaude_Framework.git SuperClaude
if (-not $?) {
    Write-Host "ERROR: Failed to clone repository!" -ForegroundColor Red
    Write-Host "Please check your internet connection and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Installing SuperClaude..." -ForegroundColor Yellow
Set-Location SuperClaude

# Run the Python installer
python -m SuperClaude install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "✓ SuperClaude Framework Installed!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "What's been installed:" -ForegroundColor Cyan
    Write-Host "• 16 slash commands in Claude Code" -ForegroundColor White
    Write-Host "• Smart AI personas for each task" -ForegroundColor White
    Write-Host "• MCP server integrations" -ForegroundColor White
    Write-Host "• Enhanced development workflows" -ForegroundColor White
    Write-Host ""
    Write-Host "Files created in .claude folder:" -ForegroundColor Yellow
    Write-Host "• CLAUDE.md - Framework entry point" -ForegroundColor Gray
    Write-Host "• COMMANDS.md - Command reference" -ForegroundColor Gray
    Write-Host "• settings.json - Configuration" -ForegroundColor Gray
    Write-Host "• commands/ - Command definitions" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try it out:" -ForegroundColor Cyan
    Write-Host "Type '/sc:help' in Claude Code to see all commands" -ForegroundColor White
    Write-Host ""
    
    # Return to parent directory
    Set-Location ..
} else {
    Write-Host ""
    Write-Host "Installation failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to close"