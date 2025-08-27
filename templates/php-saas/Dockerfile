FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nginx \
    supervisor \
    nodejs \
    npm

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Create basic directory structure for PHP-SaaS
RUN mkdir -p /var/www/html/public

# Create basic index.php for initial setup
RUN echo '<?php echo "PHP-SaaS setup in progress. Please wait for the post-create hook to complete."; ?>' > /var/www/html/public/index.php

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/sites-available/default

# Copy supervisor configuration
COPY <<EOF /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:php-fpm]
command=php-fpm
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/php-fpm.stderr.log
stdout_logfile=/var/log/supervisor/php-fpm.stdout.log

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/nginx.stderr.log
stdout_logfile=/var/log/supervisor/nginx.stdout.log
EOF

# Expose port 80
EXPOSE 80

# Start supervisor
CMD ["/usr/bin/supervisord"]