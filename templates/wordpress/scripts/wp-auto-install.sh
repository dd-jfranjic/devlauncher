#!/bin/bash

# WordPress Auto-Installation Script
# This script runs after WordPress containers are up to automatically complete the installation

echo "Starting WordPress auto-installation..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until wp db check --allow-root 2>/dev/null; do
  echo "Database not ready yet, waiting..."
  sleep 5
done
echo "Database is ready!"

# Check if WordPress is already installed
if wp core is-installed --allow-root 2>/dev/null; then
  echo "WordPress is already installed. Skipping installation."
  exit 0
fi

# Download WordPress core if not present
if [ ! -f /var/www/html/wp-config.php ]; then
  echo "Downloading WordPress core..."
  wp core download --allow-root --force
fi

# Create wp-config.php if it doesn't exist
if [ ! -f /var/www/html/wp-config.php ]; then
  echo "Creating wp-config.php..."
  wp config create \
    --dbname="${WORDPRESS_DB_NAME}" \
    --dbuser="${WORDPRESS_DB_USER}" \
    --dbpass="${WORDPRESS_DB_PASSWORD}" \
    --dbhost="${WORDPRESS_DB_HOST}" \
    --dbprefix="${WORDPRESS_TABLE_PREFIX:-wp_}" \
    --allow-root
fi

# Install WordPress
echo "Installing WordPress..."
wp core install \
  --url="http://localhost:${HTTP_PORT:-8080}" \
  --title="${WP_TITLE:-Dev WordPress Site}" \
  --admin_user="${WP_ADMIN_USER:-admin}" \
  --admin_password="${WP_ADMIN_PASSWORD:-admin123!}" \
  --admin_email="${WP_ADMIN_EMAIL:-admin@example.com}" \
  --skip-email \
  --allow-root

# Set up basic configuration
echo "Configuring WordPress settings..."

# Set timezone
wp option update timezone_string 'Europe/Zagreb' --allow-root

# Enable debug mode for development
wp config set WP_DEBUG true --raw --allow-root
wp config set WP_DEBUG_LOG true --raw --allow-root
wp config set WP_DEBUG_DISPLAY false --raw --allow-root

# Configure Mailpit for email
wp config set SMTP_HOST 'mailpit' --allow-root
wp config set SMTP_PORT 1025 --allow-root

# Install and activate useful development plugins
echo "Installing development plugins..."

# Install plugins for development
wp plugin install query-monitor --activate --allow-root 2>/dev/null || true
wp plugin install debug-bar --activate --allow-root 2>/dev/null || true

# Set permalinks structure
wp rewrite structure '/%postname%/' --allow-root

# Create sample content
echo "Creating sample content..."
wp post create --post_type=post --post_title='Welcome to Dev WordPress' --post_content='This is your development WordPress site. Happy coding!' --post_status=publish --allow-root

# Fix file permissions
echo "Fixing file permissions..."
chown -R www-data:www-data /var/www/html
find /var/www/html -type d -exec chmod 755 {} \;
find /var/www/html -type f -exec chmod 644 {} \;

echo "WordPress installation completed successfully!"
echo "----------------------------------------"
echo "Site URL: http://localhost:${HTTP_PORT:-8080}"
echo "Admin URL: http://localhost:${HTTP_PORT:-8080}/wp-admin"
echo "Username: ${WP_ADMIN_USER:-admin}"
echo "Password: ${WP_ADMIN_PASSWORD:-admin123!}"
echo "----------------------------------------"