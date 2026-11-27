# Screen Map

Where each prototype screen lives, which SRS figures it implements, and what it exercises. Use this
with `docs/API-CONTRACT.md` and `docs/SEED-DATA.json`.

**React implementation:** all 17 screens are ported. The app shell, both dashboards, demand and
turnover decisions, ledger/audit tools, repair/BER, verified replacement, intake and the complete Lab
portal are live routes. The static reference remains under `design/` for visual comparison. Revision 2
is being applied module by module; passes 1–3 cover the foundation, forecasting/variance, turnover
and unit lifecycle. See `docs/REVISION-2-DELTA.md` and `docs/HANDOFF.md`.

| # | Screen | File | Figures | Primary requirements | Main actions |
|---|---|---|---|---|---|
| 1 | Sign in | `design/screens/login.dc.html` | 3.35 | NFR-S1, NFR-S2, NFR-U3 | Portal choice, inline validation, portal hand-off |
| 2 | Central Dashboard | `design/screens/central-dashboard.dc.html` | 3.36 | §3.3.1, module overview | Queue cards, action list, depletion outlook, audit activity |
| 3 | Reorder Alerts | `design/screens/central-reorder-alerts.dc.html` | 3.3, 3.4, 3.5 | FR-1.02–FR-1.08 | Recalculate, filter tabs, view PR, edit L/S with validation, policy windows, BR basis and no-recent-use state |
| 4 | Requisition Review | `design/screens/central-requisition-review.dc.html` | 3.7, 3.8 | FR-1.11–FR-1.16 | Queue tabs, pro-rated expected volume, no-baseline badge, approve/reject, rejection reason ≥ 10 chars, policy settings, term report |
| 5 | Turnover Approval | `design/screens/central-turnover-approval.dc.html` | 3.13 | FR-2.04, FR-2.07, FR-2.08, FR-2.10 | Verify `RETURNED_EMPTY`/`RETURNED_PARTIAL` gate, approve first-install/defective exceptions, release into a machine slot |
| 6 | Master Ledger | `design/screens/central-master-ledger.dc.html` | 3.17, 3.18 | FR-3.01–FR-3.08, FR-3.24, FR-3.28 | Search/filter, serial edit, 1-to-1 flag, reprint QR, history, low-value lots |
| 7 | Repair & BER | `design/screens/central-repair-ber.dc.html` | 3.21, 3.22, 3.23 | FR-3.13–FR-3.17, FR-3.29 | Quote, configurable BER, approve repair, return to service, recommendation/approve/override, printable form |
| 8 | Verified Replacement | `design/screens/central-verified-replacement.dc.html` | 3.24, 3.25 | FR-3.18–FR-3.25, UC-3.6 | Old/new scan, four rules, photos, second approver, rejection log |
| 9 | Reconciliation | `design/screens/central-reconciliation.dc.html` | 3.26 | FR-3.26 | Schedule, room scan, missing/unexpected, finish + queue hand-off |
| 10 | Audit Queue | `design/screens/central-audit-queue.dc.html` | 3.27 | FR-2.10, FR-3.25, FR-3.27 | Type tabs including turnover exceptions, review note, reviewer/timestamp |
| 11 | Receive New Items | `design/screens/central-receive-items.dc.html` | 3.30–3.34 | FR-4.01–FR-4.10, FR-3.01–FR-3.04 | DR/PO link, photo + AI, manual fallback, quantity, QR sheet |
| 12 | Lab Dashboard | `design/screens/lab-dashboard.dc.html` | 3.37 | §3.3.1, FR-2.09 | Quick actions, installed consumable per machine slot, requisitions, work orders |
| 13 | Lab Inventory | `design/screens/lab-inventory.dc.html` | 3.14 | FR-2.01, FR-2.09, FR-2.11, FR-3.28 | Machines/consumables/peripherals/lots, active unit per slot, partial-spool re-issue, lot quantity issue |
| 14 | Report Incident | `design/screens/lab-report-incident.dc.html` | 3.19 | FR-3.10, FR-3.11 | Scan, type, recurring flag, description, required photo |
| 15 | Supply Requisition | `design/screens/lab-supply-requisition.dc.html` | 3.6 | FR-1.01, FR-1.09–FR-1.12, FR-1.15 | Quantity, pro-rated expected volume, live variance, justification in the elevated band, no-baseline manual review |
| 16 | Turnover Scan | `design/screens/lab-turnover-scan.dc.html` | 3.11, 3.12 | FR-2.03–FR-2.06, FR-2.10, FR-2.11 | Slot selector, spent-unit scan, partial return, mismatch log, first-install/defective exception request |
| 17 | Work Orders | `design/screens/lab-work-orders.dc.html` | 3.20 | FR-3.12 | Open/closed tabs, progress, BER decision |

## Shared data used by the screens

- 28 units, including every asset referenced by the dashboard, replacement, lab-inventory and
  reconciliation screens.
- 7 machine slots for 1-to-1 consumables (Black/Drum/Spool).
- 2 low-value consumable lots (A4 paper, thermal paper) issued by quantity.
- 1 seeded condemnation recommendation for WIL-3DP-002.
- 10 audit flags: 8 reviewable + 2 variance anomalies routed to Requisition Review.
- 6 audit-log entries plus live turnover/requisition/repair/policy events.
- 6 requisitions, 3 turnovers and 3 work orders.
- 15 item definitions with lead time, safety buffer, replacement value and 1-to-1 policy.
- Term calendar week 10 of 16 and revision-2 policy defaults (25/50 bands, 14/42-day windows).

Exact JSON: `docs/SEED-DATA.json`.

## Shared runtime

All 17 files live in `design/screens/` with **one** copy of:

- `Sidebar.dc.html`
- `TopBar.dc.html`
- `support.js`
- `vendor/react.js`, `vendor/react-dom.js`

Navigation uses simple sibling filenames (`central-audit-queue.dc.html`). There are no per-screen
copies and no folder-name encoding.
