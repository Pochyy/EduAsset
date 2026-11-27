# Revision 2 Delta — Pass 1: Foundation + Module 1

**Date:** 27 November 2026
**Branch:** `feat/srs-v2-update`
**Sources:** `EduAsset_SRS_Revised.docx` (SRS v2), `EduAsset_SDD_Revised.docx`
**Status:** Pass 1 complete. Modules 2–4 and the responsive/print/camera work remain pending.

This file records what changed, why it changed, and which parts are UI placement choices rather than SRS requirements. It is the audit trail for the revision-2 work.

---

## Scope of this pass

- Canonical inventory-status foundation (`IN_USE`; `RETURNED_PARTIAL` recognised).
- Term calendar and policy settings foundation.
- Module 1: consumable demand forecasting and consumption variance.
- No new routes or screens. All additions are in existing screens, cards and dialogs.

Not in this pass: machine slots, lots, partial-return actions, turnover exceptions, condemnation recommendation/override, BER threshold UI, dormancy policy, lot intake, print/camera implementation, phone navigation. Those belong to Modules 2–4 and the shell pass.

---

## Requirement mapping

| Requirement | What was added | Where |
|---|---|---|
| **FR-1.03** — BR = max(BR_w, BR_season); 42-day low-volume window | Forecast rows now carry 14-day and 42-day issuance counts and last-term history. BR uses the configured low-volume threshold to choose 14/42 days, and BR_season = last-term issues ÷ (lead + buffer). | `src/data/reorder.ts`, Reorder Alerts |
| **FR-1.04** — no recent use when BR = 0 | `BR = 0` renders **No recent use** for D and a neutral **NO RECENT USE** status. No PR is offered. | Reorder Alerts |
| **FR-1.05** — configurable L_procure, S_buffer and window lengths | Per-item settings still edit lead time and safety buffer. A shared Policy Settings dialog now edits the standard/low-volume windows and the low-volume issue threshold. | `src/components/PolicySettingsDialog.tsx`, Reorder Alerts, Requisition Review |
| **FR-1.08** — dashboard lists stock, BR, D and alert status | Table keeps the required columns and adds the BR basis under the BR value. | Reorder Alerts |
| **FR-1.10** — pro-rated variance | `E = H_base × weeks elapsed ÷ weeks in term`; `V = (C_t − E) ÷ E × 100`. Lab Requisition shows Hbase, expected-at-week, current and V. Requisition Review shows expected → current. | `src/screens/LabRequisition.tsx`, `src/screens/RequisitionReview.tsx` |
| **FR-1.11 / FR-1.12** — normal and elevated bands | Bands use the policy values instead of hardcoded 25/50. Elevated still requires a justification. | Lab Requisition |
| **FR-1.13 / FR-1.14** — abnormal lock and Custodian decision | Existing lock/review/decision flow retained; variance is now nullable for no-baseline requests. | Requisition Review |
| **FR-1.15** — no-baseline manual review | `H_base = 0` produces **NO_BASELINE**, no V, and a locked request in collect-baseline mode. Approve/reject still records the Custodian decision. | Lab Requisition, Requisition Review |
| **FR-1.16** — configurable bands and term report | Policy Settings edits the normal/lock bands. Requisition Review adds a **Term variance review** card showing flagged, confirmed (approved), rejected and pending counts. | Policy Settings, Requisition Review |
| **SRS §1.3 / FR-3.08** — inventory status vocabulary | Canonical token is now `IN_USE`; `RETURNED_PARTIAL` is recognised with a warning badge. The actual partial-return flow is deferred to Module 2. | `src/types.ts`, `src/lib/lab.ts`, seed data and existing screens |
| **SDD §5.1** — computed values stored at decision time | New requisitions store `expectedVolume`, `variancePercent`, `band`, `weeksElapsed` and `weeksInTerm`. | `src/types.ts`, Lab Requisition |
| **SDD `policy_setting`** | The mock store now carries policy values and a `policy/update` action. | `src/context/AppDataContext.tsx` |

---

## Data and seed changes

- `src/types.ts`
  - `VarianceBand`, `PolicySettings`, `TermCalendar`.
  - `SeedRequisition` now includes `expectedVolume`, `band`, `weeksElapsed` and `weeksInTerm`; `variancePercent` can be `null`.
  - `SeedData` now includes `term` and `policy`.
- `docs/SEED-DATA.json`
  - Term is week 10 of 16.
  - Policy defaults: 25% normal, 50% lock, 14-day standard window, 42-day low-volume window, fewer than 3 issues triggers the low-volume window.
  - Added **Thermal paper roll** (`THRM`), which has no historical baseline.
  - Added **RQ-1023** (Thermal paper roll, 6 rolls, `NO_BASELINE`, locked).
  - Recomputed seed variances against the pro-rated expected volume:
    - RQ-1021 A4: +700.0%
    - RQ-1022 PLA: +160.0%
    - RQ-1019 TNR: +40.0%
    - RQ-1017 CTN: +10.0%
    - RQ-1016 DRM: −20.0%
  - Updated the two variance anomaly flags to the new percentages and pro-rated detail.
  - Replaced `ISSUED_IN_USE` with `IN_USE` and updated the display note.
- `src/context/AppDataContext.tsx`
  - Adds `term` and `policy` to the shared store, a `policy/update` action, and the forecast rows with a
    `forecast/update` action. Per-item lead/buffer changes now update the sidebar and dashboard alert
    count immediately.
- `src/data/counts.ts`
  - Derives the alert count from the shared forecast rows and policy instead of the static initial list.
- `src/data/reorder.ts`
  - 14/42-day issuance history, last-term history, BR_w/BR_season, basis label and nullable days-to-depletion.
- `src/lib/lab.ts`
  - `IN_USE` and `RETURNED_PARTIAL` display handling.
  - `formatVariance` accepts `null` and renders `—`.
  - Requisition catalog baselines and current usage aligned with seed H_base; thermal paper added.
- `src/screens/CentralDashboard.tsx`
  - The depletion outlook table is now derived from the shared forecast rows and policy instead of
    static sample values.
- `src/screens/RequisitionReview.tsx`
  - Variance colour and surface follow the stored band, so existing decisions do not change colour
    when policy values change.
- `src/screens/LabRequisition.tsx`
  - Default TNR quantity is 2 so the seed history (5 used) and the 7-unit current term volume line up.

---

## UI placement choices (not specified by the SRS)

These are the design decisions made to expose required capabilities without adding screens:

1. **Policy Settings** is a shared dialog opened from Reorder Alerts and Requisition Review. The SRS requires configurable values but does not name a screen.
2. **Term variance review** is a card below the Requisition Review table. The SRS requires a per-term report but does not prescribe its placement.
3. **No-baseline requests stay in the existing Locked queue** with a distinct badge/note rather than adding a new tab. This keeps the SRS queue figure intact.
4. **BR basis** is shown as a small line under the BR value instead of adding a new table column.
5. **Forecast window lengths are global policy values**, while L_procure and S_buffer remain per-item settings. This follows FR-1.05; the SDD API wording is ambiguous about per-item vs global windows.
6. **Policy values are not yet audited** in the mock; the dialog says audit entries belong to the backend.

---

## Documentation touched

- `docs/SEED-DATA.json` — term, policy, THRM item, RQ-1023, pro-rated variances, IN_USE tokens.
- `docs/SCREEN-MAP.md` — Module 1 requirement mappings and seed counts.
- `docs/API-CONTRACT.md` — PostgreSQL/Supabase header, IN_USE/RETURNED_PARTIAL enum, forecast and
  requisition payloads, `GET/PUT /settings/policy`, term-report endpoint.
- `docs/REVISION-2-DELTA.md` — this record.

## Verification for this pass

- `npm run build` passes.
- 17 routes checked at 598 and 390: one `h1` each, no page-level horizontal overflow, no console errors.
- Lighthouse after the pass:
  - Central Dashboard: **Accessibility 100 · Best Practices 100 · SEO 100**
  - Reorder Alerts: **100 / 100 / 100**
  - Requisition Review: **100 / 100 / 100**
  - Lab Supply Requisition: **100 / 100 / 100**
- Flow checks:
  - Default TNR requisition (quantity 2) shows Hbase 8, expected 5 at week 10, current 7, V +40% (elevated).
  - Thermal paper shows no baseline, `V = —`, and routes to locked manual review.
  - Submitting thermal paper created RQ-1024 with `NO_BASELINE` and `LOCKED_REVIEW`.
  - Submitting TNR with a justification created RQ-1025 as processed with justification.
  - Rejecting RQ-1023 with a ≥10-character reason moved it to Decided and updated the term report to 3 flagged / 0 confirmed / 1 rejected / 2 pending.
  - Policy validation rejected normal 60 / lock 50; saving 21/60 windows changed the BR basis and forecast values.
  - Saving the 21/60 policy windows reduced the Reorder Alerts count and the sidebar count from 3 to 1,
    proving the shared-store recalculation path.
  - Editing the TNR lead/buffer changed its trigger from 28 to 14 days and updated the row immediately.
  - PR dialog shows BR basis, BR_w/BR_season, days to depletion and requested quantity.
  - The Central Dashboard depletion outlook updated when the policy/forecast changed.

## Known limits

- The mock policy values reset on a page reload; there is no persistence yet.
- The full audit log is not implemented; policy changes are only described as auditable.
- `RETURNED_PARTIAL` is recognised but no partial-return action exists until Module 2.
- Machine slots, lots, condemnation decisions, print and camera remain in later passes.
- Requisition status tokens remain the existing app tokens (`AUTO_PROCESSED`, `LOCKED_REVIEW`).
  The SDD uses `PROCESSED`/`LOCKED`; the API mapping is documented and will be normalised in the final
  pass if required. This is a token mismatch, not a behaviour change.
- The SDD route table and frontend folder structure still describe a different layout. The app keeps
  its working routes; the SDD will be corrected in the docs pass.
- No SRS/SDD source document was edited.
