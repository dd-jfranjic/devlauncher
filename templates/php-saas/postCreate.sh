#!/bin/bash

# PHP-SaaS Post-Create Hook
# This script runs after the project template is created

set -e

PROJECT_PATH=$1
PROJECT_NAME=$2

echo "Setting up PHP-SaaS project: $PROJECT_NAME"

cd "$PROJECT_PATH"

# Create src directory for the Laravel application
mkdir -p src

# Install PHP-SaaS using composer
echo "Installing PHP-SaaS starter kit..."
if command -v composer &> /dev/null; then
    composer create-project php-saas/php-saas src --prefer-dist --no-interaction
else
    echo "Warning: Composer not found. PHP-SaaS will need to be installed manually."
    echo "Run: composer create-project php-saas/php-saas src"
fi

echo "PHP-SaaS project setup completed!"
echo "Next steps:"
echo "1. Start the project: docker-compose up -d"
echo "2. Install dependencies: docker exec ${PROJECT_NAME}-app composer install"
echo "3. Set up the database: docker exec ${PROJECT_NAME}-app php artisan migrate"
echo "4. Configure Stripe/Paddle for billing in the .env file"