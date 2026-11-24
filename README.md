# EduAsset — Front-End Prototype

**Institutional Property Custodianship & Predictive Inventory System** for the WildCat Innovation
Labs (WIL) and the CIT Property Office.

The repository holds two front ends:

- **React + Tailwind application** at the repository root. This is the in-progress replacement for
  the static prototype. The app shell, design tokens, Login, Central Dashboard and Reorder Alerts are
  implemented; all other routes are wired as marked placeholders.
- **Static design reference** under `design/`. All 17 approved desktop screens remain available
  there and are the visual source of truth while the React screens are ported.

> **Prototype only.** No backend, database, real authentication or persistence. React auth is a
> local mock kept in `localStorage`; all data is sample data. Production still targets React +
> Spring Boot + MySQL as required by the SRS.

---

## Status

| Surface | React app | SRS figure |
|---|---|---|
| Sign in, portal selection, validation | **Implemented** | 3.35 |
| Central Dashboard | **Implemented** | 3.36 |
| Reorder Alerts, PR preview, forecast settings | **Implemented** | 3.3–3.5 |
| Requisition Review | Placeholder | 3.7–3.8 |
| Turnover Approval & Disbursement | Placeholder | 3.13 |
| Master Ledger | Placeholder | 3.17–3.18 |
| Repair & BER | Placeholder | 3.21–3.23 |
| Verified Replacement | Placeholder | 3.24–3.25 |
| Reconciliation | Placeholder | 3.26 |
| Audit Queue | Placeholder | 3.27 |
| Receive New Items | Placeholder | 3.30–3.34 |
| Lab Dashboard | Placeholder | 3.37 |
| Lab Supply Requisition | Placeholder | 3.6 |
| Turnover Scan | Placeholder | 3.11–3.12 |
| Report Incident | Placeholder | 3.19 |
| Lab Inventory | Placeholder | 3.14 |
| Work Orders | Placeholder | 3.20 |

The 14 placeholder routes already use the real shell, breadcrumbs, sidebar counts and role guards;
each states what will be ported from its approved static screen.

**Current state:** the React vertical slice is merged (`e70eee4`, 24 November 2026), with handoff
notes committed after it. Three screens are implemented; fourteen remain placeholders. The static
reference is still the complete 17-screen artifact. Start the next session with
**[`docs/HANDOFF.md`](docs/HANDOFF.md)** for the state, verification record and recommended porting
order.

---

## Run the React app

```powershell
cd "Project Folder"
npm install
npm run dev
```

Open the URL Vite prints, normally <http://localhost:5173/>. The app uses hash routing, so:
<http://localhost:5173/#/login>.

### Demo sign-in

1. Choose **Central Property** or **WIL Lab**.
2. Enter any valid-format email and any password with 8+ characters.
3. **Sign in** goes straight to that portal's dashboard.

No credentials are checked. The session is stored in `localStorage` until you sign out.

### Build and preview

```powershell
npm run build
npm run preview
```

`npm run build` runs the TypeScript check, builds the Vite app, and copies `design/` into
`dist/design/`. `npm run preview` serves the result, normally at
<http://localhost:4173/>. The static reference is also served during `npm run dev` at
<http://localhost:5173/design/>.

---

## Run the static design reference

Serve the **repository root**, not `design/screens/` and not `file://`, because the shared chrome
uses relative paths.

```powershell
cd path\to\EduAsset
python -m http.server 8000
```

Then open:

- **Launcher** — <http://localhost:8000/design/>
- **Login** — <http://localhost:8000/design/screens/login.dc.html>
- **Central dashboard** — <http://localhost:8000/design/screens/central-dashboard.dc.html>
- **Lab dashboard** — <http://localhost:8000/design/screens/lab-dashboard.dc.html>

The static prototype's sign-in asks for the same demo credentials, then shows an **Open … Portal**
hand-off.

---

## Repository layout

```text
.
├── src/                        # React application
│   ├── components/
│   │   ├── brand/              # SVG logo
│   │   ├── layout/             # AppShell, TopBar, Sidebar, nav config
│   │   └── ui/                 # Button, Card, Table, Badge, Dialog, Tabs, …
│   ├── context/                # mock auth + toasts
│   ├── data/                   # seed access, dashboard and forecast data
│   ├── lib/                    # helpers and page titles
│   ├── screens/                # Login, CentralDashboard, ReorderAlerts, placeholders
│   ├── App.tsx                 # routes and role guards
│   ├── index.css               # Tailwind 4 theme tokens and base styles
│   ├── main.tsx                # providers and HashRouter
│   └── types.ts
├── scripts/copy-design.mjs     # adds design/ to the production build
├── index.html                  # Vite entry
├── package.json
├── vite.config.ts
├── tsconfig.json
├── design/
│   ├── index.html              # static prototype launcher
│   └── screens/                # 17 approved screens + ONE shared runtime
│       ├── login.dc.html
│       ├── central-*.dc.html   # 10 Central screens
│       ├── lab-*.dc.html       # 6 Lab screens
│       ├── Sidebar.dc.html
│       ├── TopBar.dc.html
│       ├── support.js
│       └── vendor/
├── docs/
│   ├── API-CONTRACT.md         # endpoints, payloads, enums, role rules
│   ├── HANDOFF.md              # session state, verification record, next work
│   ├── SEED-DATA.json          # 28 units, 10 flags, items, reqs, turnovers, WOs
│   └── SCREEN-MAP.md           # screen → SRS figure → requirements → actions
├── PRODUCT.md                  # product truth, users, surfaces and constraints
├── DESIGN.md                   # Wildcat visual system and tokens
└── README.md
```

The React design system lives in `src/index.css` as Tailwind 4 `@theme` tokens and in the shared
components under `src/components/ui/`. `DESIGN.md` remains the design specification.

---

## Screens

### Login

| Screen | SRS figure | React |
|---|---|---|
| Sign in + portal selection + inline validation | 3.35 | Implemented |

### Central Property Custodian Portal

| Screen | SRS figure | React |
|---|---|---|
| Dashboard | 3.36 | Implemented |
| Reorder Alerts (forecast, PR preview, settings) | 3.3, 3.4, 3.5 | Implemented |
| Requisition Review + review dialog | 3.7, 3.8 | Placeholder |
| Turnover Approval & Disbursement | 3.13 | Placeholder |
| Master Ledger + unit record | 3.17, 3.18 | Placeholder |
| Repair & BER + condemnation form | 3.21, 3.22, 3.23 | Placeholder |
| Verified Replacement | 3.24, 3.25 | Placeholder |
| Periodic Reconciliation | 3.26 | Placeholder |
| Audit Queue | 3.27 | Placeholder |
| Receive New Items (four-step flow) | 3.30–3.34 | Placeholder |

### WIL Lab Custodian Portal

| Screen | SRS figure | React |
|---|---|---|
| Dashboard | 3.37 | Placeholder |
| Supply Requisition | 3.6 | Placeholder |
| Turnover Scan (match + mismatch) | 3.11, 3.12 | Placeholder |
| Report Incident | 3.19 | Placeholder |
| Lab Inventory | 3.14 | Placeholder |
| Work Orders | 3.20 | Placeholder |

---

## Backend handoff

Start with **[`docs/API-CONTRACT.md`](docs/API-CONTRACT.md)**. It defines:

- Base URL, auth, roles, error format and audit rules.
- All enums (`IN_STOCK`, `ISSUED_IN_USE`, `RETURNED_EMPTY`, `RETIRED`, health states, requisition /
  turnover / repair / replacement / audit states).
- Endpoints per module: alerts, requisitions, turnover, ledger, incidents, work orders, repairs,
  replacements, reconciliation, audit queue and intake.
- Validation rules: BER 50% threshold, note length, quantity ranges, lead time 14–21, safety buffer.
- The AI contract (name + category only, key server-side, 10 s fallback).
- Suggested tables and append-only audit constraints.

**[`docs/SEED-DATA.json`](docs/SEED-DATA.json)** is import-ready sample data: 28 units, 14 items,
10 audit flags, 5 requisitions, 3 turnovers and 3 work orders, matching the screens.

**[`docs/SCREEN-MAP.md`](docs/SCREEN-MAP.md)** is the screen → SRS figure → requirement → action
index.

---

## SRS alignment

The static screens were audited against `Draf SRS.pdf` and updated to satisfy the blocking/major
requirements. The implemented React screens preserve that behaviour. Key implemented behaviour:

- **FR-3.02** — optional manufacturer serial is editable in the ledger unit record and logged.
- **FR-3.15** — repaired assets can be returned to `OPERATIONAL` with the same asset ID, QR and history.
- **FR-3.25** — all four audit-flag types are represented (same asset in two replacements, retired
  re-scan, unit-age mismatch, location replacement rate).
- **FR-3.26** — scheduled reconciliation scans plus a reconciliation category in the Audit Queue.
- **FR-3.11** — recurring incidents set `NEEDS_MAINTENANCE` and dispatch a service ticket.
- **FR-2.06** — turnover mismatches are kept in a visible scan audit trail with account and time.
- **FR-3.20 / UC-3.6** — the old unit can be scanned and verified in Verified Replacement.
- **FR-3.17** — the condemnation form reads each asset's real serial number.
- **§3.3.1** — working navigation, 44 px controls, `ISSUED / IN_USE` status vocabulary.

A separate screen-vs-SRS compliance report is kept with the project documentation (outside this
repository).

### Approved branding revision

SRS §3.3.1 specified CIT-U maroon/gold. The owner approved a design revision on 2026-11-24:
the Wildcat palette (butter `#FFF3B0`, amber `#F5A623`, burnt orange `#B45309`, ink `#171717`,
warm white `#FAF9F6`) with Inter retained. The revision is recorded in `DESIGN.md` and does not
change functional requirements, data or behaviour.

### Scope note

**Figure 3.38 phone screens and phone-width layout are not included.** Both front ends target
desktop web. The React shell is usable at narrow widths (the sidebar becomes a drawer), but the
SRS phone deliverable remains out of scope.

### SRS-internal conflicts resolved in this prototype

- Ledger expanded to 28 units so every unit referenced by the dashboard, replacement, lab-inventory
  and reconciliation screens exists (FR-3.01 wins over Fig 3.17's 10-row count).
- Dashboard shows 8 audit flags, a 21-day PLA trigger, the Color toner row and `+62.5%` (Fig 3.3 /
  3.7 win over Fig 3.36).
- `ISSUED / IN_USE` is the canonical status token; "active" remains prose for the machine link.

---

## Data

Sample data only. The React app reads the canonical mock data in `docs/SEED-DATA.json` for users and
queue counts, and reproduces the approved screen data for the dashboard and Reorder Alerts. Nothing
is written back to a database; a page refresh resets in-memory state.

- 28 ledger units, including every asset referenced across the screens.
- 10 audit flags: 8 reviewable + 2 variance anomalies routed to Requisition Review.
- 5 keyboards received under `DR-118` (`KB-0150`–`KB-0154`).
- 2 replacement candidates in stock with clean issue history.

---

## Known limitations

- Only three of the 17 screens are ported to React; the other 14 routes are placeholders. See
  [`docs/HANDOFF.md`](docs/HANDOFF.md) for the remaining queue.
- Mock auth only; no real account check, backend session or role enforcement. Portal guards are
  client-side.
- No API wiring, database or persistence.
- QR scanning and print/download actions are simulated. Reorder Alerts uses a prototype toast for
  PDF export.
- Phone screens and phone-width layout are out of scope.
- The static reference still logs harmless QR placeholder warnings on three screens.

---

## Tech

**React app**

- React 19, TypeScript, Vite 8.
- React Router 7 with `HashRouter` (safe refresh on static hosting).
- Tailwind CSS 4 (`@tailwindcss/vite`) with Wildcat tokens in `src/index.css`.
- lucide-react icons.
- Inter via Google Fonts.

**Static reference**

- HTML pages using the exported design-component runtime (`support.js` + `vendor/react*.js`).
- No package manager, no build step; served as static files.
- Inter, Wildcat butter/amber/ink palette.

---

## Deploy

`npm run build` produces `dist/` for the React app and copies the static reference to `dist/design/`.

For GitHub Pages or any static host:

1. Set the repository's Pages source to the built output, or publish `dist/` to a `gh-pages` branch.
2. Open the site root; the app routes through `#/…`, so deep links refresh safely.
3. The approved static screens remain available at `/design/`.
4. `vite.config.ts` uses `base: './'`, so the build works from a project subpath without further
   configuration.

---

## Repository

<https://github.com/Pochyy/EduAsset>

Capstone project — IT332, CIT-U.
