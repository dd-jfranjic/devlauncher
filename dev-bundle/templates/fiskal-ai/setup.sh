#!/bin/bash

echo "Setting up Fiskal AI project..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
npx prisma generate
cd ..

# Install frontend dependencies  
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Setup complete! Run 'docker-compose up -d' to start the project."