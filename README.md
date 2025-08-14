# 🚀 Dev Launcher

**Dev Launcher** je Windows-native desktop aplikacija za upravljanje Docker-based development projektima. Omogućava kreiranje i pokretanje development okruženja jednim klikom, s podrškom za WSL i Windows lokacije.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%2011-lightgrey)

## ✨ Značajke

- 🎯 **One-click projekt setup** - Kreirajte i pokrenite projekte u nekoliko sekundi
- 🐳 **All-in-Docker arhitektura** - Sve komponente rade u kontejnerima
- 📍 **WSL i Windows podrška** - Optimizirano za obje lokacije
- 🔧 **Template sustav** - Blank, Next.js, WordPress templati
- 🔌 **Port management** - Automatska alokacija bez kolizija
- 🤖 **AI integracija** - Claude i Gemini CLI podrška
- 📊 **Real-time logovi** - Praćenje Docker logova uživo
- 🎨 **Moderni UI** - Electron + React + Tailwind CSS

## 📋 Preduvjeti

- **Windows 11** (ili Windows 10 verzija 2004+)
- **WSL2** s Ubuntu distribucijom
- **Docker Desktop** za Windows
- **Node.js 20+** (za development)
- **PowerShell 7** (preporučeno)
- **Windows Terminal** (preporučeno)
- **VS Code** (opcionalno)

## 🔧 Instalacija

### 1. Klonirajte repozitorij

```bash
git clone https://github.com/yourusername/dev-launcher.git
cd dev-launcher
```

### 2. Instalirajte dependencies

```bash
npm install
```

### 3. Postavite bazu podataka

```bash
# Generirajte Prisma client
npx prisma generate

# Pokrenite migracije
npx prisma migrate dev --name init
```

### 4. Pokrenite Dev Launcher u Docker kontejneru

```bash
# Buildajte i pokrenite kontejner
docker compose up -d

# Provjerite logove
docker logs devlauncher -f
```

Dev Launcher backend će biti dostupan na `http://localhost:9976`

### 5. Pokrenite Electron aplikaciju

```bash
# U novom terminalu
npm run dev:client
```

## 🚀 Korištenje

### Kreiranje novog projekta

1. Kliknite **"New Project"** u sidebaru
2. Unesite ime projekta
3. Odaberite tip (Blank, Next.js, WordPress)
4. Odaberite lokaciju (WSL ili Windows)
5. Kliknite **"Create Project"**

### Upravljanje projektima

- **Start/Stop** - Pokrenite ili zaustavite Docker kontejnere
- **Open Terminal** - Otvorite PowerShell u project direktoriju
- **Open Folder** - Otvorite File Explorer
- **Open Editor** - Otvorite VS Code

### Instalacija CLI alata

1. Otvorite projekt
2. Idite na **Overview** tab
3. Kliknite **"Install Claude CLI"** ili **"Install Gemini CLI"**

## 🛠️ Development

### Struktura projekta

```
dev-launcher/
├── server/          # Backend API (Node.js + Express)
├── client/          # Frontend (React + Vite)
├── electron/        # Electron main process
├── templates/       # Project templates
├── .claude/         # Claude sub-agents
└── docker-compose.yml
```

### Development mode

```bash
# Pokrenite sve u development modu
npm run dev

# Ili pojedinačno:
npm run dev:server   # Backend
npm run dev:client   # Frontend
```

### Build za produkciju

```bash
npm run build
```

## 🐳 Docker arhitektura

Dev Launcher koristi "All-in-Docker" pristup:

- **devlauncher** kontejner - Backend API server
- **Per-project kontejneri** - Svaki projekt ima vlastite kontejnere
- **Izolirane mreže** - Svaki projekt ima vlastitu Docker mrežu
- **Named volumes** - Za perzistentne podatke

### Docker Compose konfiguracija

```yaml
services:
  devlauncher:
    build: .
    container_name: devlauncher
    ports:
      - "127.0.0.1:9976:9976"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - devl_db:/app/server/prisma
      - devl_logs:/app/.devlauncher/logs
```

## 📝 API Dokumentacija

Backend API je dostupan na `http://localhost:9976/api/v1`

### Autentifikacija

Svi API pozivi zahtijevaju Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:9976/api/v1/projects
```

Token se automatski generira pri prvom pokretanju i sprema u `~/.devlauncher/auth.json`

### Glavni endpointi

- `GET /projects` - Lista projekata
- `POST /projects` - Kreiraj novi projekt
- `POST /projects/:slug/up` - Pokreni projekt
- `POST /projects/:slug/down` - Zaustavi projekt
- `DELETE /projects/:slug` - Obriši projekt

## 🧪 Testiranje

```bash
# Unit testovi
npm test

# E2E testovi
npm run test:e2e

# Linting
npm run lint

# Type checking
npm run typecheck
```

## 📊 Performanse

- **UI load time**: < 1.5s
- **Project creation**: < 90s
- **Port allocation**: < 500ms
- **Podrška za 1000+ projekata**

## 🔒 Sigurnost

- API dostupan samo na localhost (127.0.0.1)
- Bearer token autentifikacija
- CSRF zaštita za mutacije
- Validacija svih inputa
- Audit log za sve akcije

## 🐛 Poznati problemi

1. **Windows bind mount performanse** - Koristite WSL lokaciju za bolje performanse
2. **Port kolizije** - Aplikacija automatski realocira portove
3. **WSL path duljina** - Koristite kratke nazive projekata

## 🤝 Doprinosi

Doprinosi su dobrodošli! Molimo:

1. Fork repozitorij
2. Kreirajte feature branch
3. Commitajte promjene
4. Push na branch
5. Otvorite Pull Request

## 📄 Licenca

MIT License - pogledajte [LICENSE](LICENSE) datoteku

## 👥 Tim

- **DataDox** - Glavni razvoj

## 📞 Podrška

- **GitHub Issues**: [github.com/yourusername/dev-launcher/issues](https://github.com/yourusername/dev-launcher/issues)
- **Dokumentacija**: [docs/](docs/)

---

Made with ❤️ by DataDox