---

name: senior-backend-engineer
description: Production‑ready backend implementation plan for Dev Launcher per architecture-output.md. Includes DB migrations, API contracts, services, validation, security, and monitoring.
last-updated: 2025-08-10
version: 0.1.0
status: draft
related-files:

* ./architecture-output.md
* ./product-manager-output.md

---

# Dev Launcher — Backend Implementation (Phase 3: Senior Backend Engineer)

> **Scope**: Implementirati Node.js/TypeScript backend (unutar `devlauncher` Docker containera) točno prema `architecture-output.md`: REST + SSE/WS API, SQLite/Prisma, Docker socket, Port Allocator, URL Resolver, Logs, CLI Install (Claude/Gemini) orkestracija, Playwright smoke tests. Bez novih arhitekturnih odluka.

---

## 0) Preduvjeti & okruženje

* **Node 20**, **TypeScript**, **Prisma** (SQLite), **Zod** za validaciju, **Pino** za logove.
* Servis izložen na `http://127.0.0.1:9976` (*loopback only*), radi unutar containera `devlauncher`, s montiranim:
  `/var/run/docker.sock`, volumenom za DB (`devl_db`) i logove (`devl_logs`).
* **Auth token** (random 32B hex) generira se pri prvom startu, čuva u `~/.devlauncher/config.json` (mapirano iz hosta u `/app/.config`).
* **CSRF**: `X-CSRF-Token` nonce per session, dohvaća se iz `/api/v1/auth/csrf`.

**Struktura repozitorija (server)**

```
/server
  /src
    /api
      projects.controller.ts
      lifecycle.controller.ts
      ports.controller.ts
      urls.controller.ts
      logs.controller.ts
      tools.controller.ts    # install Claude/Gemini, tests
      auth.controller.ts
    /services
      docker.service.ts
      port.service.ts
      url-resolver.service.ts
      shortcuts.service.ts
      tools-install.service.ts
      tests.service.ts
      security.service.ts
    /adapters
      docker.adapter.ts
      windows-shell.adapter.ts
      wsl.adapter.ts
      shell-bridge.contract.ts
    /db
      prisma.ts
      repositories.ts
    /domain
      events.ts
      types.ts
      validation.ts
    index.ts
  /prisma
    schema.prisma
  package.json
```

---

## 1) Baza podataka — modeli & migracije

### 1.1 Prisma schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./devlauncher.db"
}

enum ProjectType { blank nextjs wordpress }

enum ProjectLocation { windows wsl }

enum ProjectStatus { stopped running error }

enum TaskType { install_claude install_gemini smoke_test }

enum TaskStatus { queued running success failed }

model Project {
  id           String          @id @default(uuid())
  name         String
  slug         String          @unique
  type         ProjectType
  location     ProjectLocation
  paths        Json            // { wsl, windows, unc }
  ports        Json            // { http, db, ... }
  dockerProject String
  status       ProjectStatus   @default(stopped)
  claudeCli    Json            // { installed: bool, version?: string }
  geminiCli    Json            // { installed: bool, version?: string }
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  tasks        Task[]
}

model PortReservation {
  id         String  @id @default(uuid())
  slug       String
  template   String
  portName   String
  portNumber Int     @unique
  createdAt  DateTime @default(now())
  @@index([slug])
}

model Task {
  id          String     @id @default(uuid())
  projectSlug String
  type        TaskType
  status      TaskStatus @default(queued)
  logPath     String
  result      Json?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  project     Project    @relation(fields: [projectSlug], references: [slug], onDelete: Cascade)
  @@index([projectSlug])
}

model AuditLog {
  id       String   @id @default(uuid())
  ts       DateTime @default(now())
  actor    String
  action   String
  params   Json?
  result   Json?
}
```

### 1.2 Migracije (dev)

```
npx prisma migrate dev --name init
```

* **Rollback** (dev): `prisma migrate reset` (potvrda).
* Svaka iduća promjena: nova migracija s opisnim imenom, u komentar dodati *zašto* i *utjecaj*.

### 1.3 Indeksi & performanse

* `Project.slug` **unique**.
* `PortReservation.portNumber` **unique**, `slug` **index**.
* `Task.projectSlug` **index**.
* Tjedni `VACUUM` (cron/Task u servisu).

---

## 2) API — ugovori i validacija

**Base**: `http://127.0.0.1:9976/api/v1`
**Headers**: `Authorization: Bearer <token>`, `X-CSRF-Token: <nonce>`, `Content-Type: application/json`

### 2.1 Zajednički error format

```json
{"error":"BadRequest","message":"slug already exists","code":400,"details":{"field":"slug"}}
```

### 2.2 Zod sheme (primjer)

```ts
// domain/validation.ts
import { z } from 'zod';

export const CreateProjectDto = z.object({
  name: z.string().min(2).max(64),
  slug: z.string().regex(/^[a-z][a-z0-9-]{1,38}[a-z0-9]$/),
  type: z.enum(['blank','nextjs','wordpress']),
  location: z.enum(['windows','wsl'])
});
export type CreateProjectDto = z.infer<typeof CreateProjectDto>;
```

### 2.3 Endpoints

**Health**
`GET /health` → `200 { status:"ok", version:"x.y.z" }`

**Auth**
`GET /auth/csrf` → `{ token:"<nonce>" }`

**Projects**

* `GET /projects?query=&page=&size=` → `{ items:[Project], page, size, total }`
* `POST /projects` (CreateProjectDto) → `201 Project`
* `GET /projects/{slug}` → `200 Project`
* `DELETE /projects/{slug}?purgeVolumes=true|false` → `202 { status:"deleted|queued" }`

**Lifecycle**

* `POST /projects/{slug}/up` → `202 { status:"starting" }`
* `POST /projects/{slug}/down` → `202 { status:"stopping" }`
* `POST /projects/{slug}/rebuild` → `202 { status:"rebuilding" }`
* `POST /projects/{slug}/reallocate-ports` → `200 { ports:{...} }`

**Ports**

* `POST /ports/allocate` `{ template, slug }` → `200 { http: 8087, ... }`

**URL Resolver**

* `POST /projects/{slug}/resolve-urls` → `200 { matrix:[{url, ok, ms}], baseUrl }`

**Logs**

* `GET /projects/{slug}/logs?service=&follow=true` (SSE)  → event: `data: <line>`

**Tools (CLI install)**

* `POST /projects/{slug}/install/claude` → SSE + završni `{ status, version }`
* `POST /projects/{slug}/install/gemini` → SSE + završni `{ status, version }`

**Tests**

* `POST /projects/{slug}/tests/smoke` → `202 { taskId }`
* `GET /tests/{taskId}` → `{ status, reportPath? }`

---

## 3) Servisi & adapteri

### 3.1 DockerService

* Operacije: `composeUp`, `composeDown`, `isRunning`, `listPublishedPorts(slug)`.
* Adapter: Dockerode preko socket‑a; fallback na `docker compose` CLI.

### 3.2 PortService

* Algoritam: (1) **Docker published ports scan** → (2) **OS bind probe** → (3) **Registry check**.
* Raspodjela per template (baze: Next.js=3000, WP=8080, DB=3306...). Čuva u `PortReservation` + upis u `.devlauncher.json`.

### 3.3 UrlResolverService

* Kandidati: `localhost`, `127.0.0.1`, `host.docker.internal`, `WSL_IP`.
* Paralelni HEAD/GET s timeoutom 2 s; prvi **OK** postaje `baseUrl`.

### 3.4 ShortcutsService

* Triggera OS procese (Terminal/Explorer/Editor) kroz **ShellBridge** (vidi 3.7) s whitelist putanjama i parametrima.

### 3.5 ToolsInstallService

* Kreira **Task** (`install_claude`/`install_gemini`), otvara log file, zove **ShellBridge** s naredbom:

  * **WSL**: `wsl.exe -d Ubuntu -- bash -lc "cd /home/jfranjic/dev-projects/<slug> && npm install -g <pkg> && <bin> --version || <bin> --help"`
  * **Windows**: `pwsh -NoProfile -Command "Set-Location 'C:\\Users\\jfran\\Documents\\dev-projects\\<slug>'; npm install -g <pkg>; <bin> --version"`
* SSE prema klijentu (stream stdout/stderr), zapis u `./.devlauncher/logs/*.log`, ažurira `Project.claudeCli/geminiCli`.

### 3.6 TestsService

* Endpoint `/tests/smoke`: pokreće `npx playwright test` unutar **devlauncher** containera ili namjenskog test containera; generira report path; emituje event `tests.smoke.finished`.

### 3.7 ShellBridge (kontrakt)

* Budući da backend radi unutar containera, **OS komande** izvršava **Electron Main** (host) putem lokalnog mosta.
* **IPC ugovor (HTTP loopback ili Electron IPC)**:

  * `POST http://127.0.0.1:9978/shell/run`
    **Body** `{ id, kind:"windows|wsl", cwd, command, args[], env? }`
    **SSE** `/shell/stream?id=<id>` za logove
  * Whitelist naredbi i putanja; audit log svih poziva.
* Backend **ne uvodi** nove servise; samo definira kontrakt koji Electron main implementira.

---

## 4) Sigurnost & zaštita

* **Auth token**: 32B random, čuva se lokalno; zahtjevi bez tokena → `401`.
* **CSRF**: `GET /auth/csrf` vraća nonce; svi mutacijski pozivi moraju imati `X-CSRF-Token` (provjera i rotacija po sesiji).
* **CORS**: samo `app://devlauncher` (Electron).
* **Input sanitization**: slug regex; path allow‑list; numeric range za portove.
* **Audit**: `AuditLog` unosi za `create/delete`, `up/down/rebuild`, `install`, `tests`.
* **Headers**: `X-Content-Type-Options:nosniff`, `X-Frame-Options:DENY`, `Referrer-Policy:no-referrer`.

---

## 5) Monitoring, logovi & health

* **Pino** NDJSON; log rotacija dnevno; per‑project file u `./.devlauncher/logs/` (montiran volumen).
* **/health**: uključuje `db:ok`, `docker:ok` checkove.
* **SSE** kanali: logs stream, install stream, test stream; backpressure zaštita i throttling.

---

## 6) Implementacijski koraci (redoslijed)

1. **DB & migracije**: `schema.prisma` + `migrate dev --name init`.
2. **Security boilerplate**: token generacija + CSRF servis.
3. **Projects CRUD** (GET/POST/GET/DELETE) s validacijom + `.devlauncher.json` writer.
4. **DockerService** (`composeUp/Down`, status).
5. **PortService** + endpoint `reallocate-ports`.
6. **UrlResolverService** + endpoint `resolve-urls`.
7. **Logs SSE** (container logs + file tail).
8. **ShellBridge kontrakt** + ToolsInstallService (Claude/Gemini).
9. **TestsService** (Playwright) + `/tests` API.
10. **Hardening**: rate limit, audit, error mapper.
11. **E2E smoke**: Create → Up → Resolve URLs → Install Claude → Smoke tests.

---

## 7) Test plan (QA suradnja)

* **Contract tests**: Zod sheme ↔︎ API odgovori.
* **Lifecycle**: up/down/rebuild (idempotencija, greške).
* **PortAllocator**: kolizija simulacije; remap detekcija.
* **URL Resolver**: success/fail matrice; timeout handling.
* **CLI Install**: happy path + greške (npm offline, bin not found).
* **Security**: 401/403 bez tokena/CSRF; CORS deny.
* **Performance**: TTFP < 90 s (Next.js/WP) mjeriti; logs stream stabilnost ≥ 1 MB/s burst.

---

## 8) Primjeri koda (odabrani)

### 8.1 Token generacija (prvi start)

```ts
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
const CONFIG = '/app/.config/devlauncher/config.json';
export async function ensureAuthToken() {
  try {
    const raw = await fs.readFile(CONFIG, 'utf8');
    const cfg = JSON.parse(raw); if (cfg.token) return cfg.token;
  } catch {}
  const token = randomBytes(32).toString('hex');
  await fs.mkdir('/app/.config/devlauncher', { recursive: true });
  await fs.writeFile(CONFIG, JSON.stringify({ token }, null, 2));
  return token;
}
```

### 8.2 SSE helper

```ts
export function sse(res: any) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  return (data: string) => res.write(`data: ${data}\n\n`);
}
```

### 8.3 Port probe (OS)

```ts
import net from 'net';
export async function isPortFree(port: number): Promise<boolean> {
  return await new Promise((resolve) => {
    const srv = net.createServer().once('error', () => resolve(false))
      .once('listening', () => srv.close(() => resolve(true)))
      .listen(port, '127.0.0.1');
  });
}
```

### 8.4 URL resolver (paralelno)

```ts
async function head(url: string, ms = 2000) { /* fetch HEAD/GET s timeoutom */ }
export async function resolveMatrix(base: string[]) {
  const started = Date.now();
  const checks = await Promise.all(base.map(async (u) => {
    const t0 = Date.now();
    const ok = await head(u).then(() => true).catch(() => false);
    return { url: u, ok, ms: Date.now() - t0 };
  }));
  const chosen = checks.find(c => c.ok)?.url;
  return { matrix: checks, baseUrl: chosen };
}
```

---

## 9) Handoff napomene

* Ovaj dokument je implementacijska mapa za backend; u suglasju je s `architecture-output.md`.
* Nakon završetka, QA koristi **Test plan** iz pogl. 7; Security analizira Threat model iz arhitekture.
* Frontend tim dobiva jasne rute, SSE streamove i sheme.
