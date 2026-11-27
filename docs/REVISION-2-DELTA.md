# Revision 2 Delta — Pass 1: Foundation + Module 1

**Date:** 27 November 2026
**Branch:** `feat/srs-v2-update`
**Sources:** `EduAsset_SRS_Revised.docx` (SRS v2), `EduAsset_SDD_Revised.docx`
**Status:** Passes 1–3 complete. Module 4 and the responsive/camera work remain pending.

This file records what changed, why it changed, and which parts are UI placement choices rather than SRS requirements. It is the audit trail for the revision-2 work.

---

## Scope of Pass 1

- Canonical inventory-status foundation (`IN_USE`; `RETURNED_PARTIAL` recognised).
- Term calendar and policy settings foundation.
- Module 1: consumable demand forecasting and consumption variance.
- Module 2: machine slots, 1-to-1 turnover, partial returns and turnover exceptions.
- Shared live audit-log foundation for turnover, requisition and policy events.
- No new routes or screens. All additions are in existing screens, cards and dialogs.

Not in Pass 1: lots, condemnation recommendation/override, BER threshold UI, dormancy policy,
lot intake, print/camera implementation, phone navigation. Those belong to Modules 3–4 and the shell
pass. Pass 2 adds turnover; Pass 3 adds repair/lots/dormancy.

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

## Pass 2 — Module 2

### Requirement mapping

| Requirement | What was added | Where |
|---|---|---|
| **FR-2.01** — link a 1-to-1 unit to a machine slot | Added 7 machine slots, `slotId` on units, and slot-aware active-unit lookup. One `IN_USE` unit per slot is enforced by the data and UI. | `SEED-DATA.json`, `types.ts`, `lib/lab.ts`, Lab Inventory, Lab Dashboard, Turnover Scan/Approval |
| **FR-2.03 / 2.04 / 2.05 / 2.06** — request, scan and match the spent unit | Turnover Scan now selects a machine slot, reads the unit `IN_USE` in that slot, and accepts empty/partial returns. Mismatches stay locked and append to the live audit log. | LabTurnoverScan |
| **FR-2.07 / 2.08** — Custodian approval and release | Turnover Approval shows the slot, old return status and new unit; release assigns the new unit to the slot as `IN_USE`. | TurnoverApproval, AppDataContext |
| **FR-2.09** — machine-slot inventory | Lab Inventory shows every machine slot and its active unit; the Lab Dashboard shows each slot on the machine cards. Master Ledger adds a Machine slot field. | LabInventory, LabDashboard, MasterLedger |
| **FR-2.10** — turnover exceptions | Added first-install and defective-on-arrival exception requests with a required reason, `AWAITING_APPROVAL` turnover status, Custodian approval and a `TURNOVER_EXCEPTION` audit flag. | LabTurnoverScan, TurnoverApproval, AuditQueue |
| **FR-2.11** — partial filament return | Added a Returned empty/Returned partial choice for spool slots, `RETURNED_PARTIAL` storage, partial-spool display and a Re-issue action into an empty slot. | LabTurnoverScan, LabInventory, AppDataContext |
| **FR-3.24 / NFR-S2** — audit attribution | Added a shared append-only-in-the-UI audit log with seeded entries and live turnover/exception/release/requisition/policy events. | `types.ts`, `SEED-DATA.json`, AppDataContext, CentralDashboard |

### Data and seed changes

- Added `machineSlots`:
  - `PRN01-BLK`, `PRN01-DRM`, `PRN02-BLK`, `PRN02-DRM`, `3DP1-SPL1`, `3DP1-SPL2`, `3DP2-SPL1`.
- Added `slotId` to `SeedUnit`; `slotId` is nullable and cleared when a unit is returned.
- Added `oldStatus`, `slotId`, `exceptionType` and `exceptionReason` to `SeedTurnover`.
- Added `DRM-WIL-2026-005` as an `IN_STOCK` drum for the first-install/defective exception demo.
- Added `auditLog` with 5 seeded entries and `audit/log` to the shared store.
- Unit count is now **29**; machine-slot count is **7**.

### UI placement choices (not specified by the SRS)

1. **Exception request** lives on Turnover Scan when a slot is empty and has an eligible new unit.
   The SRS requires the exception, not a separate screen.
2. **Re-issue partial spool** lives in the Lab Inventory Consumables tab as a row action. The SRS
   requires later re-issue; it does not prescribe the control.
3. **Turnover exceptions** get a dedicated Audit Queue tab. The SRS requires them to be listed, not a
   specific tab.
4. **Machine slot** is shown as a second line in the Turnover Scan/Approval headers and as a
   per-slot list in the machine inventory.
5. **Prototype limitation:** the defective-on-arrival exception is modelled as an empty-slot
   exception with the defective unit recorded in the reason. The SDD backend can attach the
   defective unit record explicitly.
6. **Audit log:** the mock keeps an uneditable-in-the-UI array; server-side append-only enforcement
   remains a backend requirement.

### Verification for Pass 2

- `npm run build` passes after the Module 2 changes.
- Slot inventory loads without runtime errors.
- Partial spool flow:
  - FIL-WIL-2026-014 scanned as `RETURNED_PARTIAL` in `WIL-3DP-001/Spool-1`.
  - Custodian approved the release; FIL-WIL-2026-015 became `IN_USE` in `Spool-1`.
  - Lab Inventory showed FIL-014 as `RETURNED_PARTIAL` with a Re-issue action.
  - Re-issue installed FIL-014 in `Spool-2` as `IN_USE`; no new unit record was created.
- Turnover exception flow:
  - Created a defective-on-arrival exception for `WIL-PRN-01/Drum` with DRM-WIL-2026-005 and a
    required reason.
  - Turnover Approval showed `EXCEPTION AWAITING APPROVAL`, the reason and the new unit.
  - Approval released DRM-005 into `WIL-PRN-01/Drum`; the Audit Queue showed the
    `TURNOVER EXCEPTION` flag and the live audit log recorded the request/approval.
- Normal turnover:
  - TNR-WIL-2026-001 → RETURNED_EMPTY; TNR-WIL-2026-002 released into `WIL-PRN-01/Black`.
- Mismatch:
  - FIL-WIL-2026-009 in `3DP1-SPL1` produced a mismatch, left issuance locked and logged the attempt.
- 17 routes re-swept at 598 and 390 after Module 2: one `h1` each, no page-level overflow, no
  console errors.
- Lighthouse after Module 2: Central Dashboard, Turnover Approval and Audit Queue scored
  **100/100/100**; Lab Dashboard, Turnover Scan and Lab Inventory scored **100/100/100**.
- The live audit log showed the partial scan, release, exception request and release alongside the
  seeded entries.

## Pass 3 — Module 3

### Requirement mapping

| Requirement | What was added | Where |
|---|---|---|
| **FR-3.13 / 3.15** — repair log, approval, return to service | Repair quote and history remain; approval/return now use the configured threshold and write live audit entries. | RepairBer |
| **FR-3.14** — configurable BER threshold | `berThresholdPct` policy (default 50) drives every BER calculation, bar, label, form and work-order note. | PolicySettingsDialog, RepairBer, lib/lab |
| **FR-3.16** — recommendation, never auto-condemn | At/above threshold or not repairable, the system creates a `RECOMMENDED` condemnation record. It does not change the unit until the Custodian decides. | RepairBer, AppDataContext, seed |
| **FR-3.17** — pre-filled CIT form | The form uses the CIT Property Office label, form number, property tag, serial, location, replacement value, BER, threshold, decision and maintenance ledger. The placeholder PAR/ICS wording was removed. | RepairBer |
| **FR-3.29** — Custodian approve/override | Approve has a confirmation and sets `CONDEMNED_BER` + `RETIRED`. Override requires a ≥10-character reason, records it and sets `UNDER_REPAIR`. Both write the decision user/time and a live audit entry. | RepairBer, AppDataContext |
| **FR-3.28** — low-value lots | Added `SeedLot`, two seeded lots (A4 paper, thermal paper), `unitCost` on items, a policy cut-off, a Lots inventory tab, a lot card in Master Ledger, and an Issue-quantity dialog. Lot issues reduce `qtyOnHand` and forecast stock without creating per-unit QR records. | types, seed, AppDataContext, LabInventory, MasterLedger, Reorder |
| **FR-3.27** — configurable dormancy | Added `dormantDays` policy and a current-threshold note in the Audit Queue dormant tab. Seed wording no longer hardcodes 60 days. | PolicySettingsDialog, AuditQueue, seed |
| **FR-3.24 / NFR-S2** — audit attribution | Repair approval, return to service, recommendation, condemnation approval/override and lot issue now append live audit entries. | RepairBer, LabInventory, AppDataContext, CentralDashboard |

### Data and seed changes

- Added policy values: `berThresholdPct: 50`, `dormantDays: 60`, `lotUnitCostCutoff: 500`.
- Added `unitCost` to every item.
- Removed the two A4 per-unit records (`BP-A4-0028`, `BP-A4-0031`); A4 is now a lot.
- Added `LOT-A4-2026-001` (40 reams on hand) and `LOT-THRM-2026-001` (10 rolls on hand).
- Added `CD-2026-0019` as a `RECOMMENDED` condemnation for `WIL-3DP-002` at 55.3% BER.
- Added a seeded condemnation recommendation to the live audit log.
- Unit count is now **27**; lots are **2**.

### UI placement choices (not specified by the SRS)

1. **Lots** is a fourth tab in Lab Inventory; the lot card is appended to Master Ledger. The SRS
   requires lot records and quantity issue, not a specific tab.
2. **Issue quantity** uses a dialog with a 1..qtyOnHand validation.
3. **Condemnation recommendation** appears as a card above the quote form; approving uses a
   confirmation dialog, overriding uses a reason dialog.
4. **Print form** uses browser print with an `.ea-print-area` print rule. The SDD’s production PDF
   generator remains backend work.
5. **Lot cut-off 500** is a labelled sample because the SRS value is still bracketed.
6. **Print** is implemented for the condemnation form only in this pass; QR/PR print can reuse the
   same rule in a later pass.

### Verification for Pass 3

- `npm run build` passes.
- 17 routes re-swept at 598 and 390: one `h1` each, no page-level overflow, no console errors.
- Lighthouse after Module 3:
  - Repair & BER, Master Ledger, Central Dashboard, Audit Queue: **100/100/100**
  - Lab Inventory: **100/100/100**
- Flow checks:
  - A4 lot issue reduced on-hand from 40 to 35; forecast stock and the live audit log updated.
  - Seeded `CD-2026-0019` displayed as `RECOMMENDED · AWAITING CUSTODIAN`; the system did not
    condemn the unit automatically.
  - Override required a ≥10-character reason, recorded it and left the unit `UNDER_REPAIR`.
  - Approval confirmation sets the unit `CONDEMNED_BER` + `RETIRED`; the form is ready to print.
  - Threshold labels/bars track the policy value.
- Known limits:
  - The CIT Property Office’s actual form fields are still not supplied; the current layout is the
    documented prototype format.
  - The 500 lot cut-off is a sample placeholder.
  - Lot intake (creating a lot from Receive New Items) is Module 4.
  - Real PDF generation and server-side append-only auditing remain backend work.

## Verification for Pass 1

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
