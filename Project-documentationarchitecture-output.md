---

name: system-architect
description: Technical architecture blueprint for Dev Launcher (Windows‑native UI, all‑in Docker, WSL/Windows projects). Defines components, stack, APIs, data models, security, and DevOps.
last-updated: 2025-08-10
version: 0.1.0
status: draft
-------------

# Dev Launcher — System Architecture Blueprint (Phase 2)

## Executive Summary

**Pregled**: Dev Launcher je Windows‑native desktop alat (Electron + React) koji upravlja kreiranjem i životnim ciklusom izoliranih **Docker** projekata na dvije lokacije: **Windows** (`C:\Users\jfran\Documents\dev-projects`) i **WSL** (`/home/jfranjic/dev-projects`). Svi projekti, kao i **sam Dev Launcher backend**, rade u vlastitim containerima (all‑in Docker). AI integracije (Claude/Gemini CLI, MCP) i Playwright smoke testovi su integrirani kroz orkestraciju i pristup logovima.

**Ključne odluke**

* **Frontend**: Electron (Win32) + React + Vite + Tailwind/shadcn/ui; Zustand za state, React Router.
* **Backend**: Node.js (TypeScript) servis unutar **devlauncher** containera, izložen lokalno na `http://localhost:9976` (loopback only).
* **Docker**: Per‑project `docker compose` (project name = slug), izolirane mreže/volumeni; **Docker socket** montiran u devlauncher container za kontrolu/inspekciju.
* **Persistencija**: SQLite (Prisma) u volumenu `devl_db`, plus flat JSON za per‑project `.devlauncher.json`.
* **Sigurnost**: API ograničen na `127.0.0.1`; strict CORS/origin; CSRF token za UI pozive; rola „local‑admin“.
* **Logs & Observability**: Pino/NDJSON logovi; per‑project logs dir `./.devlauncher/logs/`; WebSocket log tail.

**Ograničenja & pretpostavke**

* OS: Windows 11 + WSL2 + Docker Desktop.
* Terminal: **PowerShell 7** (Windows Terminal profil).
* Putanje projekata su fiksne (mogu se mijenjati u Settings unutar appa).

---

## For Backend Engineers

### API Contract Specifications

**Base URL**: `http://127.0.0.1:9976/api/v1` (privatno, lokalno)

#### Auth & Headers

* `Authorization: Bearer <local-token>` (generira se na prvom startu; čuva u app configu)
* `X-CSRF-Token: <nonce>` (sticky per session iz renderer UI‑ja)
* `Content-Type: application/json`

#### Endpoints

1. **Health**

   * `GET /health` → `200 {"status":"ok","version":"x.y.z"}`

2. **Projects**

   * `GET /projects` → lista projekata (paginacija)
   * `POST /projects` → kreira projekt
     **Request**

     ```json
     {
       "name": "My Site",
       "slug": "my-site",
       "type": "blank|nextjs|wordpress",
       "location": "windows|wsl"
     }
     ```

     **Response 201**

     ```json
     {"id":"uuid","slug":"my-site","paths":{"wsl":"/home/jfranjic/dev-projects/my-site","windows":"C:\\Users\\jfran\\Documents\\dev-projects\\my-site","unc":"\\\\wsl$\\Ubuntu\\home\\jfranjic\\dev-projects\\my-site"},"ports":{"http":8087},"dockerProject":"my-site","status":"stopped"}
     ```
   * `GET /projects/{slug}` → detalji
   * `DELETE /projects/{slug}?purgeVolumes=true|false` → safe delete

3. **Lifecycle**

   * `POST /projects/{slug}/up` → `202 {"status":"starting"}`
   * `POST /projects/{slug}/down` → `202 {"status":"stopping"}`
   * `POST /projects/{slug}/rebuild`
   * `POST /projects/{slug}/reallocate-ports`

4. **Shortcuts**

   * `POST /projects/{slug}/open/terminal`
   * `POST /projects/{slug}/open/folder`
   * `POST /projects/{slug}/open/editor`

5. **Port Allocator**

   * `POST /ports/allocate` → `{ template:"wordpress", slug:"my-site" }` ⇒ `{ "http": 8087, "db": 3314, ... }`

6. **URL Resolver**

   * `POST /projects/{slug}/resolve-urls` → vraća matrice i odabrani `baseUrl`

7. **CLI Tools (install)**

   * `POST /projects/{slug}/install/claude`
   * `POST /projects/{slug}/install/gemini`
     **Response**: stream log (Server‑Sent Events) + završni JSON `{ status:"ok", version:"X.Y.Z" }`

8. **Logs**

   * `GET /projects/{slug}/logs?service=<name>&follow=true|false` (SSE)
   * `WS /ws/logs?slug=<slug>&service=<name>` (alternativno)

9. **Tests**

   * `POST /projects/{slug}/tests/smoke` → pokreće Playwright; `202` + taskId
   * `GET /tests/{taskId}` → status + link na report

**Error format**

```json
{"error":"BadRequest","message":"slug already exists","code":400,"details":{"field":"slug"}}
```

### Business Logic Patterns

* **Command handlers**: `CreateProjectCommand`, `UpProjectCommand`, …
* **Services**: `DockerService`, `PortService`, `UrlResolver`, `ShortcutService`, `CliInstallService`, `TestRunnerService`
* **Adapters**: `WindowsShellAdapter` (wt, explorer, code), `WslAdapter`, `DockerAdapter`
* **Events**: `project.created`, `project.up.started`, `project.up.ready`, `cli.install.finished`, `tests.smoke.finished`

### Validation & Error Handling

* Zod sheme za requeste; sve greške kroz jedinstveni `HttpErrorMapper`.
* Idempotencija: `POST /projects` odbija duplicirane slugove.
* Guard na root path (white‑list) pri brisanju.

---

## For Frontend Engineers

### Client Architecture

* **Electron** main (IPC izoliran), **renderer** React (Vite).
* **State**: Zustand store (`projects`, `settings`, `tasks`, `toasts`).
* **Routing**: React Router (sidebar list → `/projects/:slug`).
* **UI kit**: Tailwind + shadcn/ui; Framer Motion za suptilne tranzicije.
* **Top bar**: fiksan; desno gumbi: `Claude | Continue | Bypass | Bypass+Continue | MCP List | Terminal`.

### API Integration

* `fetchJSON` helper s `Authorization` + `X‑CSRF‑Token` + retry (exp. backoff).
* SSE/WebSocket hookovi za logs i install/test streamove.
* Toast pattern: success/info/warn/error; spinner u gumbima (Install CLI, Create, Up/Down).

### Performance

* Lazy load tabova (Docker/MCP/Logs).
* Virt. lista u sidebaru (≥1000 projekata).
* Debounce na filteru.
* Skeleton za Overview.

---

## For QA Engineers

### Testable Boundaries

* API sloj (unit + contract tests na Zod shemama).
* Port allocator (kolizije, re‑map).
* URL resolver (matrix probe, timeout, fallback).
* CLI install (Claude/Gemini): spinner → toast + `--version` health‑check.
* Docker lifecycle: `up/down/rebuild`.
* Safe delete: dry‑run + guard.

### Quality Metrics

* TTFP ≤ 90 s (Next.js/WordPress).
* 1‑click actions ≥ 99% uspjeha.
* Port collision rate ≤ 0.5%.

### Tooling

* Playwright e2e za UI; Vitest/Jest za unit; k6 za lokalne performance probe (opc.).

---

## For Security Analysts

### Threat Model (lokalna app na Win11)

* **Docker socket** pristup → ograničiti API na loopback, potpisivati UI zahtjeve CSRF‑om.
* **Command execution** (wt, wsl, code) → allow‑list akcija i validacija putanja.
* **Local token** → generirati pri prvom startu; čuvati u `~/.devlauncher/config.json` (Windows korisnički profil); rotacija moguće u Settings.
* **CORS**: zabranjen osim za `app://devlauncher` origin (Electron).
* **Headers**: `X‑Content‑Type‑Options: nosniff`, `X‑Frame‑Options: DENY`, `Referrer‑Policy: no-referrer`.

### Data in Transit/At Rest

* Lokalna komunikacija (loopback); nema TLS.
* SQLite file u volumenu; backup kopije on‑demand.

---

## System Architecture and Infrastructure

### Component Breakdown

* **Desktop UI (Electron/React)**: Renderer + top bar, sidebar, content tabs.
* **DevLauncher API (Node/TS)**: REST + SSE/WS; orkestrira Docker, portove, URL check, spawn komande.
* **Docker Engine**: izvršava compose za projekte; devlauncher container ima socket pristup.
* **SQLite DB**: registry projekata, port alokacije, taskovi, audit log.
* **File Storage**: per‑project `.devlauncher.json`, logs u `./.devlauncher/logs/`.

### Deployment (local)

`docker compose` manifest:

```yaml
services:
  devlauncher:
    image: node:20
    container_name: devlauncher
    working_dir: /app
    volumes:
      - C:/Users/jfran/Documents/dev-launcher:/app
      - /var/run/docker.sock:/var/run/docker.sock
      - devl_db:/app/.data
      - devl_logs:/app/.devlauncher/logs
    environment:
      - NODE_ENV=development
      - DEVL_PORT=9976
    ports:
      - "9976:9976"
    command: ["bash","-lc","npm install && npm run dev"]
volumes:
  devl_db:
  devl_logs:
```

### Environments

* **dev**: lokalno, hot‑reload, verbose logs.
* **prod (local build)**: minified renderer, `npm run build`, servis pokrenut s `node dist/index.js`.

### CI/CD (preporuka)

* GitHub Actions: build/test lint; build Docker image; push u GHCR; verzioniranje SemVer; release notes.

---

## Data Architecture Specifications

### Entities

1. **Project**

   * `id: uuid`
   * `name: string`
   * `slug: string (unique)`
   * `type: enum('blank','nextjs','wordpress')`
   * `location: enum('windows','wsl')`
   * `paths: json` (wsl/windows/unc)
   * `ports: json`
   * `dockerProject: string`
   * `status: enum('stopped','running','error')`
   * `claudeCli: { installed:boolean, version?:string }`
   * `geminiCli: { installed:boolean, version?:string }`
   * `createdAt: datetime`
   * `updatedAt: datetime`

2. **PortReservation**

   * `id: uuid`
   * `slug: string`
   * `template: string`
   * `portName: string`
   * `portNumber: int`
   * Unique index `(portNumber)` + index `(slug)`

3. **Task** (install/test)

   * `id: uuid`
   * `projectSlug: string`
   * `type: enum('install-claude','install-gemini','smoke-test')`
   * `status: enum('queued','running','success','failed')`
   * `logPath: string`
   * `result: json`
   * `createdAt/updatedAt`

4. **AuditLog**

   * `id, ts, actor, action, params, result`

### Schema Notes

* SQLite s Prisma migracijama; foreign keys (`Task.projectSlug → Project.slug`).
* Indeksi: `Project.slug (unique)`, `Task.projectSlug`, `PortReservation.portNumber (unique)`.

---

## Integration Architecture

### Shell Adapters

* **WindowsShellAdapter**: `wt.exe`, `explorer.exe`, `code`; PS7 profil.
* **WslAdapter**: `wsl.exe -d Ubuntu -- bash -lc "…"` (cwd mappiran na `/home/jfranjic/dev-projects/<slug>`).
* **DockerAdapter**: Dockerode ili CLI (`docker compose …`) s kontrolom project‑name.

### External Tools

* **Claude CLI**: `npm install -g @anthropic-ai/claude-code`; health: `claude --version`.
* **Gemini CLI**: `npm install -g @google/gemini-cli`; health: `gemini --version|--help`.
* **Playwright**: `npx playwright test` u namjenskom kontekstu (unutar devlauncher containera ili per‑project test containeru).

### Communication Patterns

* UI ⇄ API: HTTP/JSON + SSE; Electron IPC samo za lokalne osjetljive akcije (npr. otvaranje lokalnih prozora).
* API ⇄ Docker: socket + CLI fallback.
* API ⇄ Shell: child\_process spawn s sanitiziranim inputom.

---

## Security and Performance Foundation

### Security

* Loopback‑only bind (`127.0.0.1:9976`).
* CSRF token za UI POST/DELETE.
* Strict CORS/Origin za `app://devlauncher`.
* Input sanitization (slug regex, path allow‑list).
* Least‑privilege na Docker akcijama (samo potrebne komande).
* Audit log svih destruktivnih akcija.

### Performance

* Port scan: prvo Docker published ports, zatim OS bind probe.
* URL resolver: paralelni HEAD/GET s 2s timeoutom.
* Log stream: backpressure i truncation >1MB/s.
* DB: pragmatični indeksi; vacuum tjedno.

---

## Risk Assessment

* **Docker socket exposure**: strogo lokalno; ne izlagati mreži; audit.
* **Bind mount performanse na Windowsu**: preporuka WSL lokacije za intenzivne projekte; upozorenja u UI‑ju.
* **Terminal profil PS7**: fallback ako profil ne postoji.
* **Path dužina**: koristiti kratke rootove i izbjegavati duboku hijerarhiju.
* **CLI instalacije**: različita ponašanja na WSL vs Windows; fallback kroz „tooling“ container ako detektiramo problem.

---

## Output Structure & Handoff

* Ovaj dokument služi Backend/Frontend/QA/Security timovima.
* API i schema su spremni za implementaciju.
* Datoteka: `project-documentation/architecture-output.md` (ovaj dokument).
