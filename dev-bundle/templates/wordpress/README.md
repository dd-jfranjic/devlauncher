# {{PROJECT_NAME}} - WordPress Project

Created with DevLauncher on {{CREATED_DATE}}

## 🚀 Quick Start

1. **Start the project:**
   ```bash
   docker compose up -d
   ```

2. **Access your sites:**
   - WordPress: http://localhost:{{WP_PORT}}
   - phpMyAdmin: http://localhost:{{PMA_PORT}}
   - Mailpit: http://localhost:{{MAIL_PORT}}

3. **WordPress Admin Login:**
   - URL: http://localhost:{{WP_PORT}}/wp-admin
   - Username: `admin`
   - Password: `admin123`
   
   WordPress will be automatically installed when containers start!

## 📁 Project Structure

```
{{PROJECT_NAME}}/
├── docker-compose.yml    # Docker configuration
├── .env                  # Environment variables
├── wordpress/            # WordPress files (created after first run)
├── wp-cli.yml           # WP-CLI configuration
└── uploads.ini          # PHP upload settings
```

## 🔧 Common Commands

**Start containers:**
```bash
docker compose up -d
```

**Stop containers:**
```bash
docker compose down
```

**View logs:**
```bash
docker compose logs -f wordpress
```

**Access WordPress container:**
```bash
docker compose exec wordpress bash
```

**Use WP-CLI:**
```bash
docker compose exec wordpress wp plugin list
```

## 📝 Database Access

- **phpMyAdmin**: http://localhost:{{PMA_PORT}}
- **MySQL Host**: localhost:{{DB_PORT}}
- **Database**: {{PROJECT_NAME}}_db
- **User**: {{PROJECT_NAME}}_user
- **Password**: Check .env file

## ⚙️ Configuration

All settings are in the `.env` file. You can modify:
- Ports
- Database credentials
- WordPress settings

After changing `.env`, restart containers:
```bash
docker compose down
docker compose up -d
```

## 🐛 Troubleshooting

**Port already in use:**
Edit `.env` and change the port numbers.

**Can't access WordPress:**
Wait 30-60 seconds after starting for WordPress to initialize.

**Database connection error:**
Check that MySQL container is running: `docker compose ps`