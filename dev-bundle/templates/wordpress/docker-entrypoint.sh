#!/bin/bash
set -e

# Check if WordPress files exist
if [ ! -f /var/www/html/wp-settings.php ]; then
    echo "WordPress files not found. Copying WordPress files..."
    cp -r /usr/src/wordpress/* /var/www/html/
    chown -R www-data:www-data /var/www/html
    echo "WordPress files copied successfully!"
fi

# Run the original entrypoint
exec docker-entrypoint.sh "$@"