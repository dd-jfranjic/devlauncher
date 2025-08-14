# 🚀 Dev Launcher - Brzi Start

## ⚡ Pokretanje u 3 koraka

### Windows (PowerShell 7)

```powershell
# 1. Kloniraj i uđi u direktorij
git clone https://github.com/yourusername/dev-launcher.git
cd dev-launcher

# 2. Pokreni startup skriptu
.\scripts\start.ps1

# 3. Aplikacija će se automatski otvoriti!
```

### Alternativa: Ručno pokretanje

```bash
# 1. Instaliraj dependencies
npm install

# 2. Pripremi bazu podataka
npx prisma generate
npx prisma migrate dev --name init

# 3. Pokreni Docker container
docker compose up -d

# 4. Pokreni Electron aplikaciju (u novom terminalu)
npm run dev:client
```

## ✅ Provjera da sve radi

1. **Backend API**: http://localhost:9976/health
2. **Electron aplikacija**: Trebala bi se automatski otvoriti
3. **Docker container**: `docker ps` - trebate vidjeti `devlauncher` container

## 🎯 Prvi projekt

1. Klikni **"New Project"** u aplikaciji
2. Unesi ime: `my-first-app`
3. Odaberi **Next.js** template
4. Odaberi **WSL** lokaciju (preporučeno)
5. Klikni **"Create Project"**

Projekt će biti kreiran u: `/home/jfranjic/dev-projects/my-first-app`

## 🔧 Troubleshooting

### "Docker is not running"
```powershell
# Pokreni Docker Desktop i pričekaj da se učita
# Zatim ponovno pokreni:
.\scripts\start.ps1
```

### "Port 9976 already in use"
```powershell
# Zaustavi postojeći container
docker stop devlauncher
docker rm devlauncher

# Ponovno pokreni
docker compose up -d
```

### "Cannot find module"
```powershell
# Obriši node_modules i reinstaliraj
Remove-Item -Recurse -Force node_modules
npm install
```

### WSL problemi
```powershell
# Provjeri je li WSL2 instaliran
wsl --list --verbose

# Ako nije, instaliraj Ubuntu:
wsl --install -d Ubuntu
```

## 📝 Napomene

- **Prvi put** pokretanje može potrajati nekoliko minuta (download Docker images)
- **Auth token** se automatski generira u `~/.devlauncher/auth.json`
- **Logovi** su dostupni u `.devlauncher/logs/`
- **Database** se čuva u Docker volumenu `devlauncher_db`

## 🆘 Pomoć

- Provjeri [README.md](README.md) za detaljne upute
- Pogledaj [CLAUDE.md](CLAUDE.md) za development guidelines
- GitHub Issues za bug reports

---

**Happy coding! 🎉**