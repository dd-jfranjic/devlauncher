# Dev Launcher — PRD v0.2 (Windows Native GUI + WSL backend)

**Datum:** 10.8.2025
**Okruženje:** Windows 11 (native GUI) + WSL2 (Ubuntu) + Docker Desktop (WSL backend)
**Radni naziv proizvoda:** Dev Launcher
**Vlasnik dokumenta:** (dodati ime)
**Verzija:** 0.4 (All‑in Docker, Pro UI/UX, Top bar, PS7 default, fiksne root putanje)

---

## 0) Kratki outline (za brzi pregled)

1. Sažetak i cilj
2. Scope MVP‑a vs. Non‑scope
3. Osobe i use caseovi
4. Funkcionalni zahtjevi (FR‑0 … FR‑14)
5. UX specifikacija (GUI + CLI)
6. Arhitektura i tehnologije (Windows native + WSL bridge)
7. Template sustav (per‑location varijante)
8. Detalji templateova (blank, Next.js, WordPress)
9. Pravila imenovanja i validacije
10. Operacije nad projektima (create/open/up/down/delete)
11. Integracija s Claude Code (CLI + MCP)
12. Konfiguracija Launchera (global + per‑project)
13. Sigurnost, performanse, logging
14. Milestones, plan isporuke i testiranje
15. Rizici i mitigacije
16. Otvorena pitanja
17. Dodaci (glue code, primjeri komandi, compose varijante)

---

## 1) Sažetak i cilj

**Problem:** Dev okruženja na Windows 11 + WSL2 + Docker često traže niz ručnih koraka (folderi, naming, odabir stacka, compose, portovi, CLI alati, MCP konektori). Dodatno, prethodni GUI u WSLg je kidao integraciju s OS‑om (Terminal, Explorer, VS Code, URL‑ovi).
**Cilj:** Dev Launcher je **Windows native** desktop aplikacija s kojom se projekti kreiraju i pokreću u **jednom kliku** / **jednoj CLI naredbi**. Korisnik može **birati lokaciju projekta**: *WSL* (preporučeno za Docker performanse) ili *Windows* (NTFS), uz prilagodbu akcija i templateova ovisno o lokaciji.

**Ključne vrijednosti**

* Standardizirani naming i struktura
* Modularni template sustav (lako dodavanje novih)
* Per‑project **Claude Code CLI** + MCP setup (opcionalno)
* One‑click Shortcuts (Terminal, VS Code, Explorer, Docker, URL‑ovi)
* URL Resolver (localhost/127.0.0.1/host.docker.internal/WSL\_IP)
* Dinamična alokacija portova (na *create* i svaki *up*)
* Sigurno *delete* (folder + Docker resursi)
* **Izbor lokacije**: *WSL* ili *Windows*

---

## 2) Scope MVP‑a

**Uključeno**

* GUI (Windows native) + CLI alat
* *New Project* s izborom: **Type** (blank/nextjs/wordpress) i **Location** (*WSL* ili *Windows*)
* Kreiranje projekata u `~/dev` (WSL) **ili** `C:\Dev` (Windows; promjenjivo u Settings)
* Generiranje strukture iz templatea (render varijabli i per‑location varijanti)
* Auto dodjela portova + re‑check na svakom `up`
* `docker compose up/down` (s upozorenjima za performanse na Windows bind mountovima)
* One‑click Shortcuts (Terminal/Explorer/Editor/URLs/Docker) s lokacijskim ponašanjem
* Per‑project Claude Code CLI + MCP (cilj: instalirati u *radno okruženje* projekta)
* Globalna konfiguracija Launchera + per‑project metadata
* Launcher self‑management shortcuti

**Nije u MVP‑u (Non‑scope)**

* Traefik/HTTPS reverse proxy
* Napredna orkestracija više servisa (redis, mailhog…) osim ako template to eksplicitno ne traži
* Cloud deploy
* Multi‑user sinkronizacija
* Automatska *sync* rješenja Windows↔WSL (Mutagen/Unison) — stavljeno u backlog

---

## 3) Osobe i use caseovi

**Primarni korisnik:** Dev/creator na Windows 11. Radi s WSL2 i Docker Desktopom, ali želi **čisti Windows UI** i pouzdane gumbe.

**Glavni use caseovi**

1. "Kreiraj Next.js projekt u **WSL** i pokreni ga odmah" (docker dev, hot‑reload).
2. "Kreiraj WordPress stack u **WSL** i otvori admin/install".
3. "Kreiraj Next.js u **Windows** lokaciji i **bez Docker‑a** (Node runtime na hostu)".
4. "Kreiraj WordPress u **Windows** lokaciji (Docker), uz upozorenje na performanse bind mounta".
5. "Instaliraj Claude CLI + MCP po projektu i otvori MCP tab".
6. "Obriši projekt (safe) + sve Docker resurse".
7. "Prikaži sve URL‑ove uz URL Resolver i health‑check".

---

## 4) Funkcionalni zahtjevi (Acceptance kriteriji)

### FR‑0 Izbor lokacije (New Project)

**Given** korisnik otvara *New Project*, **when** odabere *Location = WSL* ili *Windows*, **then** Launcher će kreirati projekt u odgovarajućem root pathu i sve *akcije* prilagoditi lokaciji.

**Acceptance**

* *WSL:* path npr. `/home/<user>/dev/<slug>`; akcije kroz `wsl.exe` (Ubuntu profil)
* *Windows:* path npr. `C:\Dev\<slug>`; akcije kroz Windows procese (`wt.exe`, `explorer.exe`, `code`)
* `.devlauncher.json` sadrži `location: "wsl"|"windows"` i oba patha (`pathWSL`, `pathWin`, `pathUNC` ako WSL)

### FR‑1 Kreiranje projekta

**Given** valjan slug, type i location, **when** *Create*, **then** kreira se folder, renderiraju template datoteke (per‑location), generira `.devlauncher.json`, alociraju portovi, opcionalno `up` + Claude/MCP setup.

**Acceptance**

* Kreiran folder i metapodaci (WSL ili Windows)
* Registry ažuriran
* Ako *Auto‑start*: `docker compose up -d` (ako template koristi Docker)
* Ako *Set up Claude/MCP*: installer cilja **radno okruženje projekta** (WSL za WSL lokaciju; Windows za Windows lokaciju)

### FR‑2 Validacija imena (slug)

Regex `^[a-z][a-z0-9-]{1,38}[a-z0-9]$` (min 3, max 40; mala slova, brojke, crtice; ne počinje/završava crticom). Greške se jasno prikazuju.

### FR‑3 Portovi i kolizije

Auto‑dodjela na temelju hash(slug) + scan zauzeća; re‑check na **svakom** `up`. Ako kolizija, nudimo sljedeći slobodan i ažuriramo `.devlauncher.json`.

### FR‑4 Claude Code CLI + MCP (opcionalno)

Installer radi u *radnom okruženju projekta*:

* **WSL lokacija:** vendor/system instalacija u WSL; MCP adapteri izvršavaju se u WSL
* **Windows lokacija:** vendor/system instalacija u Windows; MCP adapteri izvršavaju se u Windowsu ili u Docker kontekstu ovisno o serveru

### FR‑5 Brisanje projekta (safe delete)

Zaustavi kontejnere, `compose down` (opcija purgiranja volumena), obriši folder, ažuriraj registry; odbij akciju ako path nije unutar dopuštenog root‑a lokacije.

### FR‑6 Lista i detalji projekata

`slug`, `type`, `location`, status (running/stopped), URL/portovi, pathovi (WSL/Windows/UNC), datum kreiranja.

### FR‑7 One‑click Shortcuts (per project, per location)

**WSL projekt**

* *Open Terminal:* `wt.exe` → Ubuntu profil, cwd `\\wsl$\<Distro>\home\<user>\dev\<slug>`
* *Open Folder:* `explorer.exe "\\wsl$\<Distro>\home\<user>\dev\<slug>"`
* *Open in Editor:* `wsl.exe -d <Distro> -- bash -lc "cd /home/<user>/dev/<slug> && code ."`

**Windows projekt**

* *Open Terminal:* `wt.exe -w 0 nt -d "C:\\Dev\\<slug>"` (profil prema Settings)
* *Open Folder:* `explorer.exe "C:\\Dev\\<slug>"`
* *Open in Editor:* `code "C:\\Dev\\<slug>"`

### FR‑8 Docker tab (per project)

Lista servisa, status, portovi; quick actions: Logs (follow), Restart service, Open in Docker Desktop.

**Napomena performansi**

* *WSL lokacija:* bind mount iz WSL FS → **najbolje performanse**
* *Windows lokacija (Docker bind):* upozorenje o mogućem sporijem I/O; mogućnost *named volumes* varijante (vidi §7 i §17)

### FR‑9 MCP Manager (per project)

Lista dostupnih MCP servera, Install/Remove/Configure/Test; *Save/Apply Profile*; logovi instalacije.

### FR‑10 URL Resolver & host aliasi

Matrica testiranja: `localhost`, `127.0.0.1`, `host.docker.internal`, `WSL_IP` (fallback). Health‑check template:

* **WordPress:** `GET <BASE>/wp-json` (HTTP 200 + JSON)
* **Next.js:** `GET <BASE>/api/health` (vrati `{ok:true}`); fallback `HEAD <BASE>/`

Odabrani base URL upisuje se u `.devlauncher.json` i koristi u MCP konfiguraciji. UI prikazuje sve testirane varijante i rezultat.

### FR‑11 Start/Stop all

`docker compose up -d` / `docker compose down` za projekt; vidljiv status po servisu i ukupni status.

### FR‑12 Centralized logs (per project)

Opcionalni log‑collector servis koji prikuplja logove kroz Docker API i zapisuje ih u `./.devlauncher/logs/`.

### FR‑13 Runtime override (Next.js)

**Optional:** pri kreiranju *Next.js* projekta na **Windows lokaciji** omogućiti *runtime=node* (bez Docker‑a, koristi lokalni Node 20+), ili *runtime=docker* (default).

**Acceptance**

* *runtime=node*: `npm run dev` na hostu; *Open Terminal/Editor* direktno na `C:\Dev\<slug>`
* *runtime=docker*: standardni compose

### FR‑15 Install Claude Code CLI (per project)

**Opis:** Svaki projekt ima gumb **Install Claude Code CLI**. Klik izvršava instalaciju u **rootu tog projekta** i nakon toga radi health‑check.

**Command**

* `npm install -g @anthropic-ai/claude-code` → zatim `claude --version`

**Acceptance (uključuje UX)**

* Gumb je vidljiv u *Overview → Quick Actions* i u *MCP* tabu.
* **WSL projekt:**
  `wsl.exe -d Ubuntu -- bash -lc "cd /home/jfranjic/dev-projects/<slug> && npm install -g @anthropic-ai/claude-code && claude --version"`
* **Windows projekt (PS7):**
  `pwsh -NoProfile -Command "Set-Location 'C:\Users\jfran\Documents\dev-projects\<slug>'; npm install -g @anthropic-ai/claude-code; claude --version"`
* **Spinner + toast UX:**

  * Stanja: *Idle → Installing… → (Done | Failed)*
  * *Installing…* prikazuje loader u gumbu + disables gumb.
  * *Done:* toast „Claude CLI installed (vX.Y.Z)“.
  * *Failed:* toast s kratkim razlogom + link na log.
* **Logging:** `./.devlauncher/logs/claude-install.log` (stream output); u `.devlauncher.json` upisati `claude.cli.installed=true` i `claude.cli.version`.

### FR‑16 Install Google Gemini CLI (per project)

**Opis:** Svaki projekt ima gumb **Install Google Gemini CLI**. Klik izvodi `npm install -g @google/gemini-cli` u **rootu tog projekta**, zatim health‑check `gemini --version` (ili `gemini --help` ako verzija nije dostupna).

**Acceptance (uključuje UX)**

* Gumb je vidljiv u *Overview → Quick Actions* i u *MCP* tabu.
* **WSL projekt:**
  `wsl.exe -d Ubuntu -- bash -lc "cd /home/jfranjic/dev-projects/<slug> && npm install -g @google/gemini-cli && (gemini --version || gemini --help)"`
* **Windows projekt (PS7):**
  `pwsh -NoProfile -Command "Set-Location 'C:\Users\jfran\Documents\dev-projects\<slug>'; npm install -g @google/gemini-cli; if (Get-Command gemini -ErrorAction SilentlyContinue) { gemini --version } else { gemini --help }"`
* **Spinner + toast UX:** ista stanja kao FR‑15; *Done* toast „Gemini CLI installed (vX.Y.Z)“ ili „Gemini CLI ready“.
* **Logging:** `./.devlauncher/logs/gemini-install.log`; u `.devlauncher.json` upisati `gemini.cli.installed=true` i `gemini.cli.version` (ako dostupno).

---

## 5) UX specifikacija

### 5.1 Minimal GUI (Windows native)

* **Left sidebar:** DevLauncher (logo), global shortcuts (Open Launcher in VS Code/Terminal/Folder), lista projekata, ➕ *New Project*
* **Right pane (Project Drawer):** kartice *Overview*, *Docker*, *MCP*, *Logs*, *Settings*

**Dashboard (Overview)**

* **Quick Links** (WordPress: Site/Admin/PMA/Mailpit; Next.js: App)
* **Quick Actions**: Open Terminal/Folder/Editor, **Install Claude CLI**, **Install Gemini CLI**, Start/Stop/Reallocate ports/Rebuild
  *(Install akcije imaju spinner u gumbu i toast obavijesti: Installing… → Installed vX | Failed; output ide u centralne logove.)*
* **Ports & URLs**: tablica portova + rezultat URL matrice (OK/Fail)

**New Project modal**

* *Project name* → slug preview
* *Type* (blank/nextjs/wordpress)
* *Location* (**WSL**/**Windows**)
* *Runtime* (*Next.js only*: node|docker; default docker)
* *Root path (per location)* (readonly iz Settings, uz mogućnost promjene u Settings)
* *Auto‑start after create* (checkbox)
* *Setup Claude CLI (+ MCP)* (checkbox + advanced)

**Settings**

* *Projects root (WSL):* npr. `/home/<user>/dev`
* *Projects root (Windows):* npr. `C:\Dev`
* *Default Location:* `wsl|windows` (zadano: `wsl`)
* *Editor mode:* `system|code|cursor|custom`
* *Terminal profile:* `Ubuntu|PowerShell|Command Prompt`
* *Ports base*
* *Networking:* URL matrica i timeout
* *Performance hints:* bannere za Windows bind mount

### 5.2 CLI (MVP, `devl`)

```bash
# create (uz izbor lokacije i runtimea)
devl create <slug> --type=blank|nextjs|wordpress \
  [--location=wsl|windows] [--runtime=node|docker] \
  [--auto-start] [--claude-cli] [--mcp]

# list / open / terminal / folder / urls
devl list
devl open <slug>
devl term <slug>
devl folder <slug>
devl urls <slug>

# start/stop
devl up <slug>
devl down <slug>

devl up:all <slug>
devl down:all <slug>

# delete
devl delete <slug> [--purge-volumes]

# MCP manager
devl mcp list <slug>
devl mcp install <slug> --server=<name>
devl mcp remove <slug> --server=<name>
devl mcp test <slug> --server=<name>
devl mcp profile save <slug> --name=<profile>
devl mcp profile apply <slug> --name=<profile>

# logs
devl logs tail <slug> [--service=<name>]
devl logs open <slug>

# settings
devl config get|set
```

---

## 6) Arhitektura i tehnologije

**Aplikacija (GUI):** Windows native **Electron + React + Tailwind** (MVP).
**CLI:** Node.js (TypeScript).
**Bridge prema WSL:** `wsl.exe -d <Distro> -- bash -lc "<cmd>"`
**Launch Windows procesa:** `wt.exe`, `explorer.exe`, `code` itd.

**Izvršavanje komandi (sažetak)**

* **WSL projekt:** sve dev komande izvršavati **u WSL‑u**; GUI poziva `wsl.exe`.
* **Windows projekt:** dev komande izvršavati **na Windows hostu**; Docker komande direktno (Docker Desktop).
* **VS Code (WSL projekt):** `wsl.exe ... && code .` (Remote‑WSL).
* **Terminal (WSL projekt):** `wt.exe` s Ubuntu profilom i `cwd = \\wsl$\...`.

**Path mapping**

* `pathWSL = /home/<user>/dev/<slug>`
* `pathWin = C:\\Dev\\<slug>`
* `pathUNC = \\wsl$\\<Distro>\\home\\<user>\\dev\\<slug>` (samo za WSL projekte)
* `.devlauncher.json` sprema sva tri (ovisno o lokaciji)

**URL Resolver**
Matrica: `localhost`, `127.0.0.1`, `host.docker.internal`, `WSL_IP`; health‑check per template. Rezultat se serijalizira i koristi u MCP‑u.

**Poznate granice**

* Bind mount performanse na Windows NTFS mogu biti sporije; prikazati banner i predložiti WSL lokaciju za Docker intenzivne projekte.
* Maks. duljina putanja na Windowsu (koristiti `\\?\` ako treba; izbjegavati preduboke strukture).

---

## 7) Template sustav

**Registry:** `~/.devlauncher/templates/` (svaki template u svom folderu).
**Manifest:** `manifest.yaml` s varijablama, hookovima i *per‑location* sekcijama.

**Per‑location render**

* `files.wsl` i `files.windows` (ako se razlikuju)
* `compose.wsl.yml` / `compose.windows.yml` (po potrebi)
* Hookovi: `preCreate`, `postCreate`, `preUp`, `postUp` (izvršavanje u *radnom okruženju projekta*)

**Hookovi i port verifier**

* `preUp` pokreće port scan i (ako treba) dinamički remap prije `compose up`
* Log svakog hooka u `.devlauncher/logs/*.log`

---

## 8) Detalji templateova

### 8.1 `blank`

**Svrha:** Standardni prazan projekt s meta datotekama.
**Struktura:**

```
/<slug>
  .devlauncher.json
  README.md
  .gitignore
```

### 8.2 `nextjs`

**Varijable:** `SLUG`, `HTTP_PORT` (default 3000), `RUNTIME` (node|docker)

**WSL lokacija (docker)**

* `docker-compose.yml` (bind mount `.:/app`), `Dockerfile`, `package.json`, `src/`

**Windows lokacija**

* *RUNTIME=node (preporučeno na Windows lokaciji):* nema Docker‑a; `npm run dev` na hostu
* *RUNTIME=docker:* isti compose, ali prikaži *Performance banner* (sporiji bind mount); alternativa: *named volumes* varijanta (bez hot‑reloada) — u backlogu *sync mode*

### 8.3 `wordpress`

**Varijable:** `SLUG`, `HTTP_PORT`, `DB_PORT`, `PMA_PORT`, `SMTP_PORT`, `MAILPIT_UI_PORT`, `WP_DB_*`
**WSL lokacija (preporučeno):** standardni Nginx + PHP‑FPM + MariaDB + Mailpit; `wp-content/` kao bind iz WSL FS‑a.
**Windows lokacija:** dvije varijante

* *bind mount:* jednostavnije, ali sporije — prikazati banner
* *named volumes:* brže I/O, ali bez direktnog file editinga iz hosta; (opcionalni *exec* helperi za sync — backlog)

---

## 9) Pravila imenovanja i validacije

* **Slug:** mala slova, brojke, crtice; 3–40 znakova; regex iz §4 (FR‑2)
* **Docker compose project name:** jednak *slugu*
* **Root pathovi:** definirani u Settings per lokaciji

---

## 10) Operacije nad projektima

* **Create** → validacija, jedinstvenost, dodjela portova, render, zapis `.devlauncher.json`, opcionalni `up`, opcionalni Claude/MCP
* **Open** → VS Code (WSL Remote za WSL projekte; lokalni za Windows projekte)
* **Up/Down** → re‑check portova; `compose up/down`
* **Delete (safe)** → *preview*, `compose down [-v]`, brisanje foldera, update registry
* **Logs** → tail u UI + otvaranje logs foldera

---

## 11) Claude Code CLI & MCP

**Cilj:** Per‑project setup Claude CLI + MCP.
**Instalacija**

* *System mode* (preporuka) ili *vendor mode (per‑project)*
* **Target okruženje:** WSL za WSL projekte; Windows za Windows projekte
  **MCP Manager:** Install/Remove/Configure/Test; `Save/Apply Profile`; stream logova; serijalizacija u `.claude/mcp.json` i referenca u `.devlauncher.json`
  **URL Resolver integracija:** HTTP MCP‑ovi koriste izabrani `base URL`

---

## 12) Konfiguracija Launchera

**Global (JSON)**

```json
{
  "projectsRootWSL": "/home/<user>/dev",
  "projectsRootWindows": "C:\\Dev",
  "defaultLocation": "wsl",
  "launcherProjectPath": "/home/<user>/devlauncher",
  "editorMode": "system",
  "defaultEditor": "code",
  "terminalProfile": "Ubuntu",
  "portsBase": {
    "nextjs": 3000,
    "wordpress": 8080,
    "phpmyadmin": 8180,
    "mailpit_ui": 8025,
    "smtp": 1025,
    "db": 3306
  },
  "networking": {
    "urlMatrixOrder": ["localhost", "127.0.0.1", "host.docker.internal", "wsl_ip"],
    "testTimeoutMs": 2000
  },
  "mcp": {
    "profiles": {
      "wordpress-default": ["docker-mcp-toolkit", "wordpress-remote"],
      "nextjs-default": ["docker-mcp-toolkit"]
    },
    "autoApplyProfile": false
  }
}
```

**Per‑project **\`\`** (primjer)**

```json
{
  "name": "{{PROJECT_NAME}}",
  "slug": "{{SLUG}}",
  "type": "wordpress",
  "location": "wsl",
  "createdAt": "2025-08-10T11:00:00Z",
  "ports": {"http": 8087, "db": 3314},
  "paths": {
    "wsl": "/home/<user>/dev/{{SLUG}}",
    "windows": "C:\\Dev\\{{SLUG}}",
    "unc": "\\\\wsl$\\Ubuntu\\home\\<user>\\dev\\{{SLUG}}"
  },
  "dockerProject": "{{SLUG}}",
  "claude": {
    "cli": "vendor",
    "configured": true,
    "mcpServers": ["docker-mcp-toolkit", "wordpress-remote"]
  },
  "urlResolver": {
    "base": "http://localhost:8087",
    "tested": [
      {"url": "http://localhost:8087", "ok": true},
      {"url": "http://127.0.0.1:8087", "ok": true},
      {"url": "http://host.docker.internal:8087", "ok": true},
      {"url": "http://172.24.96.1:8087", "ok": false}
    ]
  }
}
```

---

## 13) Sigurnost, performanse, logging

* **Sigurnost brisanja:** brisati **samo** unutar definiranih root pathova (per lokaciji)
* **WSL FS:** preporučeno za Docker intenzivne projekte; Windows NTFS uz banner upozorenje
* **Port verifier:** na `create` i svaki `up`
* **Logging:** per‑project log + globalni log (rotacija 5MB); *Logs tab* s filterima

---

## 14) Milestones i testiranje

**M1 — CLI MVP (2 tjedna)**

* `devl create/list/open/up/down/delete`
* Template engine + registry
* Next.js + WordPress + blank
* Auto + re‑check port allocator
* Safe delete
* Claude CLI installer (system + vendor)

**M2 — Windows native GUI (2 tjedna)**

* Electron dashboard + New Project modal
* Project Drawer (Ports & URLs)
* Settings ekran (uklj. *projectsRootWSL* i *projectsRootWindows*)
* Integracija s CLI modulima
* One‑click Shortcuts per location

**M3 — MCP Wizard (1 tjedan)**

* Per‑template MCP preporuke
* `.claude/config.json` generator ili `claude mcp add` wizard

**Testni scenariji (primjeri)**

* Slug validacija (pass/fail)
* Kreiranje duplikata (blokada)
* Next.js (WSL/docker): `up` → app na `http://localhost:<port>`
* Next.js (Windows/node): `npm run dev` na hostu, hot‑reload
* WordPress (WSL): `up` → web installer
* WordPress (Windows/docker): `up` → web installer; banner o performansama
* MCP add/list/test; URL Resolver prikaz i zapis
* Delete s/bez `--purge-volumes`

---

## 15) Rizici i mitigacije

* **Windows bind mount performanse** → preporuka WSL lokacije; *runtime=node* za Next.js na Windowsu; opcija *named volumes*
* **Path duljina i permisisons** → skraćeni root (`C:\Dev`), izbjegavati duboke strukture
* **Miješanje runtimea** (Windows Node vs Docker vs WSL) → jasne oznake u UI i `.devlauncher.json`
* **MCP serveri koji traže host URL‑ove** → URL Resolver i `host.docker.internal` most
* **Greške pri brisanju** → *dry‑run preview* i hard guard na root path

---

## 16) Otvorena pitanja

1. Default *Location* ostaje **WSL**?
2. Želimo li omogućiti *runtime=node* i za WSL (tj. Node u WSL‑u bez Docker‑a) kao opciju?
3. Dodati *sync mode* (Mutagen/Unison) kao opciju za Windows lokaciju (Next.js/WordPress)?
4. Treba li *Move Project* (Windows↔WSL) ući u M2 ili ostaje backlog?

---

## 17) Dodaci (glue code i komande)

### 17.1 Launch Windows procese (WSL projekt)

```ts
import { spawn } from "child_process";
const user = "<user>"; const slug = "<slug>";
// Terminal (Windows Terminal → Ubuntu profil u WSL diru)
spawn("wt.exe", ["-w","0","nt","-p","Ubuntu","-d", `\\wsl$\Ubuntu\home\${user}\dev\${slug}`]);
// Explorer na WSL UNC path
spawn("explorer.exe", [`\\wsl$\Ubuntu\home\${user}\dev\${slug}`]);
// VS Code Remote‑WSL
spawn("wsl.exe", ["-d","Ubuntu","--","bash","-lc", `cd /home/${user}/dev/${slug} && code .`]);
```

### 17.2 Launch Windows procese (Windows projekt)

```ts
import { spawn } from "child_process";
const winPath = `C:\Dev\<slug>`;
spawn("wt.exe", ["-w","0","nt","-d", winPath]);   // Terminal
spawn("explorer.exe", [winPath]);                        // Explorer
spawn("code", [winPath]);                                // VS Code
```

### 17.3 Docker komande

```bash
# WSL projekt
wsl -d Ubuntu -- bash -lc "cd /home/<user>/dev/<slug> && docker compose up -d"

# Windows projekt (Docker Desktop)
pushd C:/Dev/<slug> && docker compose up -d && popd
```

### 17.4 URL Resolver (pseudo)

```ts
const candidates = [
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
  `http://host.docker.internal:${port}`,
  `http://${wslIp}:${port}`
];
// HEAD/GET health-check po templatu; prvu uspješnu zapiši u .devlauncher.json
```

### 17.5 `manifest.yaml` (per‑location snippet)

```yaml
template: nextjs
variables: [SLUG, HTTP_PORT, RUNTIME]
files:
  wsl:
    - Dockerfile
    - docker-compose.yml
    - package.json
    - src/**
  windows:
    - package.json
    - src/**
hooks:
  preUp: ["node scripts/verify-ports.js"]
```

### 17.6 Dev Launcher container (docker‑compose)

```yaml
services:
  devlauncher:
    image: node:20
    container_name: devlauncher
    working_dir: /app
    volumes:
      - C:/Users/jfran/Documents/devlauncher:/app
      - /var/run/docker.sock:/var/run/docker.sock
      - devl_logs:/app/.devlauncher/logs
    environment:
      - NODE_ENV=development
      - DEVL_PORT=9976
    ports:
      - "9976:9976"
    command: ["bash","-lc","npm install && npm run dev"]
volumes:
  devl_logs:
```

### 17.9 Gemini CLI install (spawn snippets)

```ts
import { spawn } from "child_process";

export function installGeminiWSL(slug: string) {
  const cmd = `cd /home/jfranjic/dev-projects/${slug} && npm install -g @google/gemini-cli && (gemini --version || gemini --help)`;
  return spawn("wsl.exe", ["-d","Ubuntu","--","bash","-lc", cmd], { stdio: "inherit" });
}

export function installGeminiWin(slug: string) {
  const winPath = `C:/Users/jfran/Documents/dev-projects/${slug}`;
  const ps = `Set-Location '${winPath}'; npm install -g @google/gemini-cli; if (Get-Command gemini -ErrorAction SilentlyContinue) { gemini --version } else { gemini --help }`;
  return spawn("pwsh", ["-NoProfile","-Command", ps], { stdio: "inherit" });
}
```

## 18) Check (kratke provjere prije M2)

*
