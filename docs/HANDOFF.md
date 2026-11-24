# Session Handoff — React Vertical Slice

**Date:** 24 November 2026
**Main:** `85b11b1` — handoff docs on top of the React slice
**React code:** `e70eee4` — fast-forward from `f595110`
**Branch preserved:** `feat/react-tailwind` at `e70eee4`
**Static design branch:** `design/wildcat-theme` at `f595110`
**Read this first, then:** `README.md`, `PRODUCT.md`, `DESIGN.md`, `docs/SCREEN-MAP.md`,
`docs/API-CONTRACT.md`, `docs/SEED-DATA.json`.

---

## Where the project stands

| Item | State |
|---|---|
| React + Tailwind app | Merged to `main`; app shell and vertical slice working |
| React screens implemented | **3 of 17** — Login, Central Dashboard, Reorder Alerts |
| React placeholder routes | **14 of 17** — real shell, breadcrumbs and SRS notes |
| Static design reference | **17 of 17** approved screens under `design/` |
| Backend / API wiring | Not started |
| Auth | Mock only, persisted in `localStorage` |
| Production build | Passing; `dist/design/` gets the static reference |

> **Important:** the static reference is still the only complete 17-screen SRS artifact. The React
> app is a deliberate vertical slice. Do not describe the React app as SRS-complete until the 14
> placeholder routes are ported.

---

## What this session delivered

### Foundation

- Vite 8 + React 19 + TypeScript + React Router 7 + Tailwind CSS 4 + lucide-react.
- Wildcat design tokens in `src/index.css` using Tailwind 4 `@theme` (`bg-butter`, `text-rust`,
  `bg-amber`, `rounded-card`, `rounded-control`, `rounded-field`, semantic status tokens).
- Inter, global focus-visible ring, themed selection/scrollbars, tabular numerals, reduced-motion
  guards, `#root` sizing.

### Shared application layer

- `src/types.ts` — auth, seed and domain types.
- `src/data/seed.ts` — imports `docs/SEED-DATA.json` and derives queue counts.
- `src/data/dashboard.ts` — KPIs, tasks, health, outlook, activity.
- `src/data/reorder.ts` — forecast rows and burn-rate/day-to-depletion helpers.
- `src/context/AuthContext.tsx` — mock login, portal/role mapping, `localStorage` persistence.
- `src/context/ToastContext.tsx` — accessible toasts; clears on route change.
- `src/lib/utils.ts` — `cn`, portal labels/home, role labels, initials.
- `src/lib/usePageTitle.ts` — per-screen document titles.

### UI system

`src/components/ui/`: Button, Card, Badge, Field/Input/Select/Textarea, Dialog, Table primitives,
Tabs, StatCard, EmptyState, PageHeader. `src/components/brand/Logo.tsx` holds the approved SVG mark.

### Shell

- `AppShell` with sticky 72px top bar, 264px butter sidebar, 1200px content column, skip link,
  mobile drawer with overlay/Escape/body lock.
- `Sidebar` with module groups, rust labels, amber count pills, white active surface and 3px amber
  leading bar.
- `TopBar` with portal label, prototype pill, alert count, user pill, sign out.
- Nav/alert counts centralised in `src/components/layout/nav.ts`.

### Screens

**Login** (`/login`)
- Split butter/paper layout, portal cards, inline validation, password reveal, demo credentials note,
  `main` landmark, automatic portal hand-off.

**Central Dashboard** (`/central/dashboard`)
- 4 KPI cards, action list, 4-state equipment health bar/cards, depletion outlook table, audit-log
  activity. Cards stack until `xl` so tables never squeeze at 1024.
- Status shown as `ALERT` + `PR drafted` or `OK` (no color-only meaning).

**Reorder Alerts** (`/central/alerts`)
- 4 summary cards, All/At-trigger/OK tabs, table with stock, burn rate, days left, trigger, status.
- Recalculate with loading skeleton and toast.
- PR dialog with eight fields, projected demand and requested quantity.
- Per-item forecast settings dialog with custom validation (lead 14–21, buffer 0–30), live trigger
  preview, and recalculation after save.
- Empty state and tab counts.

**14 placeholders** — Requisition Review, Turnover Approval, Master Ledger, Repair & BER, Verified
Replacement, Reconciliation, Audit Queue, Receive New Items, Lab Dashboard, Supply Requisition,
Turnover Scan, Report Incident, Lab Inventory, Work Orders. Each uses `ComingSoon`, real
breadcrumbs/shell, a short scope list and its static reference filename.

### Routing and guards

- `HashRouter` for static hosting; `base: './'` so the build works under a project subpath.
- `RequireAuth` sends signed-out users to `/login` and cross-portal users to their own dashboard.
- Portal index routes redirect to the dashboard.
- `NotFound` for unknown hashes.
- `npm run build` runs `tsc --noEmit`, Vite build, then `scripts/copy-design.mjs` to copy `design/`
  into `dist/design/`.

---

## Verification record

- `npm run build` passes on `main` at `e70eee4`.
- Production preview serves the app, relative JS/CSS, and `/design/` with no console errors.
- 18-route sweep across all Central/Lab routes and index redirects: every route renders one `h1`,
  no `Page not found`, no runtime exceptions, no page-level horizontal overflow.
- Lighthouse on Login and Central Dashboard:
  **Accessibility 100 · Best Practices 100 · SEO 100**.
- Checked at 1440, 1024 and 390 px. At 390 the page does not overflow; dense tables scroll inside
  their own wrapper. Phone layout remains out of SRS scope.
- Static reference still works standalone at `/design/` and is copied into the production build.

---

## Bugs and pitfalls already handled

Do not reintroduce these:

1. **Native validation blocking custom errors** — forms with custom messages use `noValidate`
   (Login, Forecast settings). `type="number"` min/max alone would suppress the React errors.
2. **Grid/table intrinsic width** — cards containing scrollable tables need `min-w-0`; `TableWrap`
   is `relative` with `overflow-x-auto`. Without this, a table sets the page width at 390/1024.
3. **`sr-only` inside a scroll container** — a non-positioned ancestor lets the absolute span escape
   and create page overflow. Keep `TableWrap` relative, or avoid `sr-only` spans in table headers.
4. **Toasts leaking across screens** — `ToastProvider` clears on `location.pathname` change.
5. **Logo link accessible name** — do not put an `aria-label` on the TopBar logo link; it overrides
   the visible wordmark/portal text (Lighthouse `label-content-name-mismatch`).
6. **Login landmark** — the split layout is a `<main>`; keep one main landmark per page.
7. **Login headline orphan** — H1 is capped at 40px with a 620px max width; don't raise it without
   checking the two-line break.
8. **Dashboard table at 1024** — two-column dashboard sections start at `xl`, not `lg`.
9. **Amber contrast** — amber surfaces always use ink text; never white on amber. Active tab counts
   stay white pills with ink text.
10. **Hash routing** — keep `HashRouter` unless a hosting rewrite/404 fallback is configured.

---

## Next work

### Recommended order

**Batch 1 — close Module 1 & 2**
1. Requisition Review (`central-requisition-review.dc.html`, SRS 3.7–3.8): queue tabs, live variance,
   approve/reject/lock, rejection reason ≥ 10 characters.
2. Turnover Approval (`central-turnover-approval.dc.html`, SRS 3.13): `RETURNED_EMPTY` gate, steps,
   release confirmation.

**Batch 2 — ledger and audit**
3. Master Ledger (`central-master-ledger.dc.html`, SRS 3.17–3.18): filters, unit record dialog,
   serial edit, 1-to-1 flag, QR reprint, history.
4. Reconciliation (`central-reconciliation.dc.html`, SRS 3.26).
5. Audit Queue (`central-audit-queue.dc.html`, SRS 3.27): tabs, review note, reviewer/time.

**Batch 3 — asset decisions**
6. Repair & BER (`central-repair-ber.dc.html`, SRS 3.21–3.23): quote, live BER, repair / return /
   condemn, pre-filled form.
7. Verified Replacement (`central-verified-replacement.dc.html`, SRS 3.24–3.25): old/new scan, four
   rules, photos, second approver, rejection log.

**Batch 4 — intake and lab**
8. Receive New Items (`central-receive-items.dc.html`, SRS 3.30–3.34): DR/PO, photo + AI fallback,
   staff quantity, QR sheet.
9. Lab Dashboard (`lab-dashboard.dc.html`, SRS 3.37).
10. Supply Requisition (`lab-supply-requisition.dc.html`, SRS 3.6).
11. Turnover Scan (`lab-turnover-scan.dc.html`, SRS 3.11–3.12).
12. Report Incident (`lab-report-incident.dc.html`, SRS 3.19).
13. Lab Inventory (`lab-inventory.dc.html`, SRS 3.14).
14. Work Orders (`lab-work-orders.dc.html`, SRS 3.20).

`docs/SCREEN-MAP.md` has the full figure → requirement → action mapping. Keep the same visual and
interaction patterns as the three ported screens; only introduce new components when a flow genuinely
needs them.

### Definition of done for each ported screen

- Route replaces its `ComingSoon` entry in `src/App.tsx`.
- Data uses `docs/SEED-DATA.json` or a screen-specific module; no invented contradictory numbers.
- SRS behaviours, validation and dialogs are preserved from the static reference.
- 44px targets, visible labels, keyboard operation, AA contrast, status not conveyed by color alone.
- `npm run build` passes; screen checked at 1440 and 390; no page-level overflow or console errors.
- README status table and `docs/SCREEN-MAP.md` updated.
- Sidebar counts updated only when the underlying data changes.

### Do not

- Do not edit `design/` to make a React problem go away; it is the approved reference.
- Do not change copy, seed data, routes or SRS logic without an SRS reason.
- Do not add new colors, fonts, gradients, glass or decorative kickers.
- Do not add a backend or client-side AI key; AI runs server-side per the SRS/API contract.
- Do not mark the React app complete while placeholders remain.

---

## Run and test

```powershell
cd "C:\School Files\IT332 - Capstone1\Inventory Management\Project Folder"
npm install
npm run dev
```

- App: <http://localhost:5173/#/login>
- Static reference in dev: <http://localhost:5173/design/>
- Any valid email + any 8+ character password signs in.
- Session key: `localStorage["eduasset.auth"]`; clear it to force the sign-in screen.

Production check:

```powershell
npm run build
npm run preview
```

`dist/` is gitignored; the static reference is copied in at build time. GitHub Pages is not configured;
if it is enabled, publish `dist/`, not the repository root.

---

## Known gaps and open decisions

- 14 screens are placeholders (the main remaining work).
- Dialog has Escape/overlay close and initial focus, but no full focus trap or focus restore.
- No unit/component tests, ESLint or Prettier yet.
- No service layer or API wiring; `docs/API-CONTRACT.md` is the contract.
- Mobile tables scroll horizontally; phone-width layout is explicitly out of scope.
- The seed's `Property Custodian` user makes the top-bar name and role look duplicated; cosmetic,
  data-driven, not worth faking.
- Scanner/print/download actions remain simulated until the backend exists.

---

## Repo state at handoff

- `main` = `85b11b1` (handoff docs); the React code slice is `e70eee4`.
- `feat/react-tailwind` = `e70eee4` (retained for reference).
- `design/wildcat-theme` = `f595110` (approved Wildcat design branch).
- `design/` is unchanged and still contains all 17 approved screens plus the launcher.
- Working tree is clean; `dist/`, `node_modules/` and `.opencode/` are gitignored.
