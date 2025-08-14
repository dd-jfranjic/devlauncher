# {{NAME}}

Full WordPress development environment with Nginx, PHP-FPM, MariaDB, phpMyAdmin, and Mailpit.

## Project Information

- **Name:** {{NAME}}
- **Slug:** {{SLUG}}
- **Type:** WordPress
- **Location:** {{LOCATION}}
- **HTTP Port:** {{HTTP_PORT}}
- **Database Port:** {{DB_PORT}}
- **phpMyAdmin Port:** {{PHPMYADMIN_PORT}}
- **Mailpit UI Port:** {{MAILPIT_UI_PORT}}
- **Mailpit SMTP Port:** {{MAILPIT_SMTP_PORT}}

## Quick Start

1. **Start the environment:**
   ```bash
   docker compose up -d
   ```

2. **Wait for setup to complete** (WordPress will be automatically installed)

3. **Access your site:**
   - **Website:** [http://localhost:{{HTTP_PORT}}](http://localhost:{{HTTP_PORT}})
   - **Admin:** [http://localhost:{{HTTP_PORT}}/wp-admin](http://localhost:{{HTTP_PORT}}/wp-admin)
   - **Username:** {{WP_ADMIN_USER}}
   - **Password:** {{WP_ADMIN_PASSWORD}}

## Development Tools

### phpMyAdmin
Access your database at [http://localhost:{{PHPMYADMIN_PORT}}](http://localhost:{{PHPMYADMIN_PORT}})
- **Server:** db
- **Username:** {{DB_USER}}
- **Password:** {{DB_PASSWORD}}

### Mailpit (Email Testing)
View emails sent by WordPress at [http://localhost:{{MAILPIT_UI_PORT}}](http://localhost:{{MAILPIT_UI_PORT}})
- All emails are captured locally
- No emails are sent externally

### WP-CLI
Use WordPress CLI for development tasks:
```bash
# List all commands
docker compose exec cli wp --help

# Install a plugin
docker compose exec cli wp plugin install contact-form-7 --activate

# Create a post
docker compose exec cli wp post create --post_title="My Post" --post_content="Hello World" --post_status=publish

# Update WordPress
docker compose exec cli wp core update

# Export/Import database
docker compose exec cli wp db export backup.sql
docker compose exec cli wp db import backup.sql
```

## Project Structure

```
{{SLUG}}/
├── docker-compose.yml      # Docker services configuration
├── .env                    # Environment variables
├── nginx/                  # Nginx configuration
│   ├── nginx.conf         # Main Nginx config
│   └── wordpress.conf     # WordPress-specific config
├── php/                   # PHP configuration
│   ├── php.ini           # PHP settings
│   └── www.conf          # PHP-FPM pool config
├── scripts/               # Utility scripts
│   └── wp-setup.sh       # WordPress installation script
├── wp-content/           # WordPress content (bind-mounted)
│   ├── themes/           # Custom themes
│   ├── plugins/          # Custom plugins
│   └── uploads/          # Uploaded files
└── .devlauncher.json     # Dev Launcher configuration
```

## Environment Variables

The following variables are configured in `.env`:

- `DB_NAME`: {{DB_NAME}}
- `DB_USER`: {{DB_USER}}
- `DB_PASSWORD`: {{DB_PASSWORD}}
- `DB_ROOT_PASSWORD`: {{DB_ROOT_PASSWORD}}
- `WP_TITLE`: {{WP_TITLE}}
- `WP_ADMIN_USER`: {{WP_ADMIN_USER}}
- `WP_ADMIN_PASSWORD`: {{WP_ADMIN_PASSWORD}}
- `WP_ADMIN_EMAIL`: {{WP_ADMIN_EMAIL}}

## Docker Services

- **nginx**: Web server (Alpine-based)
- **php**: PHP-FPM 8.2 with WordPress
- **db**: MariaDB 10.11 database
- **phpmyadmin**: Database management interface
- **mailpit**: Email testing tool
- **cli**: WP-CLI for command line operations

## Development Workflow

### Theme Development
1. Create your theme in `wp-content/themes/your-theme/`
2. Files are automatically synced with the container
3. Activate your theme via WordPress admin or WP-CLI

### Plugin Development  
1. Create your plugin in `wp-content/plugins/your-plugin/`
2. Files are automatically synced with the container
3. Activate your plugin via WordPress admin or WP-CLI

### Database Management
- Use phpMyAdmin for visual database management
- Use WP-CLI for command-line database operations
- Database is persisted in Docker volume `db_data`

## Common Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f nginx

# Restart a service
docker compose restart php

# Access container shell
docker compose exec cli bash
docker compose exec php ash

# Backup database
docker compose exec cli wp db export - > backup.sql

# Reset WordPress (⚠️ DESTRUCTIVE)
docker compose down -v
docker compose up -d
```

## Performance Notes

{{#if (eq LOCATION "windows")}}
**Windows Location Detected:**
- Bind mounts may be slower on Windows NTFS
- Consider using WSL location for better performance
- File operations may take longer than on WSL
{{/if}}

{{#if (eq LOCATION "wsl")}}
**WSL Location Detected:**
- Optimal performance with native Linux filesystem
- Fast file operations and bind mounts
- Recommended for WordPress development
{{/if}}

## Troubleshooting

### WordPress Installation Issues
```bash
# Re-run WordPress setup
./scripts/wp-setup.sh

# Check service health
docker compose ps

# Check logs
docker compose logs
```

### Database Connection Issues
```bash
# Check database service
docker compose exec db mysql -u{{DB_USER}} -p{{DB_PASSWORD}} -e "SHOW DATABASES;"

# Reset database
docker compose down -v db
docker compose up -d db
```

### Permission Issues
```bash
# Fix wp-content permissions
docker compose exec php chown -R www-data:www-data /var/www/html/wp-content
```

## Security Notes

- This environment is for **development only**
- Default passwords should be changed for production
- Database is accessible on localhost:{{DB_PORT}}
- WordPress debug mode is enabled

## Learn More

- [WordPress Documentation](https://wordpress.org/support/)
- [WP-CLI Documentation](https://wp-cli.org/)
- [WordPress Codex](https://codex.wordpress.org/)
- [WordPress Developer Resources](https://developer.wordpress.org/)