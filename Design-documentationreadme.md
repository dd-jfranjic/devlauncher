---

title: Dev Launcher — UX/UI Designer Output (Cloud Agency template)
description: Complete design system, UX specs, and implementation-ready documentation for Dev Launcher (Windows-native UI, all-in Docker).
feature: foundation
last-updated: 2025-08-10
version: 0.1.0
related-files:

* ./design-system/style-guide.md
* ./features/new-project-wizard/README.md
* ./features/top-bar-controls/README.md
* ./features/project-overview/README.md
* ./design-system/tokens/colors.md
* ./design-system/tokens/typography.md
  status: draft

---

# Dev Launcher — UX/UI Documentation (by DataDox)

Minimalistički, profesionalni desktop UI: **lijevi sidebar** (lista projekata), **desni sadržaj** (Overview/Docker/MCP/Logs/Settings), gore **Top bar** „Dev Launcher by DataDox“ s globalnim akcijama (Claude/Gemini/Terminal). Sve akcije jednostavne, brze, bez vizualnih distrakcija.

## Navigacija dokumentacije

* [Design System / Style Guide](./design-system/style-guide.md)
* [Tokens / Colors](./design-system/tokens/colors.md)
* [Tokens / Typography](./design-system/tokens/typography.md)
* [Tokens / Spacing](./design-system/tokens/spacing.md)
* [Tokens / Animations](./design-system/tokens/animations.md)
* [Components / Buttons](./design-system/components/buttons.md)
* [Components / Navigation](./design-system/components/navigation.md)
* [Components / Forms](./design-system/components/forms.md)
* [Components / Modals](./design-system/components/modals.md)
* [Feature: New Project Wizard](./features/new-project-wizard/README.md)
* [Feature: Top Bar Controls](./features/top-bar-controls/README.md)
* [Feature: Project Overview](./features/project-overview/README.md)
* [Feature: Docker Tab](./features/docker-tab/README.md)
* [Feature: MCP Manager](./features/mcp-manager/README.md)
* [Feature: Logs Tab](./features/logs-tab/README.md)
* [Accessibility Guidelines](./accessibility/guidelines.md)

---

## Directory Structure

```
/design-documentation/
├── README.md
├── design-system/
│   ├── README.md
│   ├── style-guide.md
│   ├── components/
│   │   ├── README.md
│   │   ├── buttons.md
│   │   ├── forms.md
│   │   ├── navigation.md
│   │   ├── cards.md
│   │   └── modals.md
│   ├── tokens/
│   │   ├── README.md
│   │   ├── colors.md
│   │   ├── typography.md
│   │   ├── spacing.md
│   │   └── animations.md
│   └── platform-adaptations/
│       ├── README.md
│       ├── ios.md
│       ├── android.md
│       └── web.md
├── features/
│   ├── new-project-wizard/
│   │   ├── README.md
│   │   ├── user-journey.md
│   │   ├── screen-states.md
│   │   └── implementation.md
│   ├── top-bar-controls/
│   │   ├── README.md
│   │   ├── screen-states.md
│   │   └── implementation.md
│   ├── project-overview/
│   │   ├── README.md
│   │   ├── screen-states.md
│   │   └── implementation.md
│   ├── docker-tab/
│   │   ├── README.md
│   │   └── screen-states.md
│   ├── mcp-manager/
│   │   ├── README.md
│   │   └── screen-states.md
│   └── logs-tab/
│       ├── README.md
│       └── screen-states.md
├── accessibility/
│   ├── README.md
│   ├── guidelines.md
│   └── testing.md
└── assets/
    ├── design-tokens.json
    └── reference-images/
```

---

## Embedded Files (foundations)

> Ovdje donosim sadržaj ključnih datoteka (ostatak strukture koristit ćemo kao prazne stubove do popune).

### File: `design-system/style-guide.md`

---

---

title: Style Guide — Dev Launcher (DataDox)
description: Boje, tipografija, spacing, komponente i stanja za Dev Launcher.
last-updated: 2025-08-10
status: draft
-------------

# Style Guide — Dev Launcher

## Color System

**Primary** `#2563EB`
**Primary Dark** `#1E40AF`
**Primary Light** `#DBEAFE`

**Secondary** `#10B981`
**Secondary Light** `#D1FAE5`
**Secondary Pale** `#ECFDF5`

**Accent Primary** `#7C3AED`
**Accent Secondary** `#F59E0B`
**Gradient Start** `#2563EB` → **Gradient End** `#7C3AED`

**Semantic**
Success `#16A34A`
Warning `#D97706`
Error `#DC2626`
Info `#0EA5E9`

**Neutral**
`#0B1220` (900), `#1F2937` (800), `#374151` (700), `#4B5563` (600), `#6B7280` (500), `#9CA3AF` (400), `#D1D5DB` (300), `#E5E7EB` (200), `#F3F4F6` (100), `#F9FAFB` (50)

**Accessibility**

* Primarni CTA na svijetloj podlozi: #2563EB tekst na #F9FAFB → kontrast > 7:1
* Tekst na tamnoj podlozi ≥ 4.5:1; large text ≥ 3:1

## Typography

**Primary**: Inter, Segoe UI, system-ui, sans-serif
**Monospace**: JetBrains Mono, Consolas, monospace

**Weights**: 300/400/500/600/700
**Scale (desktop)**:

* H1: 28/36, 700, -0.2px
* H2: 22/30, 600
* H3: 18/26, 600
* H4: 16/24, 600
* Body L: 16/26
* Body: 14/22
* Caption: 12/18
* Label: 12/16, 600, upper

**Responsive**: -1 step na tablet, -2 na mobile; max line-length 72ch.

## Spacing & Layout

Base `8px`; scale: 4/8/12/16/24/32/48/64.
Grid: 12 (desktop), 8 (tablet), 4 (mobile).
Cards radius `16px`, buttons radius `12px`; shadows: sm/md/lg, soft.

## Components (overview)

* Buttons: Primary/Secondary/Ghost; states: default/hover/focus/disabled/loading.
* Navigation: Sidebar (rail 280px), Top bar (56px).
* Tabs: Underline active, motion 200ms ease-out.
* Toasts: bottom-right, auto-hide 4s; success/info/warn/error.

---

### File: `design-system/tokens/colors.md`

---

---

title: Tokens — Colors
description: Design tokens za boje (hex i semantic mapping)
last-updated: 2025-08-10
status: draft
-------------

```json
{
  "color.primary": "#2563EB",
  "color.primary.dark": "#1E40AF",
  "color.primary.light": "#DBEAFE",
  "color.secondary": "#10B981",
  "color.accent.primary": "#7C3AED",
  "color.accent.warning": "#F59E0B",
  "color.success": "#16A34A",
  "color.warning": "#D97706",
  "color.error": "#DC2626",
  "color.info": "#0EA5E9",
  "neutral.900": "#0B1220",
  "neutral.50": "#F9FAFB"
}
```

---

### File: `design-system/tokens/typography.md`

---

---

title: Tokens — Typography
description: Tipografske skale i font stackovi
last-updated: 2025-08-10
status: draft
-------------

* font.primary: `Inter, Segoe UI, system-ui, sans-serif`
* font.mono: `JetBrains Mono, Consolas, monospace`
* size.h1: 28/36/700
* size.h2: 22/30/600
* size.h3: 18/26/600
* size.body: 14/22/400
* size.caption: 12/18/400

---

### File: `design-system/components/buttons.md`

---

---

title: Components — Buttons
description: Specifikacije gumba, varijante i stanja
last-updated: 2025-08-10
status: draft
-------------

**Variants**: Primary, Secondary, Ghost
**Sizes**: S (28h), M (36h), L (44h)
**Radius**: 12px
**Padding**: 0 12/16/20
**Focus**: 2px outline `#2563EB` + 2px offset
**Loading**: inline spinner 16px, 200ms fade

**Usage**

* Primary za glavne akcije (Create, Start, Install).
* Secondary za sporedne.
* Ghost za tekstualne akcije.

---

### File: `design-system/components/navigation.md`

---

---

title: Components — Navigation
description: Sidebar, Top bar, Tabs
last-updated: 2025-08-10
status: draft
-------------

**Top bar**: 56px, left: logo + “Dev Launcher by DataDox”, right: `Claude | Continue | Bypass | Bypass+Continue | MCP List | Terminal`
**Sidebar**: 280px, scroll; New Project, Filter, list of projects
**Tabs**: Overview, Docker, MCP, Logs, Settings; underline motion 200ms ease-out

---

### File: `features/new-project-wizard/README.md`

---

---

title: Feature — New Project Wizard
description: Location (Windows/WSL) + Template (Blank/Next.js/WordPress) + Create flow
feature: new-project-wizard
last-updated: 2025-08-10
status: draft
-------------

## UX Brief

* **Goal**: kreirati projekt u 3 koraka (Name → Location → Template) s jasnim previewom putanja i porta.
* **Success**: projekt se kreira i podiže (compose up), otvara Overview.

## IA & Flow

1. Modal → Name (slug preview)
2. Location: Windows | WSL (prikaz root putanje)
3. Template: Blank | Next.js | WordPress
4. Create → Spinner ("Generating…") → Done toast

## Acceptance (vizualno)

* Primary CTA uvijek vidljiv; disable dok slug invalidan
* Error inline (duplikat sluga)
* Hint o performansama na Windows bind mountu

---

### File: `features/top-bar-controls/README.md`

---

---

title: Feature — Top Bar Controls (Claude/Gemini/Terminal)
description: Globalne akcije u stalnom top baru
feature: top-bar-controls
last-updated: 2025-08-10
status: draft
-------------

## Buttons (redom desno)

* **Claude** → `claude`
* **Continue** → `claude -c`
* **Bypass** → `claude --dangerously-skip-permissions`
* **Bypass + Continue** → `claude --dangerously-skip-permissions -c`
* **MCP List** → `claude mcp list`
* **Terminal** → `wt.exe -p "PowerShell 7"`

## States

* Default / Hover / Active / Focus / Disabled
* Tooltips s detaljnim naredbama
* Keyboard shortcuts: `Alt+1..6`

---

### File: `features/project-overview/README.md`

---

---

title: Feature — Project Overview
description: Quick Actions, Ports & URLs, Status badges
feature: project-overview
last-updated: 2025-08-10
status: draft
-------------

## Sections

* **Quick Actions**: Terminal, Folder, Editor, **Install Claude CLI**, **Install Gemini CLI**, Start/Stop, Reallocate Ports, Rebuild
* **Ports & URLs**: tablica s rezultatima (OK/Fail)
* **Status**: Docker status + zadnji Playwright rezultat

## Loading/Empty/Error

* Empty: upute za prvo pokretanje
* Loading: skeleton kartice
* Error: banner s rješenjima i linkom na log

---

### File: `accessibility/guidelines.md`

---

---

title: Accessibility Guidelines
description: WCAG 2.1 AA standardi i testna lista
last-updated: 2025-08-10
status: draft
-------------

* Kontrast: 4.5:1 (tekst), 3:1 (large); fokus jasno vidljiv
* Potpuna tastaturna navigacija; skip-to-content
* ARIA landmark roles (banner/nav/main/region/status)
* `prefers-reduced-motion` poštovati; alternative za animacije
* Touch target ≥ 44×44px; jasne etikete i stanja

---

### File: `assets/design-tokens.json`

```json
{
  "$schema": "https://design-tokens.org/schema.json",
  "props": {
    "color-primary": {"value": "#2563EB"},
    "color-secondary": {"value": "#10B981"},
    "radius-card": {"value": "16px"},
    "radius-button": {"value": "12px"},
    "space-2": {"value": "8px"},
    "space-3": {"value": "12px"},
    "space-4": {"value": "16px"}
  }
}
```

---

## Next Steps

* Popuniti preostale stubove (forms, modals, docker-tab, mcp-manager, logs-tab).
* Dodati detaljne **screen-states.md** za svaku značajku (Default/Loading/Error/Success).
* Izvesti **design tokens** u Style Dictionary i povezati s frontend codebaseom.
