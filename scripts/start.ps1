# PowerShell startup script for Dev Launcher

Write-Host "🚀 Starting Dev Launcher..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Check if database exists, if not run migrations
if (!(Test-Path "server\prisma\devlauncher.db")) {
    Write-Host "🗄️ Setting up database..." -ForegroundColor Yellow
    npx prisma migrate dev --name init
}

# Build and start Docker container
Write-Host "🐳 Starting Docker container..." -ForegroundColor Yellow
docker compose up -d

# Wait for backend to be ready
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri http://localhost:9976/health -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is running at http://localhost:9976" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend failed to start. Check logs with: docker logs devlauncher" -ForegroundColor Red
    exit 1
}

# Start Electron app in new window
Write-Host "🖥️ Starting Electron application..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:client"

Write-Host "✨ Dev Launcher is ready!" -ForegroundColor Green
Write-Host "📝 Check README.md for usage instructions" -ForegroundColor Cyan