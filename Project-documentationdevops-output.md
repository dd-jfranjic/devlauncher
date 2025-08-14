---

name: devops-deployment-engineer
description: End‑to‑end DevOps plan za Dev Launcher (Windows‑native UI, all‑in Docker). Obuhvaća lokalnu containerizaciju, CI/CD, sigurnost, skeniranja, artefakte i opcionalnu produkcijsku infrastrukturu.
version: 1.0
input\_types:

* technical\_architecture\_document
* deployment\_requirements
* security\_specifications
* performance\_requirements
  output\_types:
* infrastructure\_as\_code
* ci\_cd\_pipelines
* deployment\_configurations
* monitoring\_setup
* security\_configurations
  last-updated: 2025-08-10
  status: draft
  related-files:
* ./architecture-output.md
* ./backend-output.md
* ./frontend-output.md
* ../design-documentation/README.md

---

# DevOps & Deployment — Dev Launcher

## Core Mission

Skalabilna i sigurna isporuka **Dev Launcher** sustava kroz dvije operativne razine:

* **Phase 3 – Local Development Mode**: brzo pokretanje svih servisa lokalno (Docker, hot‑reload, SSE testovi, Playwright smoke), bez frikcije za developere.
* **Phase 5 – Production Deployment Mode**: reproducibilni buildovi, skeniranje, verzioniranje, objava artefakata (Docker image + Windows installer), opcionalni cloud registry i politke sigurnosti.

> Kontekst: Dev Launcher backend radi u vlastitom containeru i komunicira lokalno (`127.0.0.1:9976`). Svi projekti su **all‑in Docker**. OS je Windows 11 + WSL2 + Docker Desktop.

---

## Phase 3 — Local Development Mode

### 1) Containerization (infrastructure\_as\_code)

**`Dockerfile` (devlauncher – development)**

```dockerfile
# Dev Launcher backend (Node/TS) — DEV build (hot reload)
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=development \
    DEVL_PORT=9976
EXPOSE 9976
CMD ["bash","-lc","npm run dev"]
```

**`docker-compose.yml` (repo: `C:/Users/jfran/Documents/dev-launcher`)**

```yaml
version: "3.8"
services:
  devlauncher:
    build: .
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

**.env.local (primjer)**

```
NODE_ENV=development
DEVL_PORT=9976
WSL_DISTRO=Ubuntu
PROJECTS_ROOT_WIN=C:\\Users\\jfran\\Documents\\dev-projects
PROJECTS_ROOT_WSL=/home/jfranjic/dev-projects
```

**Quick start**

```
docker compose up -d --build
# health check
curl http://127.0.0.1:9976/api/v1/health
```

### 2) Local Networking

* Svi API endpointi: `127.0.0.1` (loopback only). Bez izlaganja na mreži.
* Docker socket montiran samo u `devlauncher` container.

### 3) Development Scripts

* `npm run dev` – start API (ts-node / nodemon)
* `npm run test` – unit/integration
* `npm run e2e` – Playwright (headless)
* `npm run lint` – ESLint + tsc

### 4) Local Tooling

* **Playwright MCP**: `npx playwright test` iz `devlauncher` containera; report u `/app/.devlauncher/logs/playwright/`.
* **Trivy (lokalno, opcionalno)**: `trivy fs --exit-code 0 --severity HIGH,CRITICAL .`

---

## Phase 5 — Production Deployment Mode

### 1) Artefakti i verzioniranje

* **Docker image**: `ghcr.io/datadox/devlauncher:<semver>`
* **Windows installer (Electron app)**: `DevLauncher-<version>-win-x64.exe` (CI build)
* **SemVer**: `MAJOR.MINOR.PATCH`; release grane `release/x.y`.

### 2) CI/CD (ci\_cd\_pipelines)

**GitHub Actions — `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
jobs:
  build-test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install
        run: npm ci
      - name: Lint & Typecheck
        run: npm run lint && npm run typecheck --if-present
      - name: Unit tests
        run: npm test -- --reporter=junit
      - name: Build backend (ts)
        run: npm run build
  docker-scan:
    runs-on: ubuntu-latest
    needs: build-test
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: docker build -t devlauncher:ci .
      - name: Trivy scan
        uses: aquasecurity/trivy-action@0.20.0
        with:
          image-ref: devlauncher:ci
          format: 'table'
          exit-code: '0'
          severity: 'HIGH,CRITICAL'
```

**GitHub Actions — `.github/workflows/release.yml`**

```yaml
name: Release
on:
  push:
    tags: [ 'v*.*.*' ]
jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Login GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build & Push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/datadox/devlauncher:${{ github.ref_name }},ghcr.io/datadox/devlauncher:latest
  windows-installer:
    runs-on: windows-latest
    needs: docker
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install deps
        run: npm ci
      - name: Build renderer
        run: npm run build:renderer --if-present
      - name: Package Electron (unsigned)
        run: npm run dist:win --if-present
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: DevLauncher-win
          path: dist/*.exe
```

**Opcionalno: Code signing**

* Windows cert u GH Secrets (`PFX` + lozinka); korak `signtool` nakon pakiranja.

### 3) Security (security\_configurations)

* **Skeniranje**: Trivy za image, `npm audit` u CI.
* **Secrets**: GH Actions Secrets; principle of least privilege.
* **Policies**: Docker run bez dodatnih privilegija; loopback binding; CSP u Electronu (bez remote contenta).
* **Compliance**: Audit logovi buildova i release‑ova; hashovi artefakata.

### 4) Monitoring & Observability (monitoring\_setup)

* **Build telemetry**: CI logovi i artefakti (JUnit izvještaji, Playwright report kao artefakt).
* **Runtime (lokalno)**: NDJSON logovi preko Pino; komanda „Export diagnostics“ spakira `/app/.devlauncher/logs` za podršku.

### 5) Deployment Configurations (deployment\_configurations)

* **Local prod run** (air‑gapped):

  ```bash
  docker run --name devlauncher -p 9976:9976 \
    -v C:/Users/jfran/Documents/dev-launcher:/app \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v devl_db:/app/.data -v devl_logs:/app/.devlauncher/logs \
    ghcr.io/datadox/devlauncher:latest
  ```
* **Auto‑update**: na Electron strani (opc.) podržati provjeru GitHub Releases.

### 6) Infrastructure as Code (production)

Ovaj projekt je prvenstveno **lokalna desktop aplikacija**. Minimalna IaC razina:

* **Container Registry**: GitHub Container Registry (GHCR) — bez Terraform potrebe.
* **Artifacts Storage**: GitHub Releases — verzionirani exe + checksums.
* **(Opcija)** Ako se uvede centralni „Agent Hub“ servis u oblaku: Terraform modul za

  * VPC + SG, ECS/Fargate ili GKE/Autopilot, ALB/Ingress, RDS/Cloud SQL, CloudWatch/Stackdriver, Secret Manager.

---

## Security Baseline

* API bind na `127.0.0.1`; CORS samo za `app://devlauncher` (Electron).
* CSRF token za sve mutacije; Bearer token generiran na prvom startu.
* Validacija ulaza (slug regex, port range), whitelist root putanja.
* Docker socket dostupan samo Dev Launcher containeru; audit svih Docker akcija.

---

## Performance & Reliability

* CI: cache za `npm ci`, paralelizacija (Windows build + Linux image).
* E2E u CI: `docker compose -f docker-compose.ci.yml up -d` → Playwright smoke protiv `127.0.0.1:9976`.
* Auto‑retry za flaky testove; artefakti (video/screenshot) Playwrighta.

---

## Runbooks

* **Rebuild image**: `docker build -t devlauncher:local .`
* **Scan image**: `trivy image devlauncher:local`
* **Reset DB**: `docker exec -it devlauncher node dist/tools/reset-db.js`
* **Export logs**: zip `./.devlauncher/logs` iz volumena `devl_logs`.

---

## Appendices

### A) docker-compose.ci.yml (ephemeral test)

```yaml
version: "3.8"
services:
  devlauncher:
    build: .
    environment:
      - NODE_ENV=test
      - DEVL_PORT=9976
    ports:
      - "9976:9976"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

### B) `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
```

### C) `.env.example`

```
NODE_ENV=development
DEVL_PORT=9976
WSL_DISTRO=Ubuntu
PROJECTS_ROOT_WIN=C:\\Users\\jfran\\Documents\\dev-projects
PROJECTS_ROOT_WSL=/home/jfranjic/dev-projects
```

---

## Quality Gates

* **CI must pass**: lint, typecheck, unit, e2e smoke.
* **Image scan**: bez CRITICAL; HIGH dopušteni uz dokumentiran waiver.
* **Reproducible build**: tag → image + installer artefakt.
* **Docs up‑to‑date**: ovaj dokument i `architecture-output.md` verzionirani po releaseu.
