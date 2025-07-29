#!/bin/bash

echo "Waiting for database to be ready..."
sleep 10

echo "Running database migrations..."
docker exec {{PROJECT_NAME}}_backend npx prisma migrate deploy

echo "Database initialization complete!"