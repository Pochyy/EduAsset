# EduAsset — Front-End Prototype

**Institutional Property Custodianship & Predictive Inventory System** for the WildCat Innovation
Labs (WIL) and the CIT Property Office.

This repository contains the **17 high-fidelity desktop screens** specified in the EduAsset SRS
(Figures 3.3–3.37), packaged as a self-contained, clickable prototype plus the backend handoff
documents.

> **This is a design reference, not production code.**
> There is no backend, no database, no authentication and no persistence. Data is sample data held in
> memory. A production build still needs React components wired to the Spring Boot API and MySQL, as
> required by the SRS.

---

## Repository layout

```text
.
├── index.html                  # redirects to design/index.html
├── design/
│   ├── index.html              # prototype launcher (Login / Central / Lab)
│   └── screens/                # 17 screens + ONE shared runtime
│       ├── login.dc.html
│       ├── central-*.dc.html   # 10 Central screens
│       ├── lab-*.dc.html       # 6 Lab screens
│       ├── Sidebar.dc.html
│       ├── TopBar.dc.html
│       ├── support.js
│       └── vendor/
├── docs/
│   ├── API-CONTRACT.md         # endpoints, payloads, enums, role rules
│   ├── SEED-DATA.json          # 28 units, 10 flags, items, reqs, turnovers, WOs
│   └── SCREEN-MAP.md           # screen → SRS figure → requirements → actions
├── PRODUCT.md                  # product truth, users, surfaces and constraints
├── DESIGN.md                   # Wildcat visual system and tokens
└── README.md
```

The screens are no longer one-folder-each with duplicated assets. All 17 share **one** `Sidebar`,
`TopBar`, `support.js` and `vendor/`, and use simple slug filenames.

---

## Run locally

Serve the **repository root** — not `design/screens/`, and not `file://`. The shared chrome is loaded
with relative paths.

```powershell
cd path\to\EduAsset
python -m http.server 8000
```

or with Node:

```bash
npx serve .
```

Then open:

- **Launcher** — <http://localhost:8000/> (redirects to `design/`)
- **Login** — <http://localhost:8000/design/screens/login.dc.html>
- **Central dashboard** — <http://localhost:8000/design/screens/central-dashboard.dc.html>
- **Lab dashboard** — <http://localhost:8000/design/screens/lab-dashboard.dc.html>

Stop the server with `Ctrl+C`.

### Demo sign-in

1. Choose **Central Property** or **WIL Lab**.
2. Enter any valid-format email and any password with 8+ characters.
3. Click **Sign in**, then **Open … Portal**.

No credentials are checked.

---

## Screens

### Login

| Screen | SRS figure |
|---|---|
| Sign in + portal selection + inline validation | 3.35 |

### Central Property Custodian Portal

| Screen | SRS figure |
|---|---|
| Dashboard | 3.36 |
| Reorder Alerts (`PR` preview, forecast settings) | 3.3, 3.4, 3.5 |
| Requisition Review + review dialog | 3.7, 3.8 |
| Turnover Approval & Disbursement | 3.13 |
| Master Ledger + unit record | 3.17, 3.18 |
| Repair & BER + condemnation form | 3.21, 3.22, 3.23 |
| Verified Replacement | 3.24, 3.25 |
| Periodic Reconciliation | 3.26 |
| Audit Queue | 3.27 |
| Receive New Items (four-step flow) | 3.30–3.34 |

### WIL Lab Custodian Portal

| Screen | SRS figure |
|---|---|
| Dashboard | 3.37 |
| Supply Requisition | 3.6 |
| Turnover Scan (match + mismatch) | 3.11, 3.12 |
| Report Incident | 3.19 |
| Lab Inventory | 3.14 |
| Work Orders | 3.20 |

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

The screens were audited against `Draf SRS.pdf` and updated to satisfy the blocking/major
requirements. Key implemented behaviour:

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

**Figure 3.38 phone screens and phone-width layout are not included.** This build targets desktop
web. If the panel requires the phone deliverable, it remains the one open SRS item.

### SRS-internal conflicts resolved in this prototype

- Ledger expanded to 28 units so every unit referenced by the dashboard, replacement, lab-inventory
  and reconciliation screens exists (FR-3.01 wins over Fig 3.17's 10-row count).
- Dashboard shows 8 audit flags, a 21-day PLA trigger, the Color toner row and `+62.5%` (Fig 3.3 /
  3.7 win over Fig 3.36).
- `ISSUED / IN_USE` is the canonical status token; "active" remains prose for the machine link.

---

## Data

Sample data only, held in memory. Refreshing a page resets it. The canonical copy for backend seeding
is `docs/SEED-DATA.json`.

- 28 ledger units, including every asset referenced across the screens.
- 10 audit flags: 8 reviewable + 2 variance anomalies routed to Requisition Review.
- 5 keyboards received under `DR-118` (`KB-0150`–`KB-0154`).
- 2 replacement candidates in stock with clean issue history.

---

## Known limitations

- No real QR camera; scan buttons simulate the result.
- Print/download actions show prototype toasts.
- No persistence, authentication or role enforcement.
- The QR SVG paths log a harmless pre-render placeholder warning on three screens.
- Phone screens and phone-width layout are out of scope.

---

## Tech

- HTML pages using the exported design-component runtime (`support.js` + `vendor/react*.js`).
- No package manager, no build step, no backend.
- Inter typeface (Google Fonts), Wildcat butter/amber/ink palette.

---

## GitHub Pages

The repo root has an `index.html` that redirects to `design/index.html`, so the Pages root works:

1. Settings → Pages → Deploy from branch.
2. Branch `main`, folder `/ (root)`.
3. Open `https://<username>.github.io/<repo>/`.

---

## Repository

<https://github.com/Pochyy/EduAsset>

Capstone project — IT332, CIT-U.
