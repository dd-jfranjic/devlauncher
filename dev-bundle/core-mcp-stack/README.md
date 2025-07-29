# DevLauncher Core Services

## Servisi uključeni:

1. **MySQL 8.0** - Port 3306
   - Username: devuser / Password: devpass
   - Root password: root
   - Database: dev

2. **Redis** - Port 6379
   - Cache i session storage

3. **phpMyAdmin** - Port 8080
   - http://localhost:8080
   - Login: root / root

4. **Mailpit** - Port 8025
   - http://localhost:8025
   - SMTP: localhost:1025

5. **FileBrowser** - Port 8090
   - http://localhost:8090
   - No authentication required

## Pokretanje:

```bash
docker compose up -d
```

## Zaustavljanje:

```bash
docker compose down
```

## Pristup logovima:

```bash
docker compose logs -f [service-name]
```

## URLs:
- phpMyAdmin: http://localhost:8080
- Mailpit: http://localhost:8025
- FileBrowser: http://localhost:8090