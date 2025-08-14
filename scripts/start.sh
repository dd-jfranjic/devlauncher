#!/bin/bash

echo "🚀 Starting Dev Launcher..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check if database exists, if not run migrations
if [ ! -f "server/prisma/devlauncher.db" ]; then
    echo "🗄️ Setting up database..."
    npx prisma migrate dev --name init
fi

# Build and start Docker container
echo "🐳 Starting Docker container..."
docker compose up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -f http://localhost:9976/health > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:9976"
else
    echo "❌ Backend failed to start. Check logs with: docker logs devlauncher"
    exit 1
fi

# Start Electron app
echo "🖥️ Starting Electron application..."
npm run dev:client

echo "✨ Dev Launcher is ready!"