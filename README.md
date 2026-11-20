# EduAsset — Front-End Prototype

**Institutional Property Custodianship & Predictive Inventory System** for the WildCat Innovation
Labs (WIL) and the CIT Property Office.

This repository contains the **17 high-fidelity desktop screens** specified in the EduAsset SRS
(Figures 3.3–3.37), exported as a self-contained, clickable prototype.

> **This is a design reference, not production code.**
> There is no backend, no database, no authentication and no persistence. Data is sample data held in
> memory. A production build still needs React components wired to the Spring Boot API and MySQL, as
> required by the SRS.

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

Each screen lives in its own folder next to a shared `Sidebar.dc.html` and `TopBar.dc.html`.

---

## Run locally

Serve the **repository root** — not an individual folder, and not `file://`. Navigation uses
`../<folder>/<screen>` paths, so the root is what makes every link work.

```powershell
cd path\to\EduAsset
python -m http.server 8000
```

or with Node:

```bash
npx serve .
```

Then open one of the entry points:

- **Login** — <http://localhost:8000/Login/Main.dc.html>
- **Central Dashboard** — <http://localhost:8000/Central%20%C2%B7%20Dashboard/C-Dashboard.dc.html>
- **Lab Dashboard** — <http://localhost:8000/Lab%20%C2%B7%20Dashboard/L-Dashboard.dc.html>

Stop the server with `Ctrl+C`.

### Demo sign-in

1. Choose **Central Property** or **WIL Lab**.
2. Enter any valid-format email and any password with 8+ characters.
3. Click **Sign in**, then **Open … Portal**.

No credentials are checked.

---

## Navigation

- Sidebar: every Central/Lab screen, grouped by module.
- Top bar: home, alerts and sign-out.
- Breadcrumbs and in-page actions (`View PR`, `Open RR-0043`, `Track work orders`, etc.).
- Login hands off to the selected portal.

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

Sample data only, held in memory. Refreshing a page resets it.

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
- Inter typeface (Google Fonts), CIT-U maroon/gold palette.

---

## Repository

<https://github.com/Pochyy/EduAsset>

Capstone project — IT332, CIT-U.
