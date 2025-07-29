# 🚀 DevLauncher - Quick Start

## Pokretanje (samo jednom!)

Dvoklikom na:
```
dev-bundle/START-DEVLAUNCHER.bat
```

Ova skripta automatski:
1. ✅ Pokreće Docker servise (MySQL, Redis, itd.)
2. ✅ Instalira potrebne dependencies
3. ✅ Otvara DevLauncher GUI aplikaciju

## Korištenje

Nakon pokretanja:
- **Novi projekt**: Klik na "New Project" u GUI-ju
- **Postojeći projekti**: Vidljivi na home screen-u
- **Start/Stop**: Kontrole za svaki projekt
- **VS Code**: Direktno otvaranje projekata

## Servisi

Automatski pokrenuti:
- MySQL: localhost:3306
- Redis: localhost:6379
- phpMyAdmin: http://localhost:8080
- Mailpit: http://localhost:8025
- FileBrowser: http://localhost:8090

## Zaustavljanje

Za potpuno zaustavljanje:
```bash
cd dev-bundle/core-mcp-stack
docker compose down
```

---
**Napomena**: DevLauncher je centralna aplikacija - pokrenete je jednom i upravlja svim vašim projektima!