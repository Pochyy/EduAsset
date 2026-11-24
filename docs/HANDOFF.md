# Session Handoff — React Vertical Slice

**Date:** 24 November 2026
**React code:** `e70eee4` — fast-forward from `f595110`
**Main:** React slice `e70eee4` plus the visual pass, all 17 screens and handoff docs
**Branches preserved:** `feat/react-tailwind` at `e70eee4`; `design/precision-pass`; `feat/lab-readonly`; `feat/lab-actions`; `feat/central-review`; `feat/central-assets`; `feat/final-portal`
**Static design branch:** `design/wildcat-theme` at `f595110`
**Read this first, then:** `README.md`, `PRODUCT.md`, `DESIGN.md`, `docs/SCREEN-MAP.md`,
`docs/API-CONTRACT.md`, `docs/SEED-DATA.json`.

---

## Where the project stands

| Item | State |
|---|---|
| React + Tailwind app | `main` plus all 17 screens; app shell working |
| React screens implemented | **17 of 17** — full Central and Lab portals |
| React placeholder routes | **0** |
| Static design reference | **17 of 17** approved screens under `design/` |
| Backend / API wiring | Not started |
| Auth | Mock only, persisted in `localStorage` |
| Production build | Passing; `dist/design/` gets the static reference |

> **Important:** all 17 screens are ported to React, but the app is still a front-end prototype. No
> backend, database, real auth or API wiring exists yet. Do not describe the system as
> production-complete until the API contract is implemented and tested.

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
- `src/data/seed.ts` — imports `docs/SEED-DATA.json`.
- `src/context/AppDataContext.tsx` — shared in-memory store for units, items, requisitions,
  turnovers, work orders and audit flags. Actions cover add/status changes, requisition decisions,
  turnover release (old unit returned, new unit issued), work-order creation, audit add/review,
  unit/item patches, bulk unit intake and item creation.
- `src/data/counts.ts` — queue counts derived from the store; the sidebar consumes them.
- `src/data/dashboard.ts` — KPIs, tasks, health, outlook, activity.
- `src/data/reorder.ts` — forecast rows and burn-rate/day-to-depletion helpers.
- `src/context/AuthContext.tsx` — mock login, portal/role mapping, `localStorage` persistence.
- `src/context/ToastContext.tsx` — accessible toasts; clears on route change.
- `src/lib/lab.ts` — lab inventory/machine selectors, status labels, dates and peso formatting.
- `src/lib/utils.ts` — `cn`, portal labels/home, role labels, initials.
- `src/lib/usePageTitle.ts` — per-screen document titles.

### UI system

`src/components/ui/`: Button, Card, Badge, Field/Input/Select/Textarea, Dialog, Table primitives,
Tabs, MetricStrip, EmptyState, PageHeader. `src/components/brand/Logo.tsx` holds the approved SVG mark.

### Shell

- `AppShell` with sticky 72px top bar, 264px butter sidebar, 1200px content column, skip link,
  mobile drawer with overlay/Escape/body lock.
- `Sidebar` with stage groups (Demand, Turnover, Units & assets, Intake), rust labels, amber count
  pills, white active surface and 3px amber leading bar.
- `TopBar` with portal label, prototype pill, alert count, user pill, sign out.
- Nav counts live in `src/components/layout/nav.ts` and are driven by `useQueueCounts()` from the
  shared store.

### Screens

**Login** (`/login`)
- Split butter/paper layout, portal cards, inline validation, password reveal, demo credentials note,
  `main` landmark, automatic portal hand-off.

**Central Dashboard** (`/central/dashboard`)
- Four-metric signal strip, action list, 4-state equipment health (stacked bar + percentage legend),
  depletion outlook table, audit-log activity. Cards stack until `xl` so tables never squeeze at 1024.
- Status shown as `ALERT` + `PR drafted` or `OK` (no color-only meaning).

**Reorder Alerts** (`/central/alerts`)
- Four-metric summary strip, All/At-trigger/OK tabs, table with stock, burn rate, days left, trigger,
  status.
- Recalculate with loading skeleton and toast.
- PR dialog with eight fields, projected demand and requested quantity.
- Per-item forecast settings dialog with custom validation (lead 14–21, buffer 0–30), live trigger
  preview, and recalculation after save.
- Empty state and tab counts.

**Lab Dashboard** (`/lab/dashboard`)
- Three amber quick actions, machine/active-consumable columns, latest requisitions and open work
  orders. Data comes from the shared store and lab selectors.

**Lab Inventory** (`/lab/inventory`)
- Machines / Consumables / Peripherals tabs, live search, status badges, machine-linked units and a
  responsive table. Uses the approved five machine, four consumable and four peripheral records.

**Work Orders** (`/lab/work-orders`)
- Open/Closed tabs with counts, four-step progress per order, quote/BER notes and empty state.
  Reuses the seed work orders and status vocabulary.

**Supply Requisition** (`/lab/requisition`)
- Item/quantity form with live variance against the lab baseline, three-band policy, required
  justification in the elevated band and add-to-store submission. New requests appear in the history
  panel and, when locked, in the Central queue count.

**Report Incident** (`/lab/incidents`)
- Asset scan/type, defect/jam/broken choice, recurring flag, description and simulated photo.
- Confirmation dialog, validation, work-order creation and `NEEDS_MAINTENANCE` update for recurring
  defects. New work orders appear on the dashboard and Work Orders list.

**Turnover Scan** (`/lab/turnover`)
- Machine/active/new-unit context, dark viewfinder, ID entry and demo scans.
- Match/mismatch banners, result details, scan audit trail, unit status update and turnover readiness
  for Central approval.

**Requisition Review** (`/central/requisitions`)
- Locked / Justified / Auto-processed / Decided queues with live counts.
- Review dialog with baseline/current/variance, approve/reject decision, required rejection reason
  (≥ 10 characters) and audit note. Decisions move the row and update sidebar/dashboard counts.

**Turnover Approval** (`/central/turnover`)
- Ready / Awaiting scan / Released states, three-step verification timeline and a disabled release
  path until the spent unit is scanned.
- Release confirmation updates the old unit to RETURNED_EMPTY, adds/updates the new unit as
  ISSUED / IN_USE, links it to the machine and logs the decision.

**Master Ledger** (`/central/ledger`)
- All 28 units with search, category and inventory-status filters, status/health badges and a
  right-side unit drawer.
- QR label, eight record fields, editable serial, item-level 1-to-1 setting and a generated history
  trail. Serial and flag changes write through the store.

**Reconciliation** (`/central/reconciliation`)
- Room selection, schedule copy, scan-session progress, expected-unit table, unexpected-unit alert
  and matched/missing/unexpected result.
- Discrepancies create a real audit flag; clean sessions do not.

**Audit Queue** (`/central/audit`)
- Suspicious patterns, rejected attempts, dormant assets, reconciliation, variance and reviewed tabs
  with live counts.
- Review flow with a required ≥10-character note; reviewed flags move to Reviewed and decrease the
  sidebar/dashboard count. Variance anomalies route to Requisition Review instead.

**Repair & BER** (`/central/repairs`)
- Durable asset selector with cumulative repair/BER meters, repair ledger, quote entry and
  repairable/not-repairable decision.
- Below 50% approves repair and moves the unit to UNDER_REPAIR; 50%+ blocks maintenance and offers
  condemnation. Condemnation generates the pre-filled CD-2026-0019 form and retires the unit.

**Verified Replacement** (`/central/replacements`)
- RR-0043 flow with old-unit scan, new-unit candidates, four validation rules, photo evidence and a
  required second approver.
- Valid submissions move to a pending second-person step, then complete: old unit RETIRED, new unit
  ISSUED / IN_USE. Invalid attempts can be logged and become a real audit flag.

**Receive New Items** (`/central/receive`)
- Four-step intake: delivery record → photo/AI suggestion or manual → confirm name/category/quantity
  and 1-to-1 flag → printable QR sheet.
- Saves new item and unit records to the shared store; generated units appear in the Master Ledger.
  Simulated AI failure has a manual fallback.

No placeholder routes remain.

### Visual precision pass

A visual-only pass refined the implemented surfaces without changing routes, data, copy or behaviour:

- Replaced four cloned KPI cards on Dashboard and Reorder Alerts with a shared `MetricStrip`: one
  bordered surface divided by hairlines, ink values and rust CTAs.
- Flattened table framing (no bordered table inside a bordered card), tightened card-title type to
  15px and H1 to 30px, and simplified sidebar group labels to stage names.
- Reworked equipment health into a four-row percentage legend with a derived “units need
  maintenance or repair” line.
- Changed warning health marks from brand amber to the semantic ochre `--warning` token.
- Quieted the Login demo note to a left-rule footnote and calmed placeholder pages to an inline icon,
  checklist and footer line.
- Added a 160ms dialog entrance with reduced-motion support.
- Removed the unused `StatCard` component.

### Routing and guards

- `HashRouter` for static hosting; `base: './'` so the build works under a project subpath.
- `RequireAuth` sends signed-out users to `/login` and cross-portal users to their own dashboard.
- Portal index routes redirect to the dashboard.
- `NotFound` for unknown hashes.
- `npm run build` runs `tsc --noEmit`, Vite build, then `scripts/copy-design.mjs` to copy `design/`
  into `dist/design/`.

---

## Verification record

- `npm run build` passes on the final-portal branch and on `main` after merge.
- Production preview serves the app, relative JS/CSS, and `/design/` with no console errors.
- Re-verified after the visual precision pass: login, forecast recalculation, settings validation and
  save, route guards and mobile drawer still behave exactly as before.
- Read-only Lab batch: Dashboard, Inventory and Work Orders tested at 1440 and 390; inventory tabs
  and search, work-order Open/Closed tabs and progress all work; sidebar counts come from the store.
- Lab actions: submitting an elevated requisition produced RQ-1023 (`PROCESSED` with justification);
  an abnormal +450% request produced RQ-1024 (`WAITING FOR CUSTODIAN`). Reporting a broken item
  produced WO-0032 and incremented the open work-order count; a correct turnover scan set
  FIL-WIL-2026-014 to `RETURNED_EMPTY` and prepared the turnover for Central approval.
- Central decisions: rejecting RQ-1022 without a reason showed the ≥10-character error; with a reason
  it moved to Decided and reduced the locked queue/nav count. Approving RQ-1021 emptied the locked
  queue. Requisition and turnover KPI counts on the dashboard updated to 0.
- Turnover approval: releasing TNR-WIL-2026-002 moved the card to RELEASED, made the new unit
  ISSUED / IN_USE on WIL-PRN-01 and removed the queue badge. The awaiting-scan card kept its release
  button disabled. Dashboard actions dropped from 5 to 3 open items after both decisions.
- Master Ledger: 28 rows loaded; search narrowed to KB-0152; the drawer showed the QR, eight fields
  and history. Serial `TEST-SERIAL-152` and the item 1-to-1 flag both saved through the store.
- Reconciliation: 4 of 8 expected units plus KB-0099 scanned; the result showed 4 matched, 4 missing,
  1 unexpected, created an audit flag and raised the Audit Queue count to 9. Variance flags have no
  review action.
- Audit Queue: the review note required ≥10 characters; saving moved the flag to Reviewed and reduced
  the queue count to 8. The dashboard audit summary now derives its breakdown from live flags.
- Repair & BER: selecting WIL-3DP-002 with a ₱5,000 quote produced 55.3% BER and blocked
  maintenance; condemnation retired the unit and generated CD-2026-0019.
- Receive New Items: DR-118 → photo → AI keyboard suggestion → quantity 2 → saved KB-0155 and
  KB-0156; both appeared in Master Ledger search. QR labels rendered.
- Verified Replacement: KB-0152 passed all four rules, went through second-approver confirmation,
  completed as KB-0007 → KB-0152, and the progress steps stayed green after the store updated.
- Lighthouse on all 17 screens: **Accessibility 100 · Best Practices 100 · SEO 100**.
- 18-route sweep across all Central/Lab routes and index redirects: every route renders one `h1`,
  no `Page not found`, no runtime exceptions, no page-level horizontal overflow.
- Checked at 1440 and 390 px. At 390 the page does not overflow; dense tables scroll inside their own
  wrapper. Phone layout remains out of SRS scope.
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

Screen parity is complete. The remaining work is production hardening, not porting.

### 1. Backend/API
- Implement `docs/API-CONTRACT.md` in Spring Boot + MySQL.
- Replace the `AppDataContext` mock store with query/mutation hooks; keep the same screen-facing
  actions so the UI does not need a redesign.
- Wire real auth and server-side role enforcement. The current portal guards are client-side only.
- Move AI intake to the backend; the API key must never reach the client.
- Persist audit events and enforce the append-only rules in the contract.

### 2. Automated tests
- Add Vitest + React Testing Library.
- Unit-test the store reducer (requisition decisions, turnover release, unit patches, intake).
- Flow-test login, intake, replacement, audit review and repair condemnation.
- Keep the 1440/390 + Lighthouse checks in the definition of done.

### 3. Deployment
- Build and publish `dist/`, which includes the static reference at `dist/design/`.
- Configure GitHub Pages (or another static host) and verify hash deep links.

### Optional UX work
- Add a full focus trap/focus restore to dialogs/drawers.
- Add a true camera/QR reader when the backend/media layer exists.
- Phone screens (Figure 3.38) remain out of scope by owner decision.

### Regression checklist for future changes

- All 17 routes are implemented; do not reintroduce a placeholder route.
- Data uses `docs/SEED-DATA.json` or a screen-specific module; no invented contradictory numbers.
- SRS behaviours, validation and dialogs are preserved from the static reference.
- 44px targets, visible labels, keyboard operation, AA contrast, status not conveyed by color alone.
- `npm run build` passes; screen checked at 1440 and 390; no page-level overflow or console errors.
- README status table and `docs/SCREEN-MAP.md` updated.
- Sidebar counts updated only when the underlying data changes.
- Use `AppDataContext` dispatch for state changes so queue counts stay consistent.

### Do not

- Do not edit `design/` to make a React problem go away; it is the approved reference.
- Do not change copy, seed data, routes or SRS logic without an SRS reason.
- Do not add new colors, fonts, gradients, glass or decorative kickers.
- Do not reintroduce four cloned KPI cards where a `MetricStrip` belongs.
- Do not put a bordered table inside a bordered card; the card is the only frame.
- Do not add a backend or client-side AI key; AI runs server-side per the SRS/API contract.
- Do not describe the system as production-complete while the API, persistence and auth are mocked.

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

- All 17 screens are ported; there are no UI placeholders left.
- `AppDataContext` actions are used end-to-end for requisitions, incidents, turnover scans,
  Central decisions, ledger edits, 1-to-1 settings, reconciliation flags, audit reviews, repair/BER,
  replacement and intake.
- Dialog has Escape/overlay close and initial focus, but no full focus trap or focus restore.
- No unit/component tests, ESLint or Prettier yet.
- No service layer or API wiring; `docs/API-CONTRACT.md` is the contract.
- Mobile tables scroll horizontally; phone-width layout is explicitly out of scope.
- The seed's `Property Custodian` user makes the top-bar name and role look duplicated; cosmetic,
  data-driven, not worth faking.
- Scanner/print/download actions remain simulated until the backend exists.

---

## Repo state at handoff

- `main` = React slice `e70eee4` plus all 17 screens and handoff docs; use `git log -1` for the
  current tip.
- `feat/react-tailwind` = `e70eee4` (retained for reference).
- `design/precision-pass` = visual precision pass (retained for comparison).
- `feat/lab-readonly` = Lab Dashboard, Lab Inventory, Work Orders batch (retained).
- `feat/lab-actions` = Supply Requisition, Report Incident, Turnover Scan batch (retained).
- `feat/central-review` = Requisition Review, Turnover Approval batch (retained).
- `feat/central-assets` = Master Ledger, Reconciliation, Audit Queue batch (retained).
- `feat/final-portal` = Repair & BER, Verified Replacement, Receive New Items batch (retained).
- `design/wildcat-theme` = `f595110` (approved Wildcat design branch).
- `design/` is unchanged and still contains all 17 approved screens plus the launcher.
- Working tree is clean; `dist/`, `node_modules/` and `.opencode/` are gitignored.
