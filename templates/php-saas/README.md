# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Features

This project is built with **PHP-SaaS**, a comprehensive starter kit that includes:

### 🚀 **Core Technology Stack**
- **Laravel** - PHP framework
- **Inertia.js** - Modern SPA experience with React/Vue
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Beautiful component library

### 💳 **SaaS Features**
- **Authentication** - Full auth system with 2FA
- **Billing Integration** - Stripe and Paddle support
- **Multi-tenancy** - Projects, Teams & Organizations
- **API Tokens** - For external integrations

### 🛠 **Development**
- **100% Test Coverage** - PHPUnit and Pest
- **Code Quality** - PHPStan level 5, ESLint
- **Code Style** - Laravel Pint, Prettier
- **CI/CD** - GitHub Actions ready

## Getting Started

### Prerequisites
- Docker Desktop
- WSL2 (for Windows)

### Installation
The project has been set up with Docker containers:

```bash
# Start all services
docker-compose up -d

# Install dependencies
docker exec {{SLUG}}-app composer install

# Generate application key
docker exec {{SLUG}}-app php artisan key:generate

# Run migrations
docker exec {{SLUG}}-app php artisan migrate

# Install and build frontend assets
docker exec {{SLUG}}-app npm install
docker exec {{SLUG}}-app npm run build
```

## Services

- **Application**: http://localhost:{{APP_PORT}}
- **Database**: MySQL on port {{DB_PORT}}
- **Redis**: Cache on port {{REDIS_PORT}}
- **MailHog**: Email testing on http://localhost:{{MAILHOG_PORT}}

## Environment Variables

Key environment variables are configured in `.env`:

- `APP_NAME` - Your application name
- `APP_URL` - Application URL
- `DB_*` - Database configuration
- `STRIPE_*` - Stripe billing configuration
- `PADDLE_*` - Paddle billing configuration

## Development Workflow

1. **Create your SaaS application logic**
2. **Configure billing** (Stripe or Paddle)
3. **Set up teams and organizations**
4. **Customize frontend** (React or Vue with Inertia.js)
5. **Write tests** with the included testing setup

## PHP-SaaS Documentation

For detailed documentation about PHP-SaaS features, visit:
- **Website**: https://php-saas.com
- **Documentation**: https://php-saas.com/docs/introduction
- **GitHub**: https://github.com/php-saas/php-saas

## License

This project is built with PHP-SaaS. Please check the PHP-SaaS license terms.