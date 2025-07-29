# DevLauncher Quick Project Creator
param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("wordpress", "static", "ai-agent", "node")]
    [string]$Type = "wordpress",
    
    [Parameter(Mandatory=$false)]
    [string]$Path = "$HOME\dev",
    
    [switch]$NoPRPs,
    [switch]$NoMCP
)

Write-Host "🚀 Creating new project: $ProjectName" -ForegroundColor Green

# Build project configuration
$config = @{
    name = $ProjectName
    type = $Type
    path = Join-Path $Path $ProjectName
    mcpEnabled = !$NoMCP
    prpsEnabled = !$NoPRPs
}

# Create project directory
New-Item -ItemType Directory -Force -Path $config.path | Out-Null

# Copy template
$templatePath = Join-Path $PSScriptRoot "..\templates\$Type"
if (Test-Path $templatePath) {
    Copy-Item -Path "$templatePath\*" -Destination $config.path -Recurse -Force
}

# Generate .env
$envTemplate = Get-Content (Join-Path $templatePath ".env.template") -Raw
$envContent = $envTemplate.Replace("{{PROJECT_NAME}}", $ProjectName)
Set-Content -Path (Join-Path $config.path ".env") -Value $envContent

Write-Host "✅ Project created at: $($config.path)" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  cd $($config.path)"
Write-Host "  docker-compose up -d"
Write-Host "  npx @anthropic-ai/claude-code"