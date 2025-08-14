---

name: product-manager
description: Transform raw ideas or business goals into structured, actionable product plans. Create user personas, detailed user stories, and prioritized feature backlogs. Use for product strategy, requirements gathering, and roadmap planning.
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Dev Launcher — Product Manager Output (Cloud Agency template)

## Executive Summary

* **Elevator Pitch**: Aplikacija za Windows koja jednim klikom stvara i pokreće izolirane Docker projekte (Windows ili WSL), s profesionalnim UI‑jem i AI agentima koji čitaju logove i sami pokreću smoke testove.
* **Problem Statement**: Na Windows + WSL okruženjima postavljanje dev stacka je sporo i krhko (ručni koraci, port kolizije, nepouzdani gumbi). Timovi gube vrijeme na infrastrukturu umjesto na kod.
* **Target Audience**: Individualni developeri i male/ srednje agencije koje rade na Windows 11 s WSL2 i Docker Desktopom; fokus na Hrvatsku/EU SMB segment.
* **Unique Selling Proposition**: Windows‑native GUI + **All‑in Docker** (bez iznimaka) + **Location picker (Windows/WSL)** + ugrađeni **AI tokovi (Claude/Gemini, MCP, Playwright)** s pristupom logovima; „one‑click“ UX bez copy‑pastea.
* **Success Metrics**:

  * TTFP (*time‑to‑first‑preview*) < **90 s** za Next.js/WordPress
  * 1‑click akcije uspjeh ≥ **99%** (Terminal/VSCode/Explorer)
  * Port kolizije ≤ **0.5%** po kreiranju
  * Uspješna instalacija CLI (Claude/Gemini) ≥ **95%**
  * Smoke test (Playwright) prolaz ≥ **90%** na svježim templateovima

---

## Feature Specifications

### 1) New Project Wizard (Location + Template)

* **User Story**: Kao developer, želim izabrati lokaciju (Windows/WSL) i template (Blank/Next.js/WordPress) kako bih u nekoliko koraka dobio spreman projekt.
* **Acceptance Criteria**:

  * Given modal, when odaberem *Location*, *Type* i *Name*, then se kreira folder u `C:\Users\jfran\Documents\dev-projects\<slug>` **ili** `/home/jfranjic/dev-projects/<slug>`.
  * Generira se `.devlauncher.json` + `docker-compose.yml` (per‑location varijante) i alociraju portovi.
  * Edge: duplikat sluga → jasna greška, bez side‑efekata.
* **Priority**: **P0**
* **Dependencies**: Template engine, Port allocator
* **Technical Constraints**: WSL dostupnost; Docker Desktop running
* **UX Considerations**: Minimalan modal, preview sluga i putanja, warning za bind‑mount performanse na Windows lokaciji.

### 2) Project List + Filter (Sidebar)

* **User Story**: Kao korisnik, želim brzo pronaći projekt i otvoriti ga.
* **Acceptance Criteria**: Real‑time filter; aktivni projekt vizualno označen; „New Project“ gumb.
* **Priority**: **P0**
* **Dependencies**: Local registry
* **Technical Constraints**: Do 1k projekata bez primjetnog lagga (virtu. lista)
* **UX Considerations**: Tipografija čista, bez dekoracija; hover/click stanja.

### 3) One‑click Shortcuts (Terminal/Explorer/VSCode)

* **User Story**: Kao developer, želim jednim klikom otvoriti Terminal (PS7), File Explorer ili VS Code u rootu projekta.
* **Acceptance Criteria**:

  * Windows projekt: `wt.exe -p "PowerShell 7" -d C:\\Users\\jfran\\Documents\\dev-projects\\<slug>`; `explorer.exe` i `code` na istu lokaciju.
  * WSL projekt: `wt.exe -p "PowerShell 7" -d \\wsl$\\Ubuntu\\home\\jfranjic\\dev-projects\\<slug>`; `wsl.exe ... code .`.
  * Edge: ako profil „PowerShell 7“ ne postoji, fallback na default profil + upozorenje u toastu.
* **Priority**: **P0**
* **Dependencies**: Windows Terminal, VS Code (Remote‑WSL)
* **Technical Constraints**: UNC staze za WSL
* **UX Considerations**: Akcije vidljive u Overview kartici.

### 4) All‑in Docker Orchestration (per‑project compose)

* **User Story**: Kao tim, želimo da svaki projekt (i sam Launcher) radi u vlastitom containeru radi izolacije i uniformnih logova.
* **Acceptance Criteria**: `docker project name = <slug>`; izolirane mreže/volumeni; `docker compose up/down` iz UI‑ja.
* **Priority**: **P0**
* **Dependencies**: Docker Desktop, socket mount u Dev Launcher container
* **Technical Constraints**: `\wsl$` bind mountovi; limiti path duljine na Windowsu
* **UX Considerations**: Docker tab s listom servisa i „Logs/Restart“ kratkim akcijama.

### 5) Global Port Allocator & Registry

* **User Story**: Kao korisnik, želim automatsku dodjelu slobodnih portova bez kolizija.
* **Acceptance Criteria**: Scan Docker mapiranih portova + OS bind probe + interna registry datoteka; kolizija → sljedeći slobodan port i update `.devlauncher.json`.
* **Priority**: **P0**
* **Dependencies**: Docker API pristup; lokalni registry
* **Technical Constraints**: Port range per template
* **UX Considerations**: Toast ako je došlo do re‑mapiranja.

### 6) URL Resolver & Health Check

* **User Story**: Kao korisnik, želim garantirano ispravan URL za otvaranje appa.
* **Acceptance Criteria**: Test `localhost → 127.0.0.1 → host.docker.internal → WSL_IP`; WP: `GET /wp-json`; Next.js: `GET /api/health` ili `HEAD /`.
* **Priority**: **P0**
* **Dependencies**: Network probe lib
* **Technical Constraints**: Timeout 2 s per kandidat
* **UX Considerations**: Tablica „Ports & URLs“ s oznakama OK/Fail.

### 7) Centralized Logs + Agent Access

* **User Story**: Kao AI agent, želim pristup docker logovima kako bih se sam ispravljao.
* **Acceptance Criteria**: Montiran `/var/run/docker.sock` u Launcher container; per‑project log direktorij `./.devlauncher/logs/`.
* **Priority**: **P0**
* **Dependencies**: Docker socket mount
* **Technical Constraints**: Sigurnosno izolirati API pristup
* **UX Considerations**: „Open logs folder“ i live tail u UI.

### 8) Install Claude Code CLI (per project)

* **User Story**: Kao korisnik, želim jednim klikom instalirati Claude CLI u projektu.
* **Acceptance Criteria**: `npm install -g @anthropic-ai/claude-code` + `claude --version`; spinner → toast (Done/Failed); log datoteka; stanje upisano u `.devlauncher.json`.
* **Priority**: **P0**
* **Dependencies**: Node/npm dostupni u okruženju izvršavanja
* **Technical Constraints**: WSL vs Windows spawn
* **UX Considerations**: Disable gumba tijekom instalacije.

### 9) Install Google Gemini CLI (per project)

* **User Story**: Kao korisnik, želim opcionalno instalirati Gemini CLI.
* **Acceptance Criteria**: `npm install -g @google/gemini-cli` + `gemini --version|--help`; spinner → toast; log; stanje upisano.
* **Priority**: **P1**
* **Dependencies**: Node/npm
* **Technical Constraints**: Path do `gemini`
* **UX Considerations**: Isti obrazac kao Claude.

### 10) Playwright MCP Smoke Tests

* **User Story**: Kao tim, želimo jednim klikom pokrenuti smoke testove i vidjeti rezultat.
* **Acceptance Criteria**: Endpoint `/test/smoke` u Launcher containeru pokreće `npx playwright test`; report u `logs/playwright/`; status u UI (Pass/Fail + link na report).
* **Priority**: **P1**
* **Dependencies**: Playwright + deps u containeru
* **Technical Constraints**: Xvfb/headless okruženje
* **UX Considerations**: Badge u Overview: „Last test: Pass/Fail, timestamp“.

### 11) MCP Manager

* **User Story**: Kao korisnik, želim pregledati/dodati/ukloniti MCP servere po projektu.
* **Acceptance Criteria**: `mcp list/install/remove/test`; spremanje profila; logovi.
* **Priority**: **P1**
* **Dependencies**: Claude CLI
* **Technical Constraints**: Konfiguracija profila po projektu
* **UX Considerations**: Advanced sekcija (progressive disclosure).

### 12) Top Bar Controls (Claude & Terminal)

* **User Story**: Kao korisnik, želim brze globalne akcije dostupne uvijek.
* **Acceptance Criteria**: Desno u top baru gumbi: `claude`, `claude -c`, `claude --dangerously-skip-permissions`, `claude --dangerously-skip-permissions -c`, `claude mcp list`, i **Terminal PS7**.
* **Priority**: **P0**
* **Dependencies**: Claude CLI, Windows Terminal
* **Technical Constraints**: PATH i profili
* **UX Considerations**: Minimalan top bar s labelom „Dev Launcher by DataDox“.

### 13) Safe Delete

* **User Story**: Kao korisnik, želim sigurno brisanje bez rizika da obrišem krivu lokaciju.
* **Acceptance Criteria**: Dry‑run preview; guard na root path; `compose down -v` opcionalno.
* **Priority**: **P0**
* **Dependencies**: Registry
* **Technical Constraints**: Permisije
* **UX Considerations**: Modal s jasnim upozorenjem.

### 14) Settings (Roots, Profiles)

* **User Story**: Kao korisnik, želim podesiti root putanje i profile.
* **Acceptance Criteria**: Roots: `C:\Users\jfran\Documents\dev-projects` i `/home/jfranjic/dev-projects`; terminal profil = **PowerShell 7** default.
* **Priority**: **P0**
* **Dependencies**: Local config
* **Technical Constraints**: Validacija putanja
* **UX Considerations**: Jednostavan ekran, bez suvišnih opcija.

---

## Requirements Documentation Structure

### 1. Functional Requirements

* **User flows**: Create → (allocate ports → scaffold → compose up) → Open (Terminal/VSCode/URLs) → Logs → Install CLI → Test → Delete.
* **Decision points**: Location (Windows/WSL); Template; Optional installi; Test sada/poslije.
* **State management**: Global store (projekti, status containera, port registry); per‑project state.
* **Data validation**: Slug regex `^[a-z][a-z0-9-]{1,38}[a-z0-9]$`; path whitelist; port range check.
* **Integration points**: Docker Engine API (socket), `wsl.exe`, `wt.exe`, `explorer.exe`, `code`, Claude CLI, Gemini CLI, Playwright.

### 2. Non‑Functional Requirements

* **Performance**: UI load < **1500 ms** na modernom laptopu; create→preview < **90 s**; URL check < **2 s** po kandidatu.
* **Scalability**: ≥ **1000** projekata u listi; 10 paralelnih containera bez degradacije UI‑ja.
* **Security**: Scoped akcije (whitelist rootova); nikad ne izvršavati van odabranih direktorija; ograničiti Docker socket API na nužne rute; audit log.
* **Reliability**: Akcije idempotentne; retry za kratke greške (Docker/WSL inicijalizacija).
* **Accessibility**: WCAG 2.1 AA; kompletna tastaturna navigacija; visok kontrast.

### 3. User Experience Requirements

* **Information architecture**: Top bar + lijevi sidebar (lista) + desni content (tabovi: Overview/Docker/MCP/Logs/Settings).
* **Progressive disclosure**: MCP i napredne mrežne postavke skrivene dok ne zatrebaju.
* **Error prevention**: Validacija sluga i putanja; guard na delete; port allocator prije `up`.
* **Feedback patterns**: Spinneri u gumbima; toast za uspjeh/pad; status badge za testove; live log tail.

---

## Critical Questions Checklist

* [ ] Koje postojeće rješenje mijenjamo/pojednostavljujemo (npr. ručni Docker/WSL setup, vlastiti bash skriptovi)?
* [ ] Što je MVP „najmanje dovoljno“ (P0 skup)?
* [ ] Koji su rizici: performanse bind mounta, prava nad Docker socketom, PATH problemi za CLI alate?
* [ ] Platformske specifičnosti: WSL distro, Windows Terminal profil, VS Code Remote‑WSL.

---

## Output Standards

Ova specifikacija je **nedvosmislena**, **testabilna** (priloženi acceptance kriteriji), **trasabilna** (P0/P1 vezani na ciljeve) i **provediva** u postojećem Windows + WSL + Docker Desktop okruženju.

---

## Your Documentation Process

1. **Confirm Understanding**: Primijenio sam Cloud Agency format na "Dev Launcher"; ključne pretpostavke: All‑in Docker, Windows‑native UI, location picker, PS7 default, AI agenti (Claude/Gemini) + Playwright MCP, fiksne root putanje.
2. **Research and Analysis**: Osnovane pretpostavke o okruženju (Windows 11, WSL2, Docker Desktop) i alatima (wt.exe, wsl.exe, VS Code Remote‑WSL, Claude/Gemini CLI, Playwright).
3. **Structured Planning**: Dokument strukturiran u Executive Summary, Feature Specifications, i FR/NFR/UX zahtjeve.
4. **Review and Validation**: P0 skup je definiran tako da isporučuje jednim klikom pokretanje projekta i stabilnu integraciju s OS‑om.
5. **Final Deliverable**: Ovaj markdown je spreman za reviziju dionika.
