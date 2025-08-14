#!/bin/bash

# WordPress Setup Script for Dev Launcher
# This script initializes WordPress after containers are started

set -e

echo "🚀 Setting up WordPress for {{SLUG}}..."

# Load environment variables
source .env

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if WordPress is already installed
if docker compose exec -T cli wp core is-installed 2>/dev/null; then
    echo "✅ WordPress is already installed"
    exit 0
fi

echo "📦 Installing WordPress..."

# Download WordPress core if not present
docker compose exec -T cli wp core download --force

# Create wp-config.php
docker compose exec -T cli wp config create \
    --dbname="$DB_NAME" \
    --dbuser="$DB_USER" \
    --dbpass="$DB_PASSWORD" \
    --dbhost="db:3306" \
    --force

# Add extra config for development
docker compose exec -T cli wp config set WP_DEBUG true --raw
docker compose exec -T cli wp config set WP_DEBUG_LOG true --raw
docker compose exec -T cli wp config set WP_DEBUG_DISPLAY false --raw
docker compose exec -T cli wp config set SCRIPT_DEBUG true --raw

# Install WordPress
docker compose exec -T cli wp core install \
    --url="http://localhost:{{HTTP_PORT}}" \
    --title="$WP_TITLE" \
    --admin_user="$WP_ADMIN_USER" \
    --admin_password="$WP_ADMIN_PASSWORD" \
    --admin_email="$WP_ADMIN_EMAIL"

# Install useful plugins for development
echo "🔌 Installing development plugins..."
docker compose exec -T cli wp plugin install query-monitor --activate
docker compose exec -T cli wp plugin install wp-mail-logging --activate

# Set pretty permalinks
docker compose exec -T cli wp rewrite structure '/%postname%/'

# Create a sample post
docker compose exec -T cli wp post create \
    --post_type=post \
    --post_title="Welcome to {{NAME}}" \
    --post_content="This is your new WordPress development environment created by Dev Launcher. Happy coding!" \
    --post_status=publish

# Create a sample page
docker compose exec -T cli wp post create \
    --post_type=page \
    --post_title="Sample Page" \
    --post_content="This is a sample page. Edit or delete it, then start writing!" \
    --post_status=publish

echo "✅ WordPress setup complete!"
echo ""
echo "🌐 Access your WordPress site:"
echo "   Website: http://localhost:{{HTTP_PORT}}"
echo "   Admin: http://localhost:{{HTTP_PORT}}/wp-admin"
echo "   Username: $WP_ADMIN_USER"
echo "   Password: $WP_ADMIN_PASSWORD"
echo ""
echo "🔧 Development tools:"
echo "   phpMyAdmin: http://localhost:{{PHPMYADMIN_PORT}}"
echo "   Mailpit: http://localhost:{{MAILPIT_UI_PORT}}"
echo ""
echo "📝 Useful commands:"
echo "   WP-CLI: docker compose exec cli wp --help"
echo "   Logs: docker compose logs -f"
echo ""