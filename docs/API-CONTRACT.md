# EduAsset API Contract (draft)

**Status:** revision-2 draft. The foundation and Modules 1–3 are updated from
`EduAsset_SRS_Revised.docx` and the SDD; Module 4 still describes the old design and will be updated
in its pass.
**Audience:** backend implementation (Spring Boot + PostgreSQL on Supabase, per SDD v2).
**Base URL:** `/api` — JSON over HTTPS.

This is a **handoff draft**, not an implemented API. It defines the resources, payloads and rules the
prototype implies. Field names are suggestions; keep the semantics and validation rules.

---

## 1. Conventions

- JSON, UTF-8, `Content-Type: application/json` (except photo uploads).
- IDs are strings (`KB-0152`, `RQ-1021`, `WIL-PRN-01`) — never expose auto-increment integers.
- Timestamps are ISO 8601 with timezone (`2026-11-19T10:42:00+08:00`).
- Authentication: `Authorization: Bearer <JWT>`.
- List endpoints support `page`, `size`, `q`, and the filters named per endpoint.
- Errors use one shape:

```json
{
  "timestamp": "2026-11-19T10:42:00+08:00",
  "status": 409,
  "code": "INVALID_STATUS_TRANSITION",
  "message": "RETURNED_EMPTY cannot move to IN_USE.",
  "fieldErrors": [{ "field": "quantity", "message": "Must be between 1 and 500." }]
}
```

- The audit log is append-only. There is no update/delete endpoint for audit entries.
- The AI API key lives only on the backend. No client response may contain it.

---

## 2. Roles

| Role | Portal | Can |
|---|---|---|
| `LAB_ASSISTANT` | WIL Lab | Requisition, turnover scan, report incident, view lab inventory/work orders |
| `LAB_MANAGER` | WIL Lab | Same as Lab Assistant, plus approve lab-side actions if assigned |
| `CENTRAL_CUSTODIAN` | Central | Alerts, forecast settings, PR forms, requisition review, turnover approval, ledger, repairs, replacements, reconciliation, audit queue, intake |
| `SECOND_APPROVER` | Central | Confirm a verified replacement (two-person rule) |
| `TECHNICIAN` | none | Receives work orders/quotes outside the pilot; not an authenticated portal user |

`CENTRAL_CUSTODIAN` cannot act as the second approver on the same replacement; enforce distinct users.

---

## 3. Enums

Store these as canonical tokens.

| Enum | Values |
|---|---|
| `InventoryStatus` | `IN_STOCK`, `IN_USE`, `RETURNED_EMPTY`, `RETURNED_PARTIAL`, `RETIRED` |
| `HealthState` | `OPERATIONAL`, `NEEDS_MAINTENANCE`, `UNDER_REPAIR`, `CONDEMNED_BER`, `NOT_APPLICABLE` |
| `ItemCategory` | `DURABLE`, `CONSUMABLE` |
| `VarianceBand` | `NORMAL`, `ELEVATED`, `ABNORMAL`, `NO_BASELINE` |
| `RequisitionStatus` | `PROCESSED`, `LOCKED`, `APPROVED`, `REJECTED` |
| `TurnoverStatus` | `AWAITING_SCAN`, `READY_TO_APPROVE`, `AWAITING_APPROVAL`, `RELEASED` |
| `TurnoverExceptionType` | `FIRST_INSTALL`, `DEFECTIVE_ON_ARRIVAL` |
| `RepairDecision` | `REPAIR_APPROVED`, `UNDER_REPAIR`, `RETURNED_TO_SERVICE`, `RECOMMENDED`, `CONDEMNED`, `OVERRIDDEN` |
| `CondemnationStatus` | `RECOMMENDED`, `APPROVED`, `OVERRIDDEN` |
| `ReplacementStatus` | `DRAFT`, `OLD_UNIT_VERIFIED`, `PENDING_SECOND_APPROVAL`, `COMPLETED`, `REJECTED` |
| `AuditFlagType` | `DUPLICATE_REPLACEMENT`, `RETIRED_RESCAN`, `UNIT_AGE`, `LOCATION_RATE`, `REJECTED_REPLACEMENT`, `DORMANT`, `VARIANCE`, `RECONCILIATION` |
| `IncidentType` | `DEFECT`, `JAM`, `BROKEN` |
| `WorkOrderStatus` | `TICKET_DISPATCHED`, `QUOTE_RECEIVED`, `AWAITING_DECISION`, `CLOSED_REPAIRED`, `CLOSED_REPLACED` |

**Status transitions enforced server-side** (reject anything else):

- `IN_STOCK → IN_USE → RETURNED_EMPTY | RETURNED_PARTIAL | RETIRED`
- `IN_USE ↔ RETURNED_PARTIAL` for filament spools (FR-2.11)
- `CONDEMNED_BER → RETIRED` (terminal; can never be issued)
- `AWAITING_SCAN → READY_TO_APPROVE → RELEASED`
- `DRAFT → OLD_UNIT_VERIFIED → PENDING_SECOND_APPROVAL → COMPLETED | REJECTED`
- Repair: `NEEDS_MAINTENANCE → UNDER_REPAIR → OPERATIONAL | CONDEMNED_BER`

---

## 4. Auth

### `POST /auth/login`

```json
{ "email": "custodian@cit.edu", "password": "…", "portal": "CENTRAL" }
```

`portal`: `CENTRAL` | `LAB`. Returns the user, role and token. Reject a lab user selecting the Central
portal (and vice versa) with `403 WRONG_PORTAL`.

```json
{
  "token": "…",
  "user": { "id": "usr_01", "name": "Property Custodian", "role": "CENTRAL_CUSTODIAN", "portal": "CENTRAL" }
}
```

### `GET /auth/me`
Returns the authenticated user and role. Every audit entry must carry this user.

---

## 5. Module 1 — Demand, alerts and requisitions

### `GET /items/{itemId}/forecast`

```json
{
  "itemId": "TNR",
  "name": "HP LaserJet Toner W9004MC",
  "stock": 2,
  "brWindow": 0.21,
  "brSeason": 0.14,
  "burnRate": 0.21,
  "windowDays": 14,
  "basis": "14_DAY",
  "daysToDepletion": 9.3,
  "leadTimeDays": 21,
  "safetyBufferDays": 7,
  "triggerDays": 28,
  "status": "ALERT_PR_DRAFTED",
  "projectedDemand": 6
}
```

`basis` is `14_DAY`, `42_DAY_LOW_VOLUME`, `LAST_TERM_SEASONAL` or `NO_RECENT_USE`.

Computation (FR-1.03/1.04, SDD §5.1):

```
w = issues14 < policy.lowVolumeIssueThreshold
    ? policy.lowVolumeWindowDays
    : policy.forecastWindowDays
BR_w = issues in the last w days / w
BR_season = last-term issues in the same weeks / (leadTimeDays + safetyBufferDays)
BR = max(BR_w, BR_season)
daysToDepletion = BR > 0 ? stock / BR : null
status = BR == 0 ? "NO_RECENT_USE"
       : daysToDepletion <= triggerDays ? "ALERT_PR_DRAFTED" : "OK"
```

When `status = NO_RECENT_USE`, `daysToDepletion` is `null` and no Purchase Requisition is generated.

### `PUT /items/{itemId}/forecast-settings`
`CENTRAL_CUSTODIAN`. Body: `{ "leadTimeDays": 21, "safetyBufferDays": 7 }`.
Validate `leadTimeDays` 14–21 and `safetyBufferDays` 0–30 (integers). Forecast window lengths are
policy values and are changed through `/settings/policy`, not per item.

### `GET /settings/policy` / `PUT /settings/policy`
`CENTRAL_CUSTODIAN`. Reads or updates the policy values used by Module 1 (and later modules):

```json
{
  "varianceNormalPct": 25,
  "varianceLockPct": 50,
  "forecastWindowDays": 14,
  "lowVolumeWindowDays": 42,
  "lowVolumeIssueThreshold": 3,
  "berThresholdPct": 50,
  "dormantDays": 60,
  "lotUnitCostCutoff": 500
}
```

Validate `0 <= varianceNormalPct < varianceLockPct <= 100`; window days 1–180; low-volume
threshold 1–20; BER 1–100; dormancy 1–365; lot cut-off > 0. The SRS leaves the lot cut-off
bracketed; 500 is a sample value until the Property Office supplies the actual amount.
Every change is audited with the actor and timestamp.

### `GET /reorder-alerts`
Query: `tab=ALL|ALERT|OK`. Returns the forecast rows plus `purchaseRequisitionId` when an alert exists.

### `POST /reorder-alerts/recalculate`
Recomputes forecasts; returns the updated list. This is the dashboard's **Recalculate** action.
In the prototype, receiving a consumable adds to stock, and turnover release / lot issue decrement
stock and increment the 14-day and 42-day issuance counts.

### `GET /items/{itemId}/purchase-requisition`
Returns the pre-generated PR: `prNumber`, item, requesting unit, current stock, `brWindow`,
`brSeason`, `burnRate`, `basis`, days to depletion, trigger, projected demand, requested quantity,
status. The client can print this payload with browser print; the production PDF is generated by the
backend.

### `GET /requisitions?status=` / `GET /requisitions/term-report?term=`
The term report returns the counts required by FR-1.16:
`{ "flagged": 3, "confirmed": 0, "rejected": 1, "pending": 2 }`.

### `POST /requisitions`
`LAB_ASSISTANT` / `LAB_MANAGER`.

```json
{ "itemId": "A4", "quantity": 4, "labId": "WIL-LAB-3", "justification": null }
```

Server computes the pro-rated expected volume and variance (FR-1.10, FR-1.15):

```
E = H_base * weeksElapsed / weeksInTerm      // null when H_base == 0 or no past term
C_t = currentTermVolume + quantity
V = E == null ? null : (C_t - E) / E * 100
```

Bands and status:

| Condition | Band | Status |
|---|---|---|
| `E == null` | `NO_BASELINE` | `LOCKED` — manual review, collect-baseline mode |
| `V <= varianceNormalPct` (including V < 0) | `NORMAL` | `PROCESSED` |
| `varianceNormalPct < V < varianceLockPct` | `ELEVATED` | `APPROVED` after a justification is supplied |
| `V >= varianceLockPct` | `ABNORMAL` | `LOCKED` — write `VARIANCE` audit flag |

Response: the requisition with `baselineVolume`, `expectedVolume`, `currentTermVolume`,
`variancePercent` (nullable), `band`, `weeksElapsed`, `weeksInTerm` and `status`.

### `GET /requisitions/{id}`
### `POST /requisitions/{id}/approve` / `POST /requisitions/{id}/reject`
`CENTRAL_CUSTODIAN`. Reject requires `reason` of **at least 10 characters**; both write an audit entry.

---

## 6. Module 2 — 1-to-1 turnover and machine slots

A machine slot is the 1-to-1 consumable position on a machine (for example `WIL-PRN-01/Black`).
At most one `IN_USE` unit may occupy a slot.

### `GET /turnovers?status=`
Returns turnover requests with `machineId`, `slotId`, `itemId`, `oldAssetId` (nullable),
`oldStatus` (nullable), `newAssetId`, `status`, `exceptionType`, `exceptionReason` and timestamps.

### `POST /turnovers`
`LAB_ASSISTANT` / `LAB_MANAGER`. Body: `{ "slotId": "PRN01-BLK", "newAssetId": "TNR-WIL-2026-002" }`.
Requires an `IN_USE` unit in the slot; otherwise return `409 EMPTY_SLOT` and direct the user to the
exception endpoint. Creates `AWAITING_SCAN`.

### `POST /turnovers/exceptions`
`LAB_ASSISTANT` / `LAB_MANAGER`.
Body: `{ "slotId": "PRN01-DRM", "newAssetId": "DRM-WIL-2026-005", "exceptionType": "FIRST_INSTALL", "reason": "No drum was installed when the machine was delivered." }`.
`exceptionType`: `FIRST_INSTALL` or `DEFECTIVE_ON_ARRIVAL`; `reason` is required and logged. Creates
`AWAITING_APPROVAL` and a `TURNOVER_EXCEPTION` audit flag.

### `POST /turnovers/{turnoverId}/scan`
`LAB_ASSISTANT` / `LAB_MANAGER`.
Body: `{ "assetId": "FIL-WIL-2026-014", "returnCondition": "EMPTY" | "PARTIAL" }`.

- If `assetId` matches the unit `IN_USE` in the turnover’s slot: set it to `RETURNED_EMPTY` or
  `RETURNED_PARTIAL`, clear its slot, set the turnover to `READY_TO_APPROVE`, and return
  `{ "match": true, "oldStatus": "RETURNED_PARTIAL" }`.
- Return `PARTIAL` only for an item flagged as a partial-return spool (FR-2.11). A partial spool is
  not counted as a new unit and may be re-issued later.
- Otherwise: keep issuance locked, write a `MISMATCH` audit entry with actor + timestamp, and return
  `409 SPENT_UNIT_MISMATCH` with `{ "match": false }`.

### `PUT /turnovers/{turnoverId}/approve`
`CENTRAL_CUSTODIAN`. Allowed for `READY_TO_APPROVE` or `AWAITING_APPROVAL`. Sets the new unit
`IN_USE` in the turnover’s slot, assigns `slotId`, logs the release, and returns `RELEASED`. For a
first-install or defective-on-arrival exception, the reason and decision are preserved in the audit
log.

### `GET /labs/{labId}/inventory`
Returns machine rows with `machineId`, `slotId`, `slotName`, the active `unitId` or `null`, and
1-to-1 consumable lot/partial status. Partial spools are returned with `inventoryStatus =
RETURNED_PARTIAL` and no slot until re-issued.

### `POST /units/{assetId}/reissue`
`LAB_ASSISTANT` / `LAB_MANAGER`. Re-issues a `RETURNED_PARTIAL` spool into an empty compatible slot.
Requires the slot to be empty; sets the unit `IN_USE` and assigns `slotId`. It never creates a new
unit record.

---

## 7. Module 3 — Units, repairs, replacements, integrity

### `GET /units?q=&category=&inventoryStatus=&page=&size=`
Unit-tracked records only; lot items are returned by `/lots`.
### `GET /units/{assetId}`
Returns the unit record + history. History entries are `{ event, actor, at }`, append-only.

### `PATCH /units/{assetId}`
`CENTRAL_CUSTODIAN`. `{ "serialNumber": "CR3V3P-88120", "requireOneToOne": true }`.
`serialNumber` is optional and may be cleared. Writes a history entry.

### `POST /units/{assetId}/reprint-qr`
Returns/queues a printable label. QR payload is `/items/{assetId}` per the SDD; the scanner also
accepts a raw asset ID. Status is
never encoded.

### `POST /incidents`
`LAB_ASSISTANT` / `LAB_MANAGER`. Multipart: `assetId`, `type` (`DEFECT|JAM|BROKEN`), `recurring`,
`description`, `photo` (required).
If `recurring = true`: set `NEEDS_MAINTENANCE` and create a work order (`TICKET_DISPATCHED`), per FR-3.11.

### `GET /work-orders?status=`
### `POST /units/{assetId}/repairs`
Body: `{ "quoteAmount": 5000, "repairable": true }`. Stores the pending quote and computes
`BER = ((cumulativeRepairCost + pendingQuote) / replacementValue) * 100` against
`policy.berThresholdPct`. A quote is required for a repairable decision; when `repairable = false`,
the recommendation can be created from the cumulative repair history alone.

- Repairable and below threshold: approve the repair, append the invoice, set `UNDER_REPAIR`.
- Not repairable or at/above threshold: return a **recommendation**, not a condemnation. The system
  never condemns an asset by itself. Response includes `condemnationId`, `berPct`, `status =
  RECOMMENDED` and the pre-filled form number.

### `POST /repairs/{assetId}/return-to-service`
Allowed only when `UNDER_REPAIR` and no pending quote at/above the configured threshold. Sets
`OPERATIONAL`, keeps the same asset ID/QR/history.

### `PUT /condemnations/{id}/decision`
`CENTRAL_CUSTODIAN`.

```json
{ "decision": "APPROVE" | "OVERRIDE", "reason": "Required when overriding" }
```

- `APPROVE`: condemnation status `APPROVED`; unit becomes `CONDEMNED_BER` and inventory `RETIRED`;
  the unit can never be issued again.
- `OVERRIDE`: reason required; condemnation status `OVERRIDDEN`; unit returns to `UNDER_REPAIR` and
  repair is approved. `decidedBy`, `decisionReason` and `decidedAt` are stored and audited.

### `GET /condemnations/{id}/pdf`
Returns the pre-filled CIT Property Office condemnation/disposal form with property tag,
description, serial (if any), location/custodian, replacement value, BER %, maintenance expense
ledger and decision status.

### `GET /lots?itemId=`
Returns lot records for low-value non-returned consumables below the policy cut-off:
`lotId`, `itemId`, `deliveryRecordId`, `qtyReceived`, `qtyOnHand`, `location`, `receivedAt`.

### `POST /lots/{lotId}/issue`
`LAB_ASSISTANT` / `LAB_MANAGER`. Body: `{ "quantity": 5 }`. Reduces `qtyOnHand`; writes an issuance
row and audit entry; never creates a per-unit QR code. Forecast stock for a lot item includes
`qtyOnHand`. Quantity must be a whole number from 1 to `qtyOnHand`.

### `GET /replacements/candidates?requestId=`
Only `IN_STOCK` units with no issue/usage history and a delivery record dated after the request.

### `POST /replacements`
`{ "oldAssetId": "KB-0007", "reason": "Broken keyboard at WIL workstation 5", "requesterId": "…" }`

### `POST /replacements/{id}/scan-old`
`{ "assetId": "KB-0007" }` — must match the old unit; otherwise `409 OLD_UNIT_MISMATCH`.

### `POST /replacements/{id}/verify-new`
`{ "newAssetId": "KB-0152" }` — runs the four rules:
old retired/repair, new `IN_STOCK` never issued, delivery after request, IDs differ.
Returns `{ "valid": true, "rules": [{ "code": "OLD_RETIRED", "passed": true, "note": "…" }] }`.

### `POST /replacements/{id}/submit`
Multipart: old photo, new photo, `secondApproverId`. Moves to `PENDING_SECOND_APPROVAL`;
both photos are mandatory.

### `POST /replacements/{id}/confirm`
`SECOND_APPROVER`, must be a different user. Sets old `RETIRED`, new `IN_USE` at the location,
stores the old→new link, verifier and timestamps.

### `POST /replacements/{id}/reject`
`{ "reason": "Previously issued unit" }`. Logs the attempt and creates a `REJECTED_REPLACEMENT`
audit flag.

### `GET /reconciliation-sessions`
### `POST /reconciliation-sessions`
`{ "roomId": "WIL-LAB-3", "frequency": "WEEKLY" }` — scheduled scan (FR-3.26). `frequency`:
`ONCE|WEEKLY|MONTHLY`; returns `nextScanAt`.

### `POST /reconciliation-sessions/{id}/scans`
`{ "assetId": "WS-0301" }` — idempotent per session; duplicates rejected.

### `POST /reconciliation-sessions/{id}/finish`
Compares scans with the room's expected units; returns `matched`, `missing`, `unexpected`, and creates
one `RECONCILIATION` audit flag per discrepancy.

### `GET /audit-flags?type=&reviewed=`
### `POST /audit-flags/{id}/review`
`{ "note": "Checked the replacement request and confirmed the duplicate." }`
Note is **required and at least 10 characters**; stores reviewer + timestamp and moves the flag to
reviewed. Flag types: duplicate replacement, retired re-scan, unit age, location rate, rejected
replacement, dormant, variance, reconciliation.

---

## 8. Module 4 — AI-assisted intake

### `GET /delivery-records?type=DR|PO`
Returns `DR-118`, `DR-119`, `PO-2026-0031` etc. A unit may only enter through one of these (FR-3.07/4.01).

### `POST /intake`
`{ "deliveryRecordId": "DR-118" }` — starts an intake and returns `intakeId`.

### `POST /intake/{id}/photo`
Multipart image. Backend forwards it to the vision AI and returns **only**:

```json
{ "suggestedName": "Keyboard", "suggestedCategory": "DURABLE_PERIPHERAL", "confidence": 0.92 }
```

Never return quantity, serial, age or "newness" from the AI (FR-4.04/4.10). API key stays server-side.
On timeout/error return `503 AI_UNAVAILABLE`; the client offers manual registration (FR-4.09).

### `POST /intake/{id}/manual`
`{ "name": "Keyboard", "category": "DURABLE_PERIPHERAL" }` — manual fallback.

### `POST /intake/{id}/confirm`
`CENTRAL_CUSTODIAN`.

```json
{
  "name": "Keyboard",
  "category": "DURABLE_PERIPHERAL",
  "quantity": 5,
  "location": "Property storeroom",
  "unitCost": 650,
  "requireOneToOne": false,
  "serials": ["", "", "", "", ""]
}
```

`quantity` 1–500 and must be staff-typed (never AI-derived). `serials` are optional and per unit
(FR-3.02/4.08).

The save branch follows FR-3.28 as well as FR-4.08:

- If the item is a consumable, is **not** flagged 1-to-1, and `unitCost <= policy.lotUnitCostCutoff`,
  create one `consumable_lot` with `qty_received` and `qty_on_hand`; update the item's forecast stock.
  Do not generate asset IDs or QR codes. Return `{ "lot": { ... }, "labels": [] }`.
- Otherwise create one `IN_STOCK` unit per quantity, generate asset IDs + QR values, link each to the
  delivery record, and return the printable label sheet.

A new lot item gets a forecast row with zero issuance history and a `NO_RECENT_USE` status until it
is issued. The client mirrors both branches.

### `GET /intake/{id}/labels`
Returns `[{ "assetId": "KB-0155", "qrPayload": "KB-0155", "deliveryRecordId": "DR-118" }]` for printing.
Returns `[]` for a lot intake because lots have no per-unit QR codes.

---

## 9. Cross-cutting rules

- **Audit:** every scan and transaction writes `{ actorId, account, action, entity, at, detail }`.
  No mutation endpoints; the UI shows the history read-only.
- **Status:** invalid transitions return `409 INVALID_STATUS_TRANSITION` and are never stored
  (NFR-R3).
- **AI:** the backend alone talks to the vision service; timeout ≤ 10 s then fallback (NFR-P3/S4).
- **QR:** payload is `/items/{assetId}` per the SDD, with a raw asset ID accepted as a fallback; the
  database decides status (FR-3.03). The browser decodes camera frames locally (`jsqr`) and never
  uploads them; typed entry remains the fallback.
- **Photos:** incident and replacement photos are required; store a URL/reference, not a blob.
- **Two-person replacement:** the second approver must be a different authenticated user.
- **Validation:** rejection/review notes ≥ 10 chars; requisition quantity 1–100; intake quantity 1–500;
  lead time 14–21; safety buffer 0–30; BER threshold 50%.

---

## 10. Suggested tables

`users`, `roles`, `items`, `units`, `unit_history`, `delivery_records`, `requisitions`,
`requisition_events`, `turnovers`, `turnover_scans`, `incidents`, `work_orders`, `repair_quotes`,
`repair_invoices`, `replacements`, `replacement_evidence`, `reconciliation_sessions`,
`reconciliation_scans`, `audit_flags`, `audit_log`, `intake_sessions`.

Keep `audit_log` append-only (no UPDATE/DELETE grants for the application role), and store money as
`DECIMAL(12,2)`.
