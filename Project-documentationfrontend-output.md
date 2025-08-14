---

name: senior-frontend-engineer
description: Frontend implementacijski priručnik za Dev Launcher — pretvaranje specifikacija (PM/UX/Arhitekt/Backend) u produkcijski spreman Windows‑native UI (Electron + React + Tailwind + shadcn/ui) s pristupom lokalnom API‑ju i SSE streamovima.
last-updated: 2025-08-10
version: 0.1.0
status: draft
related-files:

* ./product-manager-output.md
* ../design-documentation/README.md
* ./architecture-output.md
* ./backend-output.md

---

# Dev Launcher — Frontend Implementation (Phase 4: Senior Frontend Engineer)

## 0) Cilj i kontekst

Frontend implementira **Windows‑native** UI (Electron renderer) s **čistom, minimalističkom** estetikom i **determinističkim** ponašanjem. Sve funkcije su usklađene s:

* **UX/Design**: style guide, tokens, layout (Top bar + Sidebar + Content tabs)
* **Arhitekturom**: HTTP API `127.0.0.1:9976/api/v1`, SSE/WS streamovi, sigurnosni zahtjevi (Bearer + CSRF)
* **Backendom**: točni endpointi i sheme iz `architecture-output.md`

> Napomena: Svi projekti i Launcher backend rade u Dockeru; UI se veže isključivo na lokalni API i ne otvara nikakve udaljene portove.

---

## 1) Tehnološki okvir

* **Framework**: React 18 + Vite
* **UI**: Tailwind CSS + shadcn/ui (komponente), Framer Motion (suptilne tranzicije)
* **State**: Zustand (feature‑slices), React Query (za fetch + cache) *ili* vlastiti thin wrapper (vidi 3.2). Odabiremo **Zustand + thin fetch wrapper** radi potpunog poklapanja s API‑jem i SSE‑om.
* **Routanje**: React Router (`/projects/:slug`, `/settings`)
* **Tipovi**: TypeScript end‑to‑end (DTO tipovi izvedeni iz Zod shema kada je moguće)
* **Testovi**: Vitest + React Testing Library; Playwright za e2e

---

## 2) Struktura direktorija (renderer)

```
/renderer
  /app
    main.tsx
    routes.tsx
  /components
    TopBar.tsx
    Sidebar.tsx
    Toasts.tsx
    Buttons.tsx
    Tables.tsx
    Loaders.tsx
  /features
    /projects
      ProjectOverview.tsx
      DockerTab.tsx
      McpTab.tsx
      LogsTab.tsx
      SettingsTab.tsx
      NewProjectModal.tsx
    /topbar
      TopBarActions.tsx
  /store
    projects.slice.ts
    settings.slice.ts
    tasks.slice.ts
    ui.slice.ts
    index.ts
  /lib
    api.ts          # fetch JSON + CSRF + token
    sse.ts          # SSE helper (install/logs/tests)
    format.ts
    a11y.ts
  /styles
    index.css       # Tailwind base + tokens → CSS var
  /types
    dto.ts          # tipovi odgovora/zahtjeva
```

---

## 3) Integracija s API‑jem i sigurnost

### 3.1 Autentikacija i CSRF

* UI čita **Bearer token** iz lokalne konfiguracije (preload API iz Electron Maina) i pohranjuje ga u memoriji.
* Na mountu aplikacije: `GET /auth/csrf` → `X‑CSRF‑Token` se sprema u memoriju i dodaje na sve mutacijske zahtjeve.

### 3.2 `api.ts` (thin wrapper)

* Automatski dodaje `Authorization: Bearer <token>` i `X‑CSRF‑Token`.
* Standardizira error mapiranje na format iz backend specifikacije.
* Retries s eksponencijalnim backoffom za privremene greške (do 2 pokušaja).

### 3.3 `sse.ts` (streamovi)

* Otvara SSE za `/projects/:slug/logs`, `/install/*`, `/tests/*`.
* Razrađuje reconnect s jitterom i backpressure zaštitu.

---

## 4) State management (Zustand)

### 4.1 Slices

* **projects.slice**: lista, detalji, status containera, ports/urls, posljednji test; akcije: `fetchList`, `fetchOne`, `create`, `up`, `down`, `rebuild`, `reallocatePorts`, `resolveUrls`.
* **settings.slice**: root putanje (Windows/WSL), default location, terminal profil (PS7), auth token & CSRF nonce (read‑only u UI‑ju).
* **tasks.slice**: install/test taskovi (SSE status, log path, rezultat).
* **ui.slice**: modali, toasti, loaderi; globalne greške.

### 4.2 Principi

* Sve mutacije idu kroz `api.ts`; UI optimistički ažurira samo statuse koji su jasno reverzibilni (npr. *Installing…*), ostalo nakon potvrde s backend‑a.

---

## 5) Komponente & ekrani

### 5.1 Layout

* **TopBar**: lijevo „Dev Launcher by DataDox“; desno gumbi: `Claude | Continue | Bypass | Bypass+Continue | MCP List | Terminal`
* **Sidebar**: New Project, Filter, lista projekata (virtualizirana za ≥1000). Aktivni projekt highlight.
* **Content**: tabovi **Overview / Docker / MCP / Logs / Settings**.

### 5.2 Overview (ProjectOverview\.tsx)

* **Quick Actions**: Terminal, Folder, Editor, **Install Claude CLI**, **Install Gemini CLI**, Start/Stop, Reallocate Ports, Rebuild
* **Ports & URLs**: tablica s rezultatima matrice; badge boje (success/warn/error)
* **Status**: Docker status + zadnji Playwright rezultat (timestamp)
* **Stanja**: Default/Loading/Error/Empty (prvi start)

### 5.3 NewProjectModal

* Koraci: Name → Location → Template → Create
* Validacija sluga; disabled CTA dok je invalid
* Po „Create“: spinner u gumbu → toast „Created“ → automatski `up` (ako je checkbox označen)

### 5.4 DockerTab / McpTab / LogsTab / SettingsTab

* **DockerTab**: lista servisa, kratke akcije (Restart/Logs).
* **McpTab**: pregled i uređivanje MCP profila (read/write preko backend‑a kada bude dodano).
* **LogsTab**: live tail (SSE), pauza/clear, „Open logs folder“.
* **SettingsTab**: prikaz root putanja (read‑only uz gumb „Open Settings file“), terminal profil PS7.

### 5.5 TopBarActions

* * **Claude** → izvršava `claude`
  * **Continue** → `claude -c`
  * **Bypass** → `claude --dangerously-skip-permissions`
  * **Bypass+Continue** → `claude --dangerously-skip-permissions -c`
  * **MCP List** → `claude mcp list`
  * **Terminal** → `wt.exe -p "PowerShell 7"`
* **Integracija**: preko **Electron preload** mosta `window.shell.run(payload)` (IPC do Main), bez prolaska kroz backend — globalne akcije ne ovise o projektu.

---

## 6) UX/Design implementacija

* **Tokens → CSS var**: mapirati `design-tokens.json` u `:root` varijable, Tailwind koristi `theme.extend.colors` vezan na varijable.
* **Komponentna biblioteka**: shadcn/ui (Button, Tabs, Dialog, Toast) s našim varijacijama; radius `12px` za gumbe, `16px` za kartice; kontrast AA.
* **Motion**: 200ms ease‑out za hover/tab promjene; poštovati `prefers-reduced-motion`.
* **A11y**: fokus ring 2px + 2px offset; potpuna tastaturna navigacija; ARIA landmarki.

---

## 7) Integracijski tokovi (kritični)

### 7.1 Create → Up → Resolve URLs

1. `POST /projects`
2. `POST /projects/{slug}/up`
3. `POST /projects/{slug}/resolve-urls` → prikaži matricu i `baseUrl`
4. Toast „Running on {baseUrl}“

### 7.2 Install CLI (Claude/Gemini)

1. Klik na **Install** → spinner u gumbu
2. Otvori SSE `/install/...` i stremaj linije u collapsible panel
3. Po završetku: toast „Installed vX“ ili „Failed“ + link na log
4. Osvježi Project detalje (field `claudeCli`/`geminiCli`)

### 7.3 Logs (live)

* Otvori SSE stream; dopušteno pauzirati; buffer do 2k linija uz truncation.

---

## 8) Performanse

* Code‑splitting po tabovima; lazy import za Logs/MCP.
* Virtualizacija liste projekata.
* Debounce (250 ms) na filteru.
* Memoizacija teških tablica (Ports & URLs).

---

## 9) Kvaliteta koda i testovi

* **Tipovi**: DTO definicije u `/types/dto.ts` usklađene s backend shemama.
* **Unit**: utili (`format`, `a11y`, `sse`).
* **Integration**: ProjectOverview + NewProjectModal (mock `api.ts`).
* **e2e**: Playwright scenariji: Create → Up → Resolve → Install Claude → Smoke test badge.
* **A11y testovi**: axe‑core na ključnim ekranima.

---

## 10) Handoff i konfiguracija

* **.env** (renderer): `VITE_API_BASE=http://127.0.0.1:9976/api/v1`
* **Electron preload** izlaže: `window.shell.run({ cmd, args, cwd, kind })` (TopBar globalne akcije).
* **Feature flags**: `ENABLE_MCP_TAB`, `ENABLE_TESTS_TAB` (po defaultu on).
* **i18n**: placeholder (en/hr) — microcopy minimalan, tehnički ton.

---

## 11) Dovršni kriteriji (DoD)

* Piksel‑fidelitet s UX vodičem (boje, spacing, tipografija).
* Sve P0 tokove pokriva e2e smoke.
* Aplikacija radi bez grešaka kada backend nije dostupan (graceful empty/error states).
* Top bar akcije i Quick Actions imaju **spinner + toast** obrazac.
* Navigacija je potpuno upravljiva tipkovnicom; kontrast AA.

---

## 12) Otvorene točke (za potvrdu prije implementacije)

* Hoćemo li Top bar globalne akcije (Claude/Terminal) ići **isključivo** preko Electron IPC‑a (preporučeno) ili dodati `/system/*` API u backendu? (trenutno: IPC)
* SSE preferencija: ostati na **SSE** ili omogućiti WS fallback? (trenutno: SSE)
* Export design tokensa u CSS var: potvrdite finalne nazive tokena iz `assets/design-tokens.json`.
