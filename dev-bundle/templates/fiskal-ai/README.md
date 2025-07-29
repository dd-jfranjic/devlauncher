# Fiskal AI - Modern Invoicing System

## Tech Stack

- **Frontend**: Next.js 15.4.x (React 19)
- **Backend**: NestJS 11.x
- **Database**: PostgreSQL 17.x + Prisma ORM 6.11.x
- **Cache**: Redis 7.2.x
- **Language**: TypeScript 5.8.x
- **Runtime**: Node.js 22.17.x LTS
- **Containerization**: Docker + Docker Compose

## Services

- **Frontend**: http://localhost:{{WP_PORT}}
- **Backend API**: http://localhost:{{BACKEND_PORT}}
- **API Docs**: http://localhost:{{BACKEND_PORT}}/api/docs
- **Database Admin**: http://localhost:{{PMA_PORT}} (Adminer)
- **Email Testing**: http://localhost:{{MAIL_PORT}} (Mailpit)
- **Browser Context**: http://localhost:{{BROWSER_PORT}} (for Claude Code)

## Getting Started

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

2. **Initialize database**:
   ```bash
   docker exec {{PROJECT_NAME}}_backend npx prisma migrate dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:{{WP_PORT}}
   - API Documentation: http://localhost:{{BACKEND_PORT}}/api/docs

## Development

### Backend Development

```bash
# Enter backend container
docker exec -it {{PROJECT_NAME}}_backend sh

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

### Frontend Development

The frontend has hot reload enabled. Just edit files in the `frontend` directory and changes will be reflected immediately.

### Database Access

- **Adminer**: http://localhost:{{PMA_PORT}}
  - System: PostgreSQL
  - Server: postgres
  - Username: fiskal_user
  - Password: secure_password_123
  - Database: fiskal_db

## Claude Code Integration

This project is optimized for development with Claude Code:

1. **Browser Context Server** is available at port {{BROWSER_PORT}} for web scraping and testing
2. **Hot reload** is enabled for both frontend and backend
3. **Error logs** are accessible via Docker logs
4. **MCP Integrations** work seamlessly with the containerized environment

## Project Structure

```
{{PROJECT_NAME}}/
├── frontend/           # Next.js application
│   ├── app/           # App router pages
│   ├── components/    # React components
│   └── lib/          # Utilities and hooks
├── backend/          # NestJS API
│   ├── src/
│   │   ├── modules/  # Feature modules
│   │   ├── common/   # Shared code
│   │   └── config/   # Configuration
│   └── prisma/       # Database schema
└── docker-compose.yml
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://fiskal_user:secure_password_123@postgres:5432/fiskal_db
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:{{BACKEND_PORT}}
```

## Useful Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart backend
docker-compose restart frontend

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```